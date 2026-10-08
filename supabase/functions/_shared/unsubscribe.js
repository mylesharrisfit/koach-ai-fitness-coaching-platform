/**
 * Email unsubscribe: signed per-address tokens + the suppression check.
 *
 * A link carries `e` (the address, base64url) and `t` (HMAC-SHA256 of the
 * normalized address). Tokens don't expire — an unsubscribe link in an old
 * email must keep working — and only prove "whoever holds this was sent mail
 * at that address". Verifying them needs the signing secret, so they can't be
 * forged for other addresses.
 *
 * Secret: UNSUBSCRIBE_SIGNING_SECRET, else derived from SUPABASE_JWT_SECRET
 * with a fixed prefix (a different key than the JWT one, so a token is never
 * usable as anything else). No secret → no signed links (callers fall back to
 * the plain /unsubscribe page) and the endpoint refuses.
 *
 * Dependency-free (WebCrypto + fetch) so Node verification scripts import it.
 */

/** Footer placeholder; sendResendEmail swaps it for the recipient's signed link. */
export const UNSUBSCRIBE_PLACEHOLDER = '%%UNSUBSCRIBE_URL%%';

/** Non-transactional mail: honors suppressions and carries List-Unsubscribe. */
export const SUPPRESSIBLE_CATEGORIES = new Set(['reminder', 'digest', 'welcome']);

const enc = new TextEncoder();
const env = (k) => globalThis.Deno?.env?.get?.(k);

export const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(str) {
  const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function unsubscribeSecret() {
  const own = env('UNSUBSCRIBE_SIGNING_SECRET');
  if (own) return own;
  const jwt = env('SUPABASE_JWT_SECRET');
  return jwt ? `koach-unsubscribe-v1:${jwt}` : null;
}

const hmacKey = (secret, usage) =>
  crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);

/** { e, t } for an address. */
export async function signUnsubscribeToken(email, secret) {
  const norm = normalizeEmail(email);
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret, 'sign'), enc.encode(norm));
  return { e: b64url(enc.encode(norm)), t: b64url(new Uint8Array(sig)) };
}

/** The normalized address if (e, t) is valid, else null. Constant-time check. */
export async function verifyUnsubscribeToken(e, t, secret) {
  try {
    if (!e || !t || !secret) return null;
    const norm = normalizeEmail(new TextDecoder().decode(fromB64url(e)));
    if (!norm.includes('@')) return null;
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret, 'verify'), fromB64url(t), enc.encode(norm));
    return ok ? norm : null;
  } catch {
    return null;
  }
}

/**
 * Links for one recipient: the human page (footer) and the RFC 8058 one-click
 * endpoint (List-Unsubscribe header). Without a secret only the plain page.
 */
export async function unsubscribeLinks(email, {
  appUrl = env('APP_URL') || 'https://app.koachai.net',
  functionsBase = env('SUPABASE_URL') ? `${env('SUPABASE_URL')}/functions/v1` : null,
  secret = unsubscribeSecret(),
} = {}) {
  if (!secret || !email) return { pageUrl: `${appUrl}/unsubscribe`, oneClickUrl: null };
  const { e, t } = await signUnsubscribeToken(email, secret);
  const q = `e=${e}&t=${t}`;
  return {
    pageUrl: `${appUrl}/unsubscribe?${q}`,
    oneClickUrl: functionsBase ? `${functionsBase}/unsubscribe?${q}` : null,
  };
}

/**
 * Is this address suppressed? Reads public.email_suppressions with the
 * service key over PostgREST. Throws when it can't tell, so callers fail
 * closed (an opt-out must never be ignored because a lookup errored).
 */
export async function isSuppressed(email, {
  supabaseUrl = env('SUPABASE_URL'),
  serviceKey = env('SUPABASE_SERVICE_ROLE_KEY'),
  fetchImpl = fetch,
} = {}) {
  if (!supabaseUrl || !serviceKey) throw new Error('suppression check: SUPABASE_URL / service key not configured');
  const url = `${supabaseUrl}/rest/v1/email_suppressions?select=email&email=eq.${encodeURIComponent(normalizeEmail(email))}`;
  const res = await fetchImpl(url, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
  if (!res.ok) throw new Error(`suppression check failed: HTTP ${res.status}`);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0;
}
