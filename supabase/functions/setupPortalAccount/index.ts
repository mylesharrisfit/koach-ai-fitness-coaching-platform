// Supabase Edge Function: setupPortalAccount  (Migration Step 3b, point 4)
//
// The DECISION (documented in SCHEMA_MIGRATION.md): a portal client gets a
// REAL Supabase Auth account, linked to their Client row via
// clients.portal_user_id. The invite token is a ONE-TIME bootstrap, not a
// per-session credential. Rationale:
//   - the ClientSetup UI already collects a password;
//   - portal access must outlive the 7-day invite window;
//   - a real account gives password reset + revocation for free and lets
//     app.is_portal_client() resolve via portal_user_id = auth.uid() (the
//     durable path) instead of a re-minted claim every hour.
//
// Flow: validate token (hash → lookup → expiry) → create-or-fetch an auth
// user for the client's email with the chosen password → link portal_user_id
// → INVALIDATE the invite token (clear hash + expiry) so the link is single
// use. The client then signs in normally with email + password.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { hashInviteToken, isTokenLive } from '../_shared/portalToken.js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  try {
    const { token, password } = await req.json();
    if (!token) return json({ error: 'No token provided' }, 400);
    if (!password || password.length < 6) return json({ error: 'Password must be at least 6 characters' }, 400);

    const tokenHash = await hashInviteToken(token);
    const admin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } }
    );

    const { data: client, error: cErr } = await admin
      .from('clients')
      .select('id, name, email, invite_token_expires, portal_user_id')
      .eq('invite_token_hash', tokenHash)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!client) return json({ error: 'Invalid or expired invite' }, 400);
    if (!isTokenLive(client.invite_token_expires)) return json({ error: 'Invite has expired' }, 400);
    if (!client.email) return json({ error: 'Client has no email on file' }, 400);

    // Create the auth user (or reuse if this client already has one linked).
    let portalUserId = client.portal_user_id;
    if (!portalUserId) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: client.email,
        password,
        email_confirm: true, // holding the emailed invite proves email ownership
        user_metadata: { full_name: client.name, portal_client_id: client.id },
      });
      if (createErr) {
        // Email may already have an account (e.g. they're also a coach) — link it.
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users?.find((u) => u.email?.toLowerCase() === client.email.toLowerCase());
        if (!existing) return json({ error: createErr.message }, 400);
        portalUserId = existing.id;
        await admin.auth.admin.updateUserById(existing.id, { password });
      } else {
        portalUserId = created.user.id;
      }
    } else {
      // Re-run of setup for an already-linked client → reset the password.
      await admin.auth.admin.updateUserById(portalUserId, { password });
    }

    // Link the account and single-use the invite in one update.
    const { error: linkErr } = await admin
      .from('clients')
      .update({ portal_user_id: portalUserId, invite_token_hash: null, invite_token_expires: null })
      .eq('id', client.id);
    if (linkErr) throw linkErr;

    return json({ success: true, email: client.email, client_id: client.id });
  } catch (err) {
    console.error('setupPortalAccount error:', err?.message ?? err);
    return json({ error: 'Server error' }, 500);
  }
});
