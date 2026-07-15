// Supabase Edge Function: sendEmailNotification  (Migration Step 5c)
//
// Re-platform of base44/functions/sendEmailNotification — the Resend-backed
// mailer every other function defensively invokes (stripeWebhook, weeklyDigest,
// sendClientInvite, and the Step 5c DB-trigger automations).
//
// Auth: the Base44 version required auth.me(). Here we accept EITHER
//   - a verified user session (frontend / asCaller invocations), OR
//   - the service-role key (svc.functions.invoke from other edge functions and
//     the pg_net trigger path), detected by comparing the bearer token.
// Anonymous calls are rejected — this must not be an open relay.
//
// Env: RESEND_API_KEY, FROM_NAME/FROM_EMAIL (VITE_* fallbacks), plus the
// standard SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.
import { getCaller, cors, jsonResponse } from '../_shared/edgeClients.js';
import { sendResendEmail } from '../_shared/resendEmail.js';

function isServiceRoleCall(req) {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  return Boolean(serviceKey) && token === serviceKey;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    if (!isServiceRoleCall(req)) {
      const caller = await getCaller(req);
      if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { to, toName: _toName, subject, html, replyTo, templateKey } = await req.json();

    if (!to || !subject || !html) {
      return jsonResponse({ error: 'Missing required fields: to, subject, html' }, 400);
    }
    if (!Deno.env.get('RESEND_API_KEY')) {
      return jsonResponse({ error: 'RESEND_API_KEY not configured' }, 500);
    }

    const result = await sendResendEmail({ to, subject, html, replyTo });
    if (!result.ok) {
      return jsonResponse({ error: result.error || 'Resend API error', details: result.details }, 500);
    }

    return jsonResponse({ success: true, id: result.id, templateKey });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
});
