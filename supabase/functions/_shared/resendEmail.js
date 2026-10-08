/**
 * Shared Resend mailer (Step 5c). Single place that talks to the Resend API so
 * sendEmailNotification and the DB-trigger automation functions send identical
 * envelopes. Mirrors base44/functions/sendEmailNotification's payload exactly.
 *
 * Env: RESEND_API_KEY (required), FROM_NAME / FROM_EMAIL (preferred) with the
 * Base44-era VITE_FROM_NAME / VITE_FROM_EMAIL still honored as fallbacks.
 */
import { escapeHtml, safeSubject } from './escapeHtml.js';
import {
  UNSUBSCRIBE_PLACEHOLDER, SUPPRESSIBLE_CATEGORIES, unsubscribeLinks, isSuppressed,
} from './unsubscribe.js';

export function resendConfigured() {
  return Boolean(Deno.env.get('RESEND_API_KEY'));
}

/**
 * Send one email. Returns { ok, id?, error?, details?, suppressed? } — never
 * throws, so fire-and-forget callers can't crash a trigger path on mailer
 * trouble.
 *
 * `category`: 'reminder' | 'digest' | 'welcome' mark NON-transactional mail.
 * Those are skipped for addresses in public.email_suppressions (returned as
 * { ok: true, suppressed: true }, i.e. handled — not a failure to retry) and
 * carry List-Unsubscribe + one-click headers. Anything else (default) is
 * transactional and always sent. Every email's %%UNSUBSCRIBE_URL%% footer
 * placeholder becomes the recipient's signed unsubscribe link.
 */
export async function sendResendEmail({ to, toName, subject, html, text, replyTo, category }) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' };
  const cleanSubject = safeSubject(subject);
  if (!to || !cleanSubject || (!html && !text)) {
    return { ok: false, error: 'Missing required fields: to, subject, html' };
  }

  const fromName = Deno.env.get('FROM_NAME') || Deno.env.get('VITE_FROM_NAME') || 'KOACH AI';
  const configuredFrom = Deno.env.get('FROM_EMAIL') || Deno.env.get('VITE_FROM_EMAIL');
  if (!configuredFrom) {
    console.error('[resendEmail] WARNING: FROM_EMAIL (and VITE_FROM_EMAIL) not set — '
      + 'falling back to onboarding@resend.dev. Set FROM_EMAIL to a verified sender domain.');
  }
  const fromEmail = configuredFrom || 'onboarding@resend.dev';

  const suppressible = SUPPRESSIBLE_CATEGORIES.has(category);
  if (suppressible) {
    try {
      if (await isSuppressed(to)) return { ok: true, suppressed: true };
    } catch (e) {
      // Fail closed: never mail an address we can't confirm hasn't opted out.
      return { ok: false, error: e.message };
    }
  }
  const plainPage = `${Deno.env.get('APP_URL') || 'https://app.koachai.net'}/unsubscribe`;
  const links = await unsubscribeLinks(to).catch(() => ({ pageUrl: plainPage, oneClickUrl: null }));

  // Display name is user/coach-controlled: strip quote, backslash, CR/LF and
  // angle brackets (header/address injection), then quote it.
  const cleanName = String(toName ?? '').replace(/["\\\r\n<>]/g, '').trim();

  const payload = {
    from: `${fromName} <${fromEmail}>`,
    // Base44's trigger functions addressed recipients as "Name <email>"
    to: cleanName ? [`"${cleanName}" <${to}>`] : [to],
    subject: cleanSubject,
    // Base44's Core.SendEmail took plain-text `body`; preserve those callers by
    // accepting `text` and wrapping it, while html callers pass through as-is.
    html: (html || `<pre style="font-family:inherit;white-space:pre-wrap;margin:0">${escapeHtml(text)}</pre>`)
      .split(UNSUBSCRIBE_PLACEHOLDER).join(links.pageUrl),
  };
  if (replyTo) payload.reply_to = replyTo;

  // RFC 2369 / RFC 8058: mailbox providers show an "Unsubscribe" button and
  // POST to the one-click URL (supabase/functions/unsubscribe), which records
  // the opt-out without the recipient signing in.
  if (suppressible && links.oneClickUrl) {
    payload.headers = {
      'List-Unsubscribe': `<${links.oneClickUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: result.message || 'Resend API error', details: result };
    }
    return { ok: true, id: result.id };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
