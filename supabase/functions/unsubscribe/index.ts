// Supabase Edge Function: unsubscribe
//
// Records an email opt-out from a signed link (_shared/unsubscribe.js). Two
// callers, both unauthenticated (verify_jwt = false in config.toml — the
// signed token IS the authorization, scoped to exactly one address):
//   - mailbox providers' RFC 8058 one-click: POST <List-Unsubscribe URL>
//     with ?e=&t= in the query and body "List-Unsubscribe=One-Click";
//   - the app's /unsubscribe page: POST { e, t } as JSON after the recipient
//     clicks "Unsubscribe".
// GET is refused on purpose: link scanners prefetch URLs, and an opt-out must
// not happen without the recipient (or their mail client) asking for it.
// Suppression applies to non-transactional mail only (reminders, weekly
// digest, welcome) — see sendResendEmail's `category`.
import { serviceClient, cors, jsonResponse } from '../_shared/edgeClients.js';
import { verifyUnsubscribeToken, unsubscribeSecret } from '../_shared/unsubscribe.js';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST' }), {
      status: 405, headers: { ...cors, 'Content-Type': 'application/json', Allow: 'POST, OPTIONS' },
    });
  }
  try {
    const url = new URL(req.url);
    let e = url.searchParams.get('e');
    let t = url.searchParams.get('t');
    let oneClick = false;
    const type = req.headers.get('content-type') ?? '';
    if (type.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      e = e ?? body?.e ?? null;
      t = t ?? body?.t ?? null;
    } else {
      const form = new URLSearchParams(await req.text().catch(() => ''));
      oneClick = form.get('List-Unsubscribe') === 'One-Click';
    }

    const secret = unsubscribeSecret();
    if (!secret) return jsonResponse({ error: 'Unsubscribe is not configured' }, 500);
    const email = await verifyUnsubscribeToken(e, t, secret);
    if (!email) return jsonResponse({ error: 'invalid_link' }, 400);

    const { error } = await serviceClient().from('email_suppressions')
      .upsert({ email, source: oneClick ? 'one_click' : 'link' }, { onConflict: 'email', ignoreDuplicates: true });
    if (error) throw new Error(error.message);

    return jsonResponse({ unsubscribed: true, email });
  } catch (error) {
    console.error('unsubscribe error:', (error as Error).message);
    return jsonResponse({ error: 'Could not record the unsubscribe' }, 500);
  }
});
