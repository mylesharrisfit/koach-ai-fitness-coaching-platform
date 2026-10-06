#!/usr/bin/env node
/**
 * Server-side paywall verification (migration 20261006210000).
 *
 * Runs end to end through REAL PostgREST and the REAL edge functions (Deno)
 * against a migrated local database — see scripts/lib/edgeHarness.mjs.
 *
 * Proves:
 *   1. every gated table: a coach WITH billing access can insert + update; a
 *      lapsed coach gets 403 on insert and update but can still read (and
 *      delete) their own rows.
 *   2. who counts as "has access": trial, active, past_due grace, comped,
 *      admin, team member of a paying owner — and who doesn't: expired trial,
 *      past_due past grace, canceled, team member of a lapsed owner.
 *   3. portal clients' own writes (check-ins, logs, messages, workouts,
 *      weigh-ins, invoices, habits) still work when their coach has lapsed —
 *      both linked accounts and claim-only portal JWTs — while the portal
 *      branch gives them nothing outside their own client row.
 *   4. browser roles can't call the service-only billing helpers.
 *   5. runAutomations skips a lapsed coach's rules (and resumes them once the
 *      coach pays); commitClientImport refuses a lapsed coach and no longer
 *      bypasses the plan's client cap.
 *
 * Usage (fresh database: auth-shim.sql + all migrations):
 *   POSTGRES_URL=postgresql://postgres@127.0.0.1:55432/paytest \
 *   POSTGREST_BIN=/path/to/postgrest DENO_BIN=/path/to/deno \
 *     node scripts/verify-paywall.mjs
 */
import pg from 'pg';
import { startEdgeHarness, userToken, signJwt, SERVICE_KEY } from './lib/edgeHarness.mjs';

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error('Set POSTGRES_URL'); process.exit(1); }

const db = new pg.Client({ connectionString: POSTGRES_URL });
await db.connect();

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};

// ── accounts ────────────────────────────────────────────────────────────────
const id = (n) => `5a000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const U = {
  PAID: id(1), LAPSED: id(2), TRIAL: id(3), GRACE: id(4), PASTDUE_OLD: id(5),
  CANCELED: id(6), COMPED: id(7), ADMIN: id(8), TM_PAID: id(9), TM_LAPSED: id(10), PORTAL: id(11),
};
const DAY = 86400_000;
const iso = (ms) => new Date(Date.now() + ms).toISOString();
if ((await db.query('select 1 from auth.users where id = $1', [U.PAID])).rowCount) {
  console.error('verify-paywall needs a FRESH migrated database (fixtures from a previous run are present).');
  process.exit(1);
}
for (const [k, v] of Object.entries(U)) {
  await db.query(`insert into auth.users (id, email) values ($1, $2)`, [v, `${k.toLowerCase()}@paywall.test`]);
}
const setProfile = (uid, f) => db.query(
  `update public.profiles set billing_status=$2, trial_ends_at=$3, past_due_since=$4, is_comped=$5, role=$6, subscription_tier=$7 where id=$1`,
  [uid, f.status ?? 'none', f.trial ?? null, f.pastDue ?? null, f.comped ?? false, f.role ?? 'user', f.tier ?? 'elite']);
await setProfile(U.PAID, { status: 'active' });
await setProfile(U.LAPSED, { status: 'none', trial: iso(-DAY) });          // 14-day trial ended yesterday
await setProfile(U.TRIAL, { status: 'none', trial: iso(5 * DAY) });
await setProfile(U.GRACE, { status: 'past_due', pastDue: iso(-DAY) });     // inside 3-day grace
await setProfile(U.PASTDUE_OLD, { status: 'past_due', pastDue: iso(-5 * DAY) });
await setProfile(U.CANCELED, { status: 'canceled' });
await setProfile(U.COMPED, { comped: true });
await setProfile(U.ADMIN, { role: 'admin' });
await setProfile(U.TM_PAID, { status: 'none' });
await setProfile(U.TM_LAPSED, { status: 'none' });
await setProfile(U.PORTAL, { status: 'none' });

// teams: TM_PAID works under PAID, TM_LAPSED under LAPSED
const { rows: [teamPaid] } = await db.query(`insert into public.teams (name, owner_coach_id, created_by) values ('Paid team', $1, $1) returning id`, [U.PAID]);
const { rows: [teamLapsed] } = await db.query(`insert into public.teams (name, owner_coach_id, created_by) values ('Lapsed team', $1, $1) returning id`, [U.LAPSED]);
await db.query(
  `insert into public.team_members (team_id, user_id, name, email, invite_status, role_label, created_by)
   values ($1, $2, 'TM paid', 'tm_paid@paywall.test', 'accepted', 'coach', $3),
          ($4, $5, 'TM lapsed', 'tm_lapsed@paywall.test', 'accepted', 'coach', $6)`,
  [teamPaid.id, U.TM_PAID, U.PAID, teamLapsed.id, U.TM_LAPSED, U.LAPSED]);

// ── per-coach seed (superuser, bypasses RLS) ────────────────────────────────
async function seedCoach(uid, tag) {
  const one = async (sql, vals) => (await db.query(sql, vals)).rows[0];
  const client = await one(`insert into public.clients (name, email, user_id, created_by, lifecycle_status) values ($1, $2, $3, $3, 'active') returning id`, [`${tag} Client`, `${tag.toLowerCase()}.client@paywall.test`, uid]);
  const plan = await one(`insert into public.nutrition_plans (title, client_id, created_by) values ($1, $2, $3) returning id`, [`${tag} plan`, client.id, uid]);
  const habit = await one(`insert into public.habits (name, client_id, created_by) values ('Walk', $1, $2) returning id`, [client.id, uid]);
  return { uid, client: client.id, plan: plan.id, habit: habit.id };
}
const paid = await seedCoach(U.PAID, 'Paid');
const lapsed = await seedCoach(U.LAPSED, 'Lapsed');
await db.query('update public.clients set portal_user_id=$1 where id=$2', [U.PORTAL, lapsed.client]);

// Minimal valid row per gated table for a coach context `c`.
const today = new Date().toISOString().slice(0, 10);
let dayOffset = 0;
const nextDay = () => new Date(Date.UTC(2026, 0, 1) + (dayOffset++) * DAY).toISOString().slice(0, 10);
const ROW = {
  clients: (c) => ({ name: 'New Client', email: `new.${Math.random().toString(36).slice(2)}@paywall.test`, user_id: c.uid, created_by: c.uid }),
  workout_programs: (c) => ({ title: 'Program', created_by: c.uid }),
  nutrition_plans: (c) => ({ title: 'Plan', client_id: c.client, created_by: c.uid }),
  messages: (c) => ({ client_id: c.client, sender: 'coach', content: 'hi', created_by: c.uid }),
  check_ins: (c) => ({ client_id: c.client, date: today, created_by: c.uid }),
  coaching_sessions: (c) => ({ client_id: c.client, title: 'Call', date: today, created_by: c.uid }),
  check_in_forms: (c) => ({ name: 'Weekly form', created_by: c.uid }),
  plan_versions: (c) => ({ client_id: c.client, plan_kind: 'nutrition', nutrition_plan_id: c.plan, source: 'manual_edit', proposed_by: 'coach', diff: {}, status: 'applied', created_by: c.uid }),
  weigh_ins: (c) => ({ client_id: c.client, date: today, weight: 180, created_by: c.uid }),
  goals: (c) => ({ client_id: c.client, name: 'Goal', goal_type: 'simple', created_by: c.uid }),
  habits: (c) => ({ client_id: c.client, name: 'Sleep', created_by: c.uid }),
  habit_completions: (c) => ({ client_id: c.client, habit_id: c.habit, date: nextDay(), created_by: c.uid }), // unique per (habit, date)
  daily_logs: (c) => ({ client_id: c.client, date: today, created_by: c.uid }),
  food_logs: (c) => ({ client_id: c.client, logged_date: today, created_by: c.uid }),
  workout_sessions: (c) => ({ client_id: c.client, created_by: c.uid }),
  in_body_scans: (c) => ({ client_id: c.client, scan_date: today, created_by: c.uid }),
  client_badges: (c) => ({ client_id: c.client, badge_key: 'streak_7', earned_date: today, created_by: c.uid }),
  invoices: (c) => ({ client_id: c.client, amount: 100, issue_date: today, due_date: today, created_by: c.uid }),
  automation_rules: (c) => ({ name: 'Rule', created_by: c.uid, is_active: false }),
  meal_templates: (c) => ({ name: 'Meal', created_by: c.uid }),
  exercise_library: (c) => ({ name: 'Squat', created_by: c.uid }),
  leads: (c) => ({ name: 'Lead', created_by: c.uid }),
};
// A column every table has that a coach may freely edit, for the update probe.
const UPD = { clients: 'notes', workout_programs: 'title', nutrition_plans: 'title', messages: 'content', check_ins: 'notes',
  coaching_sessions: 'title', check_in_forms: 'name', plan_versions: 'proposed_by', weigh_ins: 'weight', goals: 'name', habits: 'name',
  habit_completions: 'completed', daily_logs: 'date', food_logs: 'logged_date', workout_sessions: 'created_by', in_body_scans: 'scan_date',
  client_badges: 'earned_date', invoices: 'amount', automation_rules: 'name', meal_templates: 'name', exercise_library: 'name', leads: 'name' };
const updValue = (t, c) => ({ weigh_ins: 181, invoices: 120, habit_completions: true, daily_logs: today, food_logs: today,
  in_body_scans: today, client_badges: today, workout_sessions: c.uid })[t] ?? 'edited';

// Seed one row per table per coach for the update / read / delete probes.
const toSql = (v) => (v && typeof v === 'object' ? JSON.stringify(v) : v);
async function seedRow(t, c) {
  const row = ROW[t](c);
  const keys = Object.keys(row);
  const { rows } = await db.query(
    `insert into public.${t} (${keys.join(',')}) values (${keys.map((_, i) => `$${i + 1}`).join(',')}) returning id`,
    keys.map((k) => toSql(row[k])));
  return rows[0].id;
}

// ── stack ───────────────────────────────────────────────────────────────────
const h = await startEdgeHarness({ postgresUrl: POSTGRES_URL, functions: ['runAutomations', 'commitClientImport'] });
const tok = Object.fromEntries(Object.entries(U).map(([k, v]) => [k, userToken(v)]));
const insert = (t, row, token) => h.rest(`/${t}`, { method: 'POST', token, body: row, headers: { prefer: 'return=minimal' } });
const patch = (t, rowId, body, token) => h.rest(`/${t}?id=eq.${rowId}`, { method: 'PATCH', token, body, headers: { prefer: 'return=representation' } });

try {
  // ── 1. every gated table ──────────────────────────────────────────────────
  for (const t of Object.keys(ROW)) {
    const paidRow = await seedRow(t, paid);
    const lapsedRow = await seedRow(t, lapsed);
    const ins = await insert(t, ROW[t](paid), tok.PAID);
    check(`${t}: coach with billing access can INSERT`, ins.status === 201, `${ins.status} ${JSON.stringify(ins.body).slice(0, 160)}`);
    const insL = await insert(t, ROW[t](lapsed), tok.LAPSED);
    check(`${t}: lapsed coach INSERT refused (403)`, insL.status === 403, `${insL.status}`);
    const col = UPD[t];
    if (t === 'client_badges') continue; // UPDATE is admin-only by policy (badges are awarded, not edited)
    const up = await patch(t, paidRow, { [col]: updValue(t, paid) }, tok.PAID);
    check(`${t}: coach with billing access can UPDATE`, up.status === 200 && Array.isArray(up.body) && up.body.length === 1, `${up.status} ${JSON.stringify(up.body).slice(0, 160)}`);
    const before = (await db.query(`select ${col}::text v from public.${t} where id=$1`, [lapsedRow])).rows[0].v;
    const upL = await patch(t, lapsedRow, { [col]: updValue(t, lapsed) }, tok.LAPSED);
    const after = (await db.query(`select ${col}::text v from public.${t} where id=$1`, [lapsedRow])).rows[0].v;
    check(`${t}: lapsed coach UPDATE refused (403) and row unchanged`, upL.status === 403 && before === after, `${upL.status}`);
    const rd = await h.rest(`/${t}?id=eq.${lapsedRow}&select=id`, { token: tok.LAPSED });
    check(`${t}: lapsed coach can still READ own row`, rd.status === 200 && rd.body.length === 1, `${rd.status}`);
  }
  const del = await h.rest(`/leads?created_by=eq.${U.LAPSED}`, { method: 'DELETE', token: tok.LAPSED, headers: { prefer: 'return=representation' } });
  check('lapsed coach can still DELETE own rows (e.g. to get under a plan cap)', del.status === 200 && del.body.length >= 1, `${del.status}`);

  // ── 2. who has access ─────────────────────────────────────────────────────
  const wp = (uid) => ({ title: 'Access probe', created_by: uid });
  for (const [who, expect] of [['TRIAL', 201], ['GRACE', 201], ['COMPED', 201], ['ADMIN', 201], ['TM_PAID', 201],
    ['PASTDUE_OLD', 403], ['CANCELED', 403], ['TM_LAPSED', 403], ['LAPSED', 403]]) {
    const r = await insert('workout_programs', wp(U[who]), tok[who]);
    check(`access: ${who} -> ${expect === 201 ? 'allowed' : 'refused'}`, r.status === expect, `${r.status}`);
  }
  // team member writing a team client of the paying owner
  const tmc = await insert('clients', { name: 'Team client', email: 'team.client@paywall.test', team_id: teamPaid.id, created_by: U.TM_PAID }, tok.TM_PAID);
  check('access: team member of paying owner can add a team client', tmc.status === 201, `${tmc.status} ${JSON.stringify(tmc.body).slice(0, 120)}`);
  const tml = await insert('clients', { name: 'Team client', email: 'team.client2@paywall.test', team_id: teamLapsed.id, created_by: U.TM_LAPSED }, tok.TM_LAPSED);
  check('access: team member of lapsed owner cannot add a team client', tml.status === 403, `${tml.status}`);
  // flipping billing on takes effect immediately (no cached state)
  await setProfile(U.CANCELED, { status: 'active' });
  check('access: resubscribing restores writes immediately', (await insert('workout_programs', wp(U.CANCELED), tok.CANCELED)).status === 201);

  // ── 3. portal clients of a LAPSED coach keep writing their own data ───────
  const pc = lapsed.client;
  const seeded = {
    msg: await seedRow('messages', lapsed),
    daily: await seedRow('daily_logs', lapsed),
  };
  const P = tok.PORTAL;
  const portalOps = [
    ['check-in via check_ins_portal_view', () => insert('check_ins_portal_view', { client_id: pc, date: today, notes: 'from portal' }, P), 201],
    ['daily log insert', () => insert('daily_logs', { client_id: pc, date: today }, P), 201],
    ['daily log update', () => patch('daily_logs', seeded.daily, { date: today }, P), 200],
    ['food log insert', () => insert('food_logs', { client_id: pc, logged_date: today }, P), 201],
    ['message insert', () => insert('messages', { client_id: pc, sender: 'client', content: 'hello coach' }, P), 201],
    ['message update (mark read)', () => patch('messages', seeded.msg, { is_read: true }, P), 200],
    ['workout session insert', () => insert('workout_sessions', { client_id: pc }, P), 201],
    ['habit completion insert', () => insert('habit_completions', { client_id: pc, habit_id: lapsed.habit, date: nextDay() }, P), 201],
  ];
  for (const [label, op, want] of portalOps) {
    const r = await op();
    const ok = r.status === want && (want !== 200 || (Array.isArray(r.body) && r.body.length === 1));
    check(`portal (coach lapsed): ${label} still works`, ok, `${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
  }
  const claimOnly = signJwt({ role: 'authenticated', portal_client_id: pc });
  const co = await insert('daily_logs', { client_id: pc, date: today }, claimOnly);
  check('portal (claim-only JWT, coach lapsed): daily log insert still works', co.status === 201, `${co.status} ${JSON.stringify(co.body).slice(0, 160)}`);
  // the portal branch is scoped to the client's own row
  check('portal: cannot create coach-only rows (workout_programs)', (await insert('workout_programs', { title: 'x', created_by: U.PORTAL }, P)).status === 403);
  check("portal: cannot write another client's rows", (await insert('messages', { client_id: paid.client, sender: 'client', content: 'x' }, P)).status === 403);

  // ── 4. helper exposure ────────────────────────────────────────────────────
  const rpc = await h.rest('/rpc/coaches_with_billing_access', { method: 'POST', token: tok.PAID, body: { p_ids: [U.PAID, U.LAPSED] } });
  check('coaches_with_billing_access is not callable by a signed-in user', rpc.status === 401 || rpc.status === 403 || rpc.status === 404, `${rpc.status}`);
  const rpcSvc = await h.rest('/rpc/coaches_with_billing_access', { method: 'POST', token: SERVICE_KEY, body: { p_ids: [U.PAID, U.LAPSED, U.TM_PAID, U.TM_LAPSED] } });
  const ids = new Set((rpcSvc.body ?? []).map((r) => r.id));
  check('coaches_with_billing_access (service role) = paying owner + their team member only',
    rpcSvc.status === 200 && ids.has(U.PAID) && ids.has(U.TM_PAID) && !ids.has(U.LAPSED) && !ids.has(U.TM_LAPSED), JSON.stringify(rpcSvc.body));
  await db.query('begin; set local role authenticated');
  let probeDenied = false;
  try { await db.query('select app.coach_has_billing_access($1)', [U.PAID]); } catch { probeDenied = true; }
  await db.query('rollback');
  check("app.coach_has_billing_access(uuid) stays service-only (no probing other accounts' billing)", probeDenied);

  // ── 5a. runAutomations: lapsed coach's rules don't run ────────────────────
  await db.query('delete from public.automation_rules');
  await db.query('delete from public.automation_logs');
  const rule = async (uid) => (await db.query(
    `insert into public.automation_rules (name, is_active, condition_type, condition_threshold, action_type, action_message, created_by)
     values ('Missed check-in', true, 'missed_checkin', 3, 'notify_coach', '{client_name} missed a check-in', $1) returning id`, [uid])).rows[0].id;
  const paidRule = await rule(U.PAID);
  const lapsedRule = await rule(U.LAPSED);
  const logs = async (ruleId) => (await db.query('select count(*)::int n from public.automation_logs where rule_id=$1', [ruleId])).rows[0].n;
  const run1 = await h.callFunction('runAutomations', { token: SERVICE_KEY });
  check('runAutomations: runs (service role)', run1.status === 200 && run1.body.ok === true, JSON.stringify(run1.body));
  check('runAutomations: paying coach rule evaluated', await logs(paidRule) > 0);
  check('runAutomations: lapsed coach rule NOT evaluated (no actions, no logs)', await logs(lapsedRule) === 0 && run1.body.skipped_rules_no_billing === 1, JSON.stringify(run1.body));
  await setProfile(U.LAPSED, { status: 'active' });
  const run2 = await h.callFunction('runAutomations', { token: SERVICE_KEY });
  check('runAutomations: rules resume once the coach pays', run2.status === 200 && await logs(lapsedRule) > 0, JSON.stringify(run2.body));
  await setProfile(U.LAPSED, { status: 'none', trial: iso(-DAY) });

  // ── 5b. commitClientImport: billing + client cap ──────────────────────────
  const job = async (uid, n, tag) => (await db.query(
    `insert into public.client_import_jobs (coach_id, created_by, status, headers, column_mapping, all_rows)
     values ($1, $1, 'confirmed', $2, $3, $4) returning id`,
    [uid, ['Name', 'Email'], JSON.stringify({ Name: 'name', Email: 'email' }),
      JSON.stringify(Array.from({ length: n }, (_, i) => ({ Name: `Imported ${tag} ${i}`, Email: `imp.${tag}.${i}@paywall.test` })))])).rows[0].id;
  const clientCount = async (uid) => (await db.query('select count(*)::int n from public.clients where user_id=$1', [uid])).rows[0].n;

  const lapsedBefore = await clientCount(U.LAPSED);
  const lj = await h.callFunction('commitClientImport', { token: tok.LAPSED, body: { job_id: await job(U.LAPSED, 3, 'lapsed') } });
  check('commitClientImport: lapsed coach -> 402 billing_required, nothing imported',
    lj.status === 402 && lj.body.error === 'billing_required' && await clientCount(U.LAPSED) === lapsedBefore, JSON.stringify(lj.body));

  // Starter plan = 10 clients. Put the paying coach at 9, import 3.
  await setProfile(U.PAID, { status: 'active', tier: 'starter' });
  const have = await clientCount(U.PAID);
  for (let i = have; i < 9; i++) {
    await db.query(`insert into public.clients (name, email, user_id, created_by) values ($1, $2, $3, $3)`, [`Filler ${i}`, `filler${i}@paywall.test`, U.PAID]);
  }
  const pj = await h.callFunction('commitClientImport', { token: tok.PAID, body: { job_id: await job(U.PAID, 3, 'starter') } });
  check('commitClientImport: Starter at 9/10 importing 3 -> 1 imported, 2 flagged with the cap message, 10 clients total',
    pj.status === 200 && pj.body.imported === 1 && pj.body.flagged === 2 && /Client limit reached/.test(pj.body.error_log.join(' ')) && await clientCount(U.PAID) === 10,
    JSON.stringify(pj.body).slice(0, 300));
  await setProfile(U.PAID, { status: 'active', tier: 'elite' });
  const ej = await h.callFunction('commitClientImport', { token: tok.PAID, body: { job_id: await job(U.PAID, 3, 'elite') } });
  check('commitClientImport: unlimited plan imports all rows (inserted as the coach, RLS passes)',
    ej.status === 200 && ej.body.imported === 3 && ej.body.flagged === 0 && await clientCount(U.PAID) === 13, JSON.stringify(ej.body).slice(0, 300));
  const owned = (await db.query(`select count(*)::int n from public.clients where email like 'imp.%' and user_id=$1 and created_by=$1`, [U.PAID])).rows[0].n;
  check('commitClientImport: imported rows are owned by the importing coach', owned === 4, `owned=${owned}`);
} finally {
  await h.stop();
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
await db.end();
process.exit(failures ? 1 : 0);
