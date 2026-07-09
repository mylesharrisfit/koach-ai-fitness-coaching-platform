#!/usr/bin/env node
/**
 * Step 3 auth verification harness. Rehearses against local Postgres + the
 * auth-schema shim — no live Supabase/GoTrue required. Where possible it runs
 * the REAL Step-3 code: the invite-token hashing and portal-JWT minting come
 * from supabase/functions/_shared/portalToken.js (the exact module the edge
 * functions import), not a re-implementation.
 *
 * Covers:
 *   1. signup provisioning: inserting into auth.users fires handle_new_user()
 *      and creates the matching profiles row (Step 3a.2).
 *   2. coach session RLS: a coach identified by a JWT sub can read/write only
 *      their own clients (Step 3a.4 / same guarantees as Step 2, via session).
 *   3. invite-token exchange (Step 3b): generateInviteToken stores ONLY a hash;
 *      plaintext never touches the DB. validateInviteToken hashes the incoming
 *      token, looks it up, mints a portal JWT, and app.is_portal_client()
 *      accepts a session carrying that JWT's portal_client_id claim.
 *   4. setupPortalAccount (Step 3b.4): links portal_user_id + single-uses the
 *      token; is_portal_client() then resolves via portal_user_id = auth.uid()
 *      (the durable path), and the spent token no longer validates.
 *
 * Usage: POSTGRES_URL=postgresql://postgres@127.0.0.1:55432/authtest \
 *          node scripts/verify-auth.mjs
 */
import pg from 'pg';
import {
  generateInviteToken,
  hashInviteToken,
  mintPortalJwt,
  decodeJwtPayload,
  isTokenLive,
} from '../supabase/functions/_shared/portalToken.js';

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error('Set POSTGRES_URL'); process.exit(1); }
const JWT_SECRET = 'test-jwt-secret-not-a-real-one';

const admin = new pg.Client({ connectionString: POSTGRES_URL });
await admin.connect();
await admin.query(`
  grant usage on schema public to anon, authenticated, service_role;
  grant all on all tables in schema public to anon, authenticated, service_role;
`);

// A session connection that runs as role `authenticated` with settable claims,
// exactly like PostgREST would for a bearer JWT.
const sess = new pg.Client({ connectionString: POSTGRES_URL });
await sess.connect();
await sess.query('set role authenticated');
async function asSession(claims) {
  await sess.query(
    "select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)",
    [claims.sub ?? '', JSON.stringify(claims)]
  );
}

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};

// --- 1. signup → profile provisioning (handle_new_user trigger) ------------
// Emulates supabase.auth.signUp: GoTrue inserts auth.users with full_name in
// metadata; the DB trigger must create the profile.
const coachId = '00000000-0000-0000-0000-0000000000c1';
await admin.query(
  `insert into auth.users (id, email, raw_user_meta_data)
   values ($1, $2, jsonb_build_object('full_name', $3::text))`,
  [coachId, 'coach@newauth.io', 'New Coach']
);
{
  const { rows } = await admin.query('select id, email, full_name, role from public.profiles where id=$1', [coachId]);
  check('signup fires handle_new_user → profile row created', rows.length === 1);
  check('profile copies email + full_name from signup metadata',
    rows[0]?.email === 'coach@newauth.io' && rows[0]?.full_name === 'New Coach');
  check('new coach defaults to role=user (not admin)', rows[0]?.role === 'user');
}

// --- 2. coach session RLS via a real session identity ----------------------
await asSession({ sub: coachId, email: 'coach@newauth.io', role: 'authenticated' });
const clientId = '00000000-0000-0000-0000-0000000000d1';
await sess.query(
  `insert into public.clients (id, user_id, name, email) values ($1,$2,'Portal Pete','pete@client.io')`,
  [clientId, coachId]
);
{
  const { rows } = await sess.query('select count(*)::int n from public.clients');
  check('coach session reads own client', rows[0].n === 1);
}
// A second coach sees nothing.
const coach2 = '00000000-0000-0000-0000-0000000000c2';
await admin.query(`insert into auth.users (id, email) values ($1,'other@coach.io')`, [coach2]);
await asSession({ sub: coach2, email: 'other@coach.io', role: 'authenticated' });
{
  const { rows } = await sess.query('select count(*)::int n from public.clients');
  check('second coach session sees zero clients (RLS isolation holds via session)', rows[0].n === 0);
}

// --- 3. invite-token exchange: generate → hash-only store → validate → mint -
// 3a. generation (real sendClientInvite logic): store ONLY the hash.
const { token, tokenHash } = await generateInviteToken();
const expires = new Date(Date.now() + 7 * 86400_000).toISOString();
await admin.query(
  'update public.clients set invite_token_hash=$1, invite_token_expires=$2 where id=$3',
  [tokenHash, expires, clientId]
);
{
  const { rows } = await admin.query(
    "select invite_token_hash from public.clients where id=$1", [clientId]);
  check('generateInviteToken stores a 64-hex hash', /^[0-9a-f]{64}$/.test(rows[0].invite_token_hash));
  check('plaintext token is NEVER equal to what is stored', rows[0].invite_token_hash !== token);
  // brute check: no column anywhere holds the plaintext
  const { rows: leak } = await admin.query(
    "select count(*)::int n from public.clients where invite_token_hash=$1", [token]);
  check('plaintext token does not match the stored hash column', leak[0].n === 0);
}

// 3b. validation (real validateInviteToken logic): hash incoming → lookup → mint.
const incomingHash = await hashInviteToken(token);
check('re-hashing the same token is deterministic (validate == generate)', incomingHash === tokenHash);
const { rows: found } = await admin.query(
  'select id, invite_token_expires from public.clients where invite_token_hash=$1', [incomingHash]);
check('service-role lookup by hash finds the client', found.length === 1 && found[0].id === clientId);
check('token is live', isTokenLive(found[0].invite_token_expires));

const minted = await mintPortalJwt({ clientId, jwtSecret: JWT_SECRET, ttlSeconds: 3600 });
const payload = decodeJwtPayload(minted.access_token);
check('minted JWT is HS256 3-part token', minted.access_token.split('.').length === 3);
check('minted JWT carries role=authenticated', payload.role === 'authenticated');
check('minted JWT carries portal_client_id claim', payload.portal_client_id === clientId);
check('minted JWT TTL is ≤ 1h', minted.expires_in <= 3600 && (payload.exp - payload.iat) <= 3600);

// 3c. a session carrying the minted claims is accepted by app.is_portal_client()
await asSession(payload); // exactly what PostgREST would set from the bearer JWT
{
  const { rows } = await sess.query('select count(*)::int n from public.clients');
  check('portal JWT session reads its own client row (is_portal_client accepts claim)', rows[0].n === 1);
  const view = await sess.query('select count(*)::int n from public.check_ins_portal_view');
  check('portal JWT session can use check_ins_portal_view', view.rows[0].n >= 0);
  // insert a check-in through the portal view as this claim-based session
  await sess.query(
    "insert into public.check_ins_portal_view (client_id, date, notes) values ($1, current_date, 'via portal jwt')",
    [clientId]);
  const { rows: after } = await sess.query('select count(*)::int n from public.check_ins_portal_view');
  check('portal JWT session writes a check-in through the view', after[0].n === 1);
}
// a JWT for a different client sees nothing
await asSession({ role: 'authenticated', portal_client_id: '00000000-0000-0000-0000-0000000000ff', aud: 'authenticated' });
{
  const { rows } = await sess.query('select count(*)::int n from public.clients');
  check('portal JWT for a different client sees zero rows', rows[0].n === 0);
}

// --- 4. setupPortalAccount: link portal_user_id + single-use the token ------
// Emulates the edge function's DB effects (admin createUser + link + invalidate).
const portalUserId = '00000000-0000-0000-0000-0000000000e1';
await admin.query(`insert into auth.users (id, email) values ($1,'pete@client.io')`, [portalUserId]);
await admin.query(
  'update public.clients set portal_user_id=$1, invite_token_hash=null, invite_token_expires=null where id=$2',
  [portalUserId, clientId]
);
{
  // the spent token no longer validates
  const { rows } = await admin.query(
    'select count(*)::int n from public.clients where invite_token_hash=$1', [tokenHash]);
  check('spent invite token no longer resolves (single-use)', rows[0].n === 0);
}
// durable path: a normal session as the linked portal user resolves is_portal_client via portal_user_id
await asSession({ sub: portalUserId, email: 'pete@client.io', role: 'authenticated' });
{
  const { rows } = await sess.query('select count(*)::int n from public.clients');
  check('linked portal account reads own client via portal_user_id path', rows[0].n === 1);
  const { rows: ins } = await sess.query(
    "select count(*)::int n from public.check_ins_portal_view");
  check('linked portal account uses the portal view (durable session, no re-exchange)', ins[0].n === 1);
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
await sess.end();
await admin.end();
process.exit(failures ? 1 : 0);
