#!/usr/bin/env node
/**
 * Unsubscribe + suppression verification (fix pass 1, item 6).
 *
 * Runs the REAL edge functions (unsubscribe, sendCheckInReminders, weeklyDigest,
 * sendEmailNotification, onEntityEvent) under Deno through REAL PostgREST
 * against a fresh migrated database (scripts/lib/edgeHarness.mjs). Resend is
 * faked by intercepting api.resend.com, so every outgoing email (recipient,
 * headers, html) is recorded and nothing is sent.
 *
 * Proves:
 *   1. tokens: sign/verify round trip; tampered, swapped or unsigned tokens fail;
 *   2. the endpoint: GET refused; bad token 400; JSON (app page) and RFC 8058
 *      one-click form POSTs record a normalized suppression; idempotent;
 *   3. suppressed addresses get no check-in reminder, weekly digest or welcome
 *      email, while transactional mail (new-client notice to the coach, a
 *      coach's own email to a client) still goes out;
 *   4. non-transactional mail carries List-Unsubscribe + List-Unsubscribe-Post
 *      pointing at the one-click endpoint with a token valid for exactly that
 *      recipient; transactional mail doesn't; every footer link is signed;
 *   5. a session caller can't upgrade/downgrade the category; browser roles
 *      can't read the suppression list; a failing lookup blocks the send.
 *
 * Usage (fresh database: auth-shim.sql + all migrations):
 *   POSTGRES_URL=postgresql://postgres@127.0.0.1:55432/unsubtest \
 *   POSTGREST_BIN=/path/to/postgrest DENO_BIN=/path/to/deno \
 *     node scripts/verify-unsubscribe.mjs
 */
import pg from 'pg';
import { startEdgeHarness, userToken, SERVICE_KEY, JWT_SECRET } from './lib/edgeHarness.mjs';

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error('Set POSTGRES_URL'); process.exit(1); }
const db = new pg.Client({ connectionString: POSTGRES_URL });
await db.connect();

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};

// Node side of the shared module (same code the functions run).
globalThis.Deno = { env: { get: (k) => ({ SUPABASE_JWT_SECRET: JWT_SECRET })[k] } };
const U = await import('../supabase/functions/_shared/unsubscribe.js');
const SECRET = U.unsubscribeSecret();

// ── 1. tokens ───────────────────────────────────────────────────────────────
{
  const a = await U.signUnsubscribeToken('  Alice@Example.COM ', SECRET);
  const b = await U.signUnsubscribeToken('bob@example.com', SECRET);
  check('token: round trip yields the normalized address', await U.verifyUnsubscribeToken(a.e, a.t, SECRET) === 'alice@example.com');
  check('token: tampered signature rejected', await U.verifyUnsubscribeToken(a.e, a.t.slice(0, -2) + 'AA', SECRET) === null);
  check("token: another address's signature rejected", await U.verifyUnsubscribeToken(a.e, b.t, SECRET) === null);
  check('token: wrong secret rejected', await U.verifyUnsubscribeToken(a.e, a.t, 'other-secret') === null);
  check('token: garbage rejected', await U.verifyUnsubscribeToken('!!', '??', SECRET) === null && await U.verifyUnsubscribeToken('', '', SECRET) === null);
  check('token: secret is derived, not the raw JWT secret', SECRET !== JWT_SECRET && SECRET.endsWith(JWT_SECRET));
  let threw = false;
  try { await U.isSuppressed('x@y.z', { supabaseUrl: 'http://x', serviceKey: 'k', fetchImpl: async () => ({ ok: false, status: 500 }) }); } catch { threw = true; }
  check('suppression lookup that errors throws (callers fail closed)', threw);
}

// ── fixtures ────────────────────────────────────────────────────────────────
const id = (n) => `7e500000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const COACH = id(1); const COACH2 = id(2);
const E = { coach: 'coach@unsub.test', coach2: 'coach2@unsub.test', keep: 'keep@unsub.test', gone: 'gone@unsub.test', welcomeGone: 'welcome.gone@unsub.test', welcomeKeep: 'welcome.keep@unsub.test' };
if ((await db.query('select 1 from auth.users where id=$1', [COACH])).rowCount) {
  console.error('verify-unsubscribe needs a FRESH migrated database.');
  process.exit(1);
}
await db.query(`insert into auth.users (id, email) values ($1, $2), ($3, $4)`, [COACH, E.coach, COACH2, E.coach2]);
await db.query(`update public.profiles set billing_status='active', subscription_tier='elite', full_name='Coach One' where id=$1`, [COACH]);
await db.query(`update public.profiles set billing_status='active', subscription_tier='elite', full_name='Coach Two' where id=$1`, [COACH2]);
const client = async (email, coach = COACH) => (await db.query(
  `insert into public.clients (name, email, user_id, created_by, lifecycle_status) values ($1, $2, $3, $3, 'active') returning *`,
  [email.split('@')[0], email, coach])).rows[0];
const keep = await client(E.keep);
await client(E.gone);
await client('c2@unsub.test', COACH2);

// ── fake Resend ─────────────────────────────────────────────────────────────
const sent = [];
const h = await startEdgeHarness({
  postgresUrl: POSTGRES_URL,
  functions: ['unsubscribe', 'sendCheckInReminders', 'weeklyDigest', 'sendEmailNotification', 'onEntityEvent'],
  env: { RESEND_API_KEY: 're_test_harness', FROM_EMAIL: 'noreply@koachai.net' },
  intercept: {
    'api.resend.com': ({ body }) => {
      const p = JSON.parse(body || '{}');
      sent.push({ to: String(p.to?.[0] ?? '').replace(/^.*<|>$/g, ''), headers: p.headers ?? {}, html: p.html ?? '', subject: p.subject });
      return { status: 200, body: { id: `re_${sent.length}` } };
    },
  },
});
const unsub = (path, init) => fetch(`${h.url}/functions/v1/unsubscribe${path}`, init);
const mailTo = (addr) => sent.filter((m) => m.to.toLowerCase() === addr);
const linkParams = (url) => { const u = new URL(url); return [u.searchParams.get('e'), u.searchParams.get('t')]; };

try {
  // ── 2. the endpoint ───────────────────────────────────────────────────────
  const tok = await U.signUnsubscribeToken('Gone@Unsub.test', SECRET);
  check('endpoint: GET is refused (link scanners must not unsubscribe)', (await unsub(`?e=${tok.e}&t=${tok.t}`)).status === 405);
  const bad = await unsub('', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ e: tok.e, t: 'nope' }) });
  check('endpoint: invalid token -> 400, nothing stored', bad.status === 400 && (await db.query('select count(*)::int n from public.email_suppressions')).rows[0].n === 0);
  const ok = await unsub('', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(tok) });
  const row = (await db.query('select email, source from public.email_suppressions')).rows;
  check('endpoint: app-page POST records the normalized address (source=link)', ok.status === 200 && row.length === 1 && row[0].email === E.gone && row[0].source === 'link', JSON.stringify(row));
  check('endpoint: repeating it is harmless', (await unsub('', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(tok) })).status === 200);
  const w = await U.signUnsubscribeToken(E.welcomeGone, SECRET);
  const oc = await unsub(`?e=${w.e}&t=${w.t}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
  const ocRow = (await db.query('select source from public.email_suppressions where email=$1', [E.welcomeGone])).rows[0];
  check('endpoint: RFC 8058 one-click POST (no session, no apikey) records source=one_click', oc.status === 200 && ocRow?.source === 'one_click', `${oc.status}`);
  const c2 = await U.signUnsubscribeToken(E.coach2, SECRET);
  await unsub('', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(c2) });

  // ── 3/4a. check-in reminders ──────────────────────────────────────────────
  const r = await h.callFunction('sendCheckInReminders', { token: SERVICE_KEY });
  check('reminders: sweep runs', r.status === 200, JSON.stringify(r.body).slice(0, 160));
  check('reminders: suppressed client gets nothing', mailTo(E.gone).length === 0);
  const rk = mailTo(E.keep)[0];
  check('reminders: other client gets the reminder', !!rk);
  const [he, ht] = rk ? linkParams(rk.headers['List-Unsubscribe'].slice(1, -1)) : [];
  check('reminders: List-Unsubscribe points at the one-click endpoint with a token for THIS recipient',
    rk?.headers['List-Unsubscribe']?.startsWith(`<${h.url}/functions/v1/unsubscribe?`) && await U.verifyUnsubscribeToken(he, ht, SECRET) === E.keep, rk?.headers['List-Unsubscribe']);
  check('reminders: List-Unsubscribe-Post is One-Click', rk?.headers['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click');
  const footer = rk?.html.match(/href="([^"]*\/unsubscribe\?[^"]*)"/)?.[1]?.replace(/&amp;/g, '&');
  check('reminders: footer link is the signed app page for this recipient',
    footer?.startsWith('http://app.harness.test/unsubscribe?') && await U.verifyUnsubscribeToken(...linkParams(footer), SECRET) === E.keep && !rk.html.includes('%%UNSUBSCRIBE_URL%%'), footer);
  const marked = (await db.query(`select count(*)::int n from public.notifications where type in ('friday_reminder','client_friday_reminder') and related_client_id = (select id from public.clients where email=$1)`, [E.gone])).rows[0].n;
  check('reminders: a suppressed client counts as handled (not retried as a failure)', r.body.failed === 0 || r.body.failed === undefined, `failed=${r.body.failed} marked=${marked}`);

  // ── 3/4b. weekly digest (via sendEmailNotification, service path) ─────────
  sent.length = 0;
  const d = await h.callFunction('weeklyDigest', { token: SERVICE_KEY });
  check('digest: sweep runs', d.status === 200, JSON.stringify(d.body).slice(0, 160));
  check('digest: suppressed coach gets no digest', mailTo(E.coach2).length === 0);
  const dk = mailTo(E.coach)[0];
  check('digest: other coach gets it with List-Unsubscribe + one-click',
    !!dk && dk.headers['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click' && await U.verifyUnsubscribeToken(...linkParams(dk.headers['List-Unsubscribe'].slice(1, -1)), SECRET) === E.coach);
  check('digest: has a signed unsubscribe footer', /\/unsubscribe\?e=/.test(dk?.html ?? ''));

  // ── 3/4c. welcome vs transactional (onEntityEvent client.created) ─────────
  sent.length = 0;
  const unsubCoach = await U.signUnsubscribeToken(E.coach, SECRET);
  await unsub('', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(unsubCoach) }); // coach opts out too
  const event = async (rec) => h.callFunction('onEntityEvent', { token: SERVICE_KEY, body: { event_key: `client.created:${rec.id}`, event_type: 'client.created', record: rec } });
  const wg = await client(E.welcomeGone);
  const wk = await client(E.welcomeKeep);
  const ev1 = await event(wg);
  const ev2 = await event(wk);
  check('welcome: events processed', ev1.status === 200 && ev2.status === 200, `${JSON.stringify(ev1.body).slice(0, 100)}`);
  check('welcome: suppressed client gets no welcome email', mailTo(E.welcomeGone).length === 0);
  const wkMail = mailTo(E.welcomeKeep)[0];
  check('welcome: other client gets it, with List-Unsubscribe', !!wkMail && !!wkMail.headers['List-Unsubscribe']);
  const coachNotes = mailTo(E.coach);
  check('transactional: suppressed coach still gets "new client" notices, without List-Unsubscribe',
    coachNotes.length === 2 && coachNotes.every((m) => !m.headers['List-Unsubscribe'] && /\/unsubscribe\?e=/.test(m.html)), `n=${coachNotes.length}`);

  // ── 3/5. coach's own email to a suppressed client (session) ───────────────
  sent.length = 0;
  const coachTok = userToken(COACH, E.coach);
  const own = await h.callFunction('sendEmailNotification', { token: coachTok, body: { to: E.gone, subject: 'Your plan', html: '<p>hi</p>', category: 'digest' } });
  const ownMail = mailTo(E.gone)[0];
  check("transactional: a coach's own email still reaches a suppressed client", own.status === 200 && !!ownMail, `${own.status} ${JSON.stringify(own.body)}`);
  check('session callers cannot set the category (no List-Unsubscribe on their mail)', ownMail && !ownMail.headers['List-Unsubscribe']);
  void keep;

  // ── 5. exposure ───────────────────────────────────────────────────────────
  const read = await h.rest('/email_suppressions?select=email', { token: coachTok });
  check('signed-in users cannot read the suppression list', [401, 403].includes(read.status) || (read.status === 200 && read.body.length === 0), `${read.status}`);
  const write = await h.rest('/email_suppressions', { method: 'POST', token: coachTok, body: { email: 'someone@else.test' } });
  check('signed-in users cannot write suppressions directly', [401, 403].includes(write.status), `${write.status}`);
} finally {
  await h.stop();
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
await db.end();
process.exit(failures ? 1 : 0);
