#!/usr/bin/env node
/**
 * Weekly digest idempotency (migration 20261006230000).
 *
 * Runs the REAL weeklyDigest edge function (Deno) through REAL PostgREST
 * against a fresh migrated database (scripts/lib/edgeHarness.mjs).
 * sendEmailNotification is replaced by a recording stub, so nothing is emailed
 * and every send is counted.
 *
 * Proves:
 *   1. a sweep emails each coach (with clients + an email) once and records a
 *      'sent' ledger row keyed by (coach_id, Monday of the week);
 *   2. re-running the sweep (cron retry) emails nobody again;
 *   3. three sweeps racing email each coach exactly once;
 *   4. a failed send is recorded as 'failed' and the next run retries ONLY it;
 *   5. a stale 'sending' claim (run died mid-send) is retried, a fresh one isn't;
 *   6. dry_run writes no ledger rows and sends nothing;
 *   7. a coach calling the function for their own digest shares the same
 *      ledger (gets the digest back, but no second email that week);
 *   8. digestWeekKey maps every day of a week to its Monday (UTC);
 *   9. browser roles can't read the ledger or call the claim/finish RPCs.
 *
 * Usage (fresh database: auth-shim.sql + all migrations):
 *   POSTGRES_URL=postgresql://postgres@127.0.0.1:55432/digestidem \
 *   POSTGREST_BIN=/path/to/postgrest DENO_BIN=/path/to/deno \
 *     node scripts/verify-digest-idempotency.mjs
 */
import pg from 'pg';
import { startEdgeHarness, userToken, SERVICE_KEY } from './lib/edgeHarness.mjs';
import { digestWeekKey } from '../supabase/functions/_shared/weeklyDigest.js';

pg.types.setTypeParser(1082, (v) => v);

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error('Set POSTGRES_URL'); process.exit(1); }
const db = new pg.Client({ connectionString: POSTGRES_URL });
await db.connect();

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};

// ── 8. week key (pure) ──────────────────────────────────────────────────────
{
  const days = ['2026-10-05', '2026-10-06', '2026-10-08', '2026-10-11'].map((d) => digestWeekKey(new Date(`${d}T23:59:00Z`)));
  check('digestWeekKey: Mon..Sun of one week -> that Monday', days.every((d) => d === '2026-10-05'), days.join(','));
  check('digestWeekKey: next Monday starts a new week', digestWeekKey(new Date('2026-10-12T00:00:00Z')) === '2026-10-12');
  check('digestWeekKey: crosses a year boundary', digestWeekKey(new Date('2027-01-01T12:00:00Z')) === '2026-12-28');
}

// ── fixtures ────────────────────────────────────────────────────────────────
const A = 'd1000000-0000-0000-0000-00000000000a';
const B = 'd1000000-0000-0000-0000-00000000000b';
const NOEMAIL = 'd1000000-0000-0000-0000-00000000000c';
const NOCLIENTS = 'd1000000-0000-0000-0000-00000000000d';
if ((await db.query('select 1 from auth.users where id = $1', [A])).rowCount) {
  console.error('verify-digest-idempotency needs a FRESH migrated database.');
  process.exit(1);
}
await db.query(`insert into auth.users (id, email) values ($1,'a@digest.test'), ($2,'b@digest.test'), ($3, null), ($4,'d@digest.test')`, [A, B, NOEMAIL, NOCLIENTS]);
await db.query(`update public.profiles set email = null where id = $1`, [NOEMAIL]);
for (const [coach, n] of [[A, 2], [B, 1], [NOEMAIL, 1]]) {
  for (let i = 0; i < n; i++) {
    await db.query(`insert into public.clients (name, email, user_id, created_by, lifecycle_status) values ($1, $2, $3, $3, 'active')`,
      [`Client ${i}`, `c${i}.${coach.slice(-1)}@digest.test`, coach]);
  }
}

// Recording email stub; `failFor` makes sends to those addresses fail (500).
const sentTo = [];
const failFor = new Set();
const h = await startEdgeHarness({
  postgresUrl: POSTGRES_URL,
  functions: ['weeklyDigest'],
  stubFunctions: {
    sendEmailNotification: ({ body }) => {
      if (failFor.has(body?.to)) return { status: 500, body: { error: 'provider down' } };
      sentTo.push(body?.to);
      return { status: 200, body: { success: true } };
    },
  },
});
const sweep = (body = {}) => h.callFunction('weeklyDigest', { token: SERVICE_KEY, body });
const ledger = async () => (await db.query('select coach_id, week_of, status, attempts from public.weekly_digest_sends order by coach_id')).rows;
const count = (to) => sentTo.filter((t) => t === to).length;
const WEEK = digestWeekKey(new Date());

try {
  // ── 6. dry run ────────────────────────────────────────────────────────────
  const dry = await sweep({ dry_run: true });
  check('dry_run: builds digests, sends nothing, writes no ledger rows',
    dry.status === 200 && dry.body.dry_run === true && sentTo.length === 0 && (await ledger()).length === 0, JSON.stringify(dry.body));

  // ── 1. first sweep ────────────────────────────────────────────────────────
  const s1 = await sweep();
  check('sweep 1: each coach with clients + email emailed once (A, B); no email for coach without one',
    s1.status === 200 && s1.body.sent === 2 && count('a@digest.test') === 1 && count('b@digest.test') === 1 && sentTo.length === 2, JSON.stringify(s1.body));
  const l1 = await ledger();
  check(`sweep 1: ledger has (coach, ${WEEK}) = sent for A and B only`,
    l1.length === 2 && l1.every((r) => r.status === 'sent' && r.week_of === WEEK && r.attempts === 1) && l1.map((r) => r.coach_id).join() === [A, B].join(), JSON.stringify(l1));
  check('sweep 1: coaches without clients are not part of the sweep', !sentTo.includes('d@digest.test'));

  // ── 2. retry ──────────────────────────────────────────────────────────────
  const s2 = await sweep();
  check('sweep 2 (cron retry): nobody emailed again, reported as already_sent',
    s2.status === 200 && s2.body.sent === 0 && s2.body.already_sent === 2 && sentTo.length === 2, JSON.stringify(s2.body));

  // ── 3. racing sweeps ──────────────────────────────────────────────────────
  await db.query('delete from public.weekly_digest_sends');
  sentTo.length = 0;
  const race = await Promise.all([sweep(), sweep(), sweep()]);
  check('3 concurrent sweeps: each coach emailed exactly once',
    race.every((r) => r.status === 200) && count('a@digest.test') === 1 && count('b@digest.test') === 1 && sentTo.length === 2,
    `sent=${race.map((r) => r.body.sent).join('+')} emails=${sentTo.join(',')}`);

  // ── 4. failure then retry ─────────────────────────────────────────────────
  await db.query('delete from public.weekly_digest_sends');
  sentTo.length = 0;
  failFor.add('b@digest.test');
  const f1 = await sweep();
  const lf = Object.fromEntries((await ledger()).map((r) => [r.coach_id, r]));
  check('provider failure: A sent, B recorded as failed (not counted as sent)',
    f1.body.sent === 1 && lf[A]?.status === 'sent' && lf[B]?.status === 'failed' && count('a@digest.test') === 1, JSON.stringify(f1.body));
  const err = (await db.query('select last_error from public.weekly_digest_sends where coach_id=$1', [B])).rows[0].last_error;
  check('provider failure: error text kept on the ledger row', /provider down|non-2xx|500/i.test(err ?? ''), err);
  failFor.clear();
  const f2 = await sweep();
  const lf2 = Object.fromEntries((await ledger()).map((r) => [r.coach_id, r]));
  check('retry after failure: ONLY B re-sent; A not emailed twice',
    f2.body.sent === 1 && count('a@digest.test') === 1 && count('b@digest.test') === 1 && lf2[B].status === 'sent' && lf2[B].attempts === 2, JSON.stringify(f2.body));

  // ── 5. stale vs fresh 'sending' claims ────────────────────────────────────
  await db.query(`update public.weekly_digest_sends set status='sending', claimed_at = now() - interval '2 hours', sent_at = null where coach_id=$1`, [A]);
  await db.query(`update public.weekly_digest_sends set status='sending', claimed_at = now() - interval '5 minutes', sent_at = null where coach_id=$1`, [B]);
  sentTo.length = 0;
  const st = await sweep();
  check("stale 'sending' (run died >1h ago) is retried; a fresh one (another run in flight) is left alone",
    count('a@digest.test') === 1 && count('b@digest.test') === 0, `${JSON.stringify(st.body)} emails=${sentTo.join(',')}`);

  // ── 7. coach-initiated path shares the ledger ─────────────────────────────
  await db.query('delete from public.weekly_digest_sends');
  sentTo.length = 0;
  const own1 = await h.callFunction('weeklyDigest', { token: userToken(A, 'a@digest.test') });
  const own2 = await h.callFunction('weeklyDigest', { token: userToken(A, 'a@digest.test') });
  check('coach asks for own digest: first call emails, second returns the digest without a second email',
    own1.status === 200 && own1.body.emailed === true && own2.status === 200 && own2.body.emailed === false
    && own2.body.already_sent_this_week === true && !!own2.body.digest && count('a@digest.test') === 1,
    `${JSON.stringify({ e1: own1.body.emailed, e2: own2.body.emailed })}`);
  const s3 = await sweep();
  check('cron sweep after the coach already got it: A skipped, B sent', count('a@digest.test') === 1 && count('b@digest.test') === 1 && s3.body.already_sent === 1, JSON.stringify(s3.body));
  check("coach call only digests the caller's own clients",
    own1.body.digest?.active_clients === 2, `active_clients=${own1.body.digest?.active_clients}`);

  // ── 9. exposure ───────────────────────────────────────────────────────────
  const tA = userToken(A, 'a@digest.test');
  const read = await h.rest('/weekly_digest_sends?select=*', { token: tA });
  const claim = await h.rest('/rpc/claim_weekly_digest', { method: 'POST', token: tA, body: { p_coach: A, p_week_of: '2030-01-07' } });
  const finish = await h.rest('/rpc/finish_weekly_digest', { method: 'POST', token: tA, body: { p_coach: A, p_week_of: WEEK, p_sent: false, p_error: 'x' } });
  // The migration revokes table privileges; RLS (no policies) is the backstop
  // even where a blanket grant re-adds them, so a read sees zero rows.
  check('signed-in user cannot read the ledger or call claim/finish',
    ([401, 403].includes(read.status) || (read.status === 200 && Array.isArray(read.body) && read.body.length === 0))
    && [401, 403, 404].includes(claim.status) && [401, 403, 404].includes(finish.status),
    `read=${read.status} claim=${claim.status} finish=${finish.status}`);
} finally {
  await h.stop();
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
await db.end();
process.exit(failures ? 1 : 0);
