/**
 * Shared edge-function helpers for Supabase auth + service access (Step 5).
 *
 * Replaces the Base44 `createClientFromRequest(req)` pattern:
 *   base44.auth.me()                → getCaller(req)  (verified session + profile)
 *   base44.asServiceRole.entities.* → serviceClient().from('<table>')
 *
 * Ownership rule (Step 5a req. 4): coach-facing functions verify the caller's
 * session and only act on records that belong to that caller. Privileged
 * billing columns on `profiles` (stripe_*, subscription_*, billing_status) are
 * guarded by a DB trigger against non-service writes, so those updates MUST go
 * through the service client scoped to the caller's own id — never trust a
 * client-supplied customer/subscription id.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

/** Service-role client — bypasses RLS. For webhook writes + cross-tenant reads. */
export function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  );
}

/** Client scoped to the caller's JWT — RLS applies as that user. */
export function callerClient(req) {
  const authHeader = req.headers.get('Authorization') ?? '';
  return createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY'),
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
  );
}

/**
 * Verified caller: returns { auth, profile } or null if unauthenticated.
 * `profile` is the public.profiles row (stripe_customer_id, stripe_subscription_id,
 * role, had_trial, billing fields, …) — the same shape Base44's auth.me() exposed.
 */
export async function getCaller(req) {
  const caller = callerClient(req);
  const { data: { user }, error } = await caller.auth.getUser();
  if (error || !user) return null;
  // Read the profile via service role so a missing profiles SELECT policy or
  // recursion can't hide the caller's own row.
  const svc = serviceClient();
  const { data: profile } = await svc.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return { auth: user, profile: profile ?? { id: user.id, email: user.email } };
}

// ownsClient moved to _shared/ownership.js (dependency-free so node-based
// rehearsals can import it); re-exported here for existing importers.
export { ownsClient } from './ownership.js';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
