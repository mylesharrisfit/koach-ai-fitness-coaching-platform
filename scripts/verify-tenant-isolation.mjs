#!/usr/bin/env node
/**
 * Tenant isolation proof.
 *
 * Coach A must not read or write Coach B's clients, programs, plans,
 * check-ins, messages, sessions, invoices, logs, payments or uploads; a portal
 * client must not read or write another client's data — another coach's
 * client OR a sibling client of their own coach. Checked:
 *   1. through REAL PostgREST (RLS) for the core tables;
 *   2. on storage.objects with the REAL storage policies (the Storage API
 *      enforces them by querying as the caller's role);
 *   3. through every edge function that takes a record id / path / email and
 *      can run locally, using the REAL function code under Deno. Stripe and
 *      Zoom are faked by intercepting the functions' outbound fetch().
 *
 * Usage (fresh database: auth-shim.sql + all migrations):
 *   POSTGRES_URL=postgresql://postgres@127.0.0.1:55432/isotest \
 *   POSTGREST_BIN=/path/to/postgrest DENO_BIN=/path/to/deno \
 *     node scripts/verify-tenant-isolation.mjs
 * The storage shim (scripts/fixtures/storage-shim.sql) is installed and the
 * storage migrations replayed automatically when the database has no
 * `storage` schema.
 */
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { startEdgeHarness, userToken } from './lib/edgeHarness.mjs';

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error('Set POSTGRES_URL'); process.exit(1); }
const db = new pg.Client({ connectionString: POSTGRES_URL });
await db.connect();

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};
const repo = (p) => new URL(`../${p}`, import.meta.url);

// ── storage shim (real storage policies from the migrations) ────────────────
if (!(await db.query("select to_regclass('storage.objects') r")).rows[0].r) {
  await db.query(readFileSync(repo('scripts/fixtures/storage-shim.sql'), 'utf8'));
  for (const m of ['20260716000100_storage_uploads_bucket', '20260823000100_storage_uploads_private', '20261002000200_storage_branding_and_coach_read']) {
    await db.query(readFileSync(repo(`supabase/migrations/${m}.sql`), 'utf8'));
  }
}

// ── fixtures ────────────────────────────────────────────────────────────────
const id = (n) => `150a0000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const U = { A: id(1), B: id(2), PA1: id(3), PA2: id(4), PB1: id(5) };
const EMAIL = { A: 'coach.a@iso.test', B: 'coach.b@iso.test', PA1: 'a1@iso.test', PA2: 'a2@iso.test', PB1: 'b1@iso.test' };
if ((await db.query('select 1 from auth.users where id=$1', [U.A])).rowCount) {
  console.error('verify-tenant-isolation needs a FRESH migrated database.');
  process.exit(1);
}
for (const k of Object.keys(U)) await db.query('insert into auth.users (id, email) values ($1, $2)', [U[k], EMAIL[k]]);
await db.query(`update public.profiles set billing_status='active', subscription_tier='elite' where id in ($1, $2)`, [U.A, U.B]);

const one = async (sql, vals) => (await db.query(sql, vals)).rows[0];
const today = new Date().toISOString().slice(0, 10);
async function seedTenant(coach, tag, portals) {
  const t = { coach };
  t.c1 = (await one(`insert into public.clients (name, email, user_id, created_by, lifecycle_status, portal_user_id, stripe_customer_id)
    values ($1, $2, $3, $3, 'active', $4, $5) returning id`, [`${tag}1`, portals[0].email, coach, portals[0].uid, `cus_${tag}1`])).id;
  t.c2 = portals[1]
    ? (await one(`insert into public.clients (name, email, user_id, created_by, lifecycle_status, portal_user_id)
        values ($1, $2, $3, $3, 'active', $4) returning id`, [`${tag}2`, portals[1].email, coach, portals[1].uid])).id
    : null;
  t.program = (await one(`insert into public.workout_programs (title, created_by) values ($1, $2) returning id`, [`${tag} program`, coach])).id;
  t.program2 = (await one(`insert into public.workout_programs (title, created_by, workouts) values ($1, $2, '[{"day_name":"Day 1","exercises":[{"name":"Squat","sets":3,"reps":"5"}]}]') returning id`, [`${tag} unassigned program`, coach])).id;
  await db.query('update public.clients set assigned_program_id=$1 where id=$2', [t.program, t.c1]);
  t.plan = (await one(`insert into public.nutrition_plans (title, client_id, created_by) values ($1, $2, $3) returning id`, [`${tag} plan`, t.c1, coach])).id;
  t.checkIn = (await one(`insert into public.check_ins (client_id, date, notes, internal_notes, created_by) values ($1, $2, 'note', 'private', $3) returning id`, [t.c1, today, coach])).id;
  t.message = (await one(`insert into public.messages (client_id, sender, content, created_by) values ($1, 'coach', 'secret', $2) returning id`, [t.c1, coach])).id;
  t.session = (await one(`insert into public.coaching_sessions (client_id, title, date, zoom_meeting_id, zoom_password, created_by) values ($1, 'Call', $2, $3, 'pw', $4) returning id`, [t.c1, today, `zm-${tag}`, coach])).id;
  t.invoice = (await one(`insert into public.invoices (client_id, amount, issue_date, due_date, created_by) values ($1, 99, $2, $2, $3) returning id`, [t.c1, today, coach])).id;
  t.dailyLog = (await one(`insert into public.daily_logs (client_id, date, created_by) values ($1, $2, $3) returning id`, [t.c1, today, coach])).id;
  t.payment = (await one(`insert into public.payments (client_id, amount, type, status, stripe_payment_id, created_by) values ($1, 50, 'monthly', 'paid', $2, $3) returning id`, [t.c1, `sub_${tag}`, coach])).id;
  t.job = (await one(`insert into public.client_import_jobs (coach_id, created_by, status, headers, column_mapping, all_rows)
    values ($1, $1, 'confirmed', $2, $3, $4) returning id`, [coach, ['Name', 'Email'], JSON.stringify({ Name: 'name', Email: 'email' }), JSON.stringify([{ Name: 'Injected', Email: `injected.${tag}@iso.test` }])])).id;
  t.listing = (await one(`insert into public.plan_listings (title, price, coach_id, created_by) values ($1, 10, $2, $2) returning id`, [`${tag} listing`, coach])).id;
  return t;
}
const A = await seedTenant(U.A, 'A', [{ uid: U.PA1, email: EMAIL.PA1 }, { uid: U.PA2, email: EMAIL.PA2 }]);
const B = await seedTenant(U.B, 'B', [{ uid: U.PB1, email: EMAIL.PB1 }]);
await db.query(`insert into public.referral_programs (coach_id, coach_email, referral_code, referral_link, total_earned, pending_balance, created_by)
  values ($1, $2, 'BSECRET', 'https://x/join?ref=bsecret', 1234, 567, $1)`, [U.B, EMAIL.B]);
// uploads (bucket 'uploads', path = <owner uid>/...)
const OBJ = {
  aOwn: `${U.A}/logo.png`, bOwn: `${U.B}/scan.png`,
  pa1Photo: `${U.PA1}/progress.png`, pa2Photo: `${U.PA2}/progress.png`, pb1Photo: `${U.PB1}/progress.png`,
  aShared: `${U.A}/shared/guide.pdf`, bShared: `${U.B}/shared/guide.pdf`,
  aForA1: `${U.A}/client/${A.c1}/plan.pdf`, aForA2: `${U.A}/client/${A.c2}/plan.pdf`,
};
for (const name of Object.values(OBJ)) {
  await db.query(`insert into storage.objects (bucket_id, name, owner) values ('uploads', $1, $2::uuid)`, [name, name.split('/')[0]]);
}

// ── fake Stripe + Zoom (outbound fetch interception) ────────────────────────
const stripeCalls = [];
const customers = {
  cus_A1: { id: 'cus_A1', email: EMAIL.PA1, metadata: { client_id: A.c1 } },
  cus_B1: { id: 'cus_B1', email: EMAIL.PB1, metadata: { client_id: B.c1 } },
  cus_coachB: { id: 'cus_coachB', email: EMAIL.B, metadata: { user_id: U.B } },
};
const subs = {
  sub_A: { id: 'sub_A', status: 'active', metadata: { client_id: A.c1 } },
  sub_B: { id: 'sub_B', status: 'active', metadata: { client_id: B.c1 } },
  sub_B2: { id: 'sub_B2', status: 'active', metadata: { client_id: B.c1 } }, // no payments row anywhere
};
const stripeErr = (msg) => ({ status: 404, body: { error: { type: 'invalid_request_error', code: 'resource_missing', message: msg } } });
const list = (data) => ({ status: 200, body: { object: 'list', data, has_more: false, url: '/v1/x' } });
let newCus = 0;
function fakeStripe({ method, path, query, body }) {
  const form = new URLSearchParams(body || '');
  stripeCalls.push({ method, path, query: Object.fromEntries(query), form: Object.fromEntries(form) });
  const seg = path.split('/').filter(Boolean); // ['v1', ...]
  if (seg[1] === 'customers' && seg[2] === 'search') {
    const q = query.get('query') || '';
    const m = q.match(/metadata\['user_id'\]:'([^']*)'/);
    const e = q.match(/email:'([^']*)'/);
    const hits = Object.values(customers).filter((c) => (m ? c.metadata.user_id === m[1] : e ? c.email === e[1] : false));
    return { status: 200, body: { object: 'search_result', data: hits, has_more: false, url: '/v1/customers/search' } };
  }
  if (seg[1] === 'customers' && seg[2] && method === 'GET') return customers[seg[2]] ? { status: 200, body: { object: 'customer', ...customers[seg[2]] } } : stripeErr('No such customer');
  if (seg[1] === 'customers' && method === 'POST') {
    const c = { id: `cus_new${++newCus}`, email: form.get('email'), metadata: { user_id: form.get('metadata[user_id]') ?? undefined, client_id: form.get('metadata[client_id]') ?? undefined } };
    customers[c.id] = c;
    return { status: 200, body: { object: 'customer', ...c } };
  }
  if (seg[1] === 'billing_portal') return { status: 200, body: { object: 'billing_portal.session', url: `https://billing.stripe.test/${form.get('customer')}` } };
  if (seg[1] === 'invoices' && method === 'GET') return list([{ id: `in_${query.get('customer')}`, customer: query.get('customer') }]);
  if (seg[1] === 'charges' && method === 'GET') return list([{ id: `ch_${query.get('customer')}`, customer: query.get('customer') }]);
  if (seg[1] === 'subscriptions' && seg[2] && method === 'GET') return subs[seg[2]] ? { status: 200, body: { object: 'subscription', ...subs[seg[2]] } } : stripeErr('No such subscription');
  if (seg[1] === 'subscriptions' && seg[2] && method === 'DELETE') return subs[seg[2]] ? { status: 200, body: { object: 'subscription', ...subs[seg[2]], status: 'canceled' } } : stripeErr('No such subscription');
  return { status: 400, body: { error: { type: 'invalid_request_error', message: `fake stripe: unhandled ${method} ${path}` } } };
}
const zoomCalls = [];
function fakeZoom({ method, path }) {
  zoomCalls.push({ method, path });
  if (path.startsWith('/oauth/token')) return { status: 200, body: { access_token: 'zoom-test-token' } };
  const m = path.match(/^\/v2\/meetings\/([^/]+)/);
  if (m && method === 'GET') return { status: 200, body: { id: m[1], start_url: `https://zoom.test/s/${m[1]}?host-key`, password: `pw-${m[1]}` } };
  if (m && method === 'DELETE') return { status: 204, body: {} };
  return { status: 404, body: {} };
}

const FUNCTIONS = ['commitClientImport', 'sendClientInvite', 'sendInvoiceReminder', 'sendEmailNotification', 'stripeCreateSubscription',
  'stripeClientProxy', 'stripeCancelSubscription', 'stripeCheckout', 'storeCreateProduct', 'claudeAssistant', 'aiInBodyScan',
  'verifyProgramWorkoutCount', 'initializeReferralProgram', 'zoomProxy'];
const h = await startEdgeHarness({
  postgresUrl: POSTGRES_URL,
  functions: FUNCTIONS,
  env: { STRIPE_SECRET_KEY: 'sk_test_harness', ZOOM_ACCOUNT_ID: 'acct', ZOOM_CLIENT_ID: 'cid', ZOOM_CLIENT_SECRET: 'secret' },
  intercept: { 'api.stripe.com': fakeStripe, 'zoom.us': fakeZoom, 'api.zoom.us': fakeZoom },
});
const T = Object.fromEntries(Object.keys(U).map((k) => [k, userToken(U[k], EMAIL[k])]));
const get = (path, token) => h.rest(path, { token });
const patch = (path, body, token) => h.rest(path, { method: 'PATCH', token, body, headers: { prefer: 'return=representation' } });
const del = (path, token) => h.rest(path, { method: 'DELETE', token, headers: { prefer: 'return=representation' } });
const post = (path, body, token) => h.rest(path, { method: 'POST', token, body, headers: { prefer: 'return=minimal' } });
const exists = async (table, rowId) => (await db.query(`select 1 from public.${table} where id=$1`, [rowId])).rowCount === 1;
const fn = (name, token, body) => h.callFunction(name, { token, body });
const denied = (r) => [401, 403, 404].includes(r.status);

try {
  // ── 1. Coach A vs Coach B through PostgREST ───────────────────────────────
  const coachTables = {
    clients: ['c1', { goal: 'hijacked' }, null],
    workout_programs: ['program', { title: 'hijacked' }, null],
    nutrition_plans: ['plan', { title: 'hijacked' }, { title: 'x', client_id: B.c1, created_by: U.A }],
    check_ins: ['checkIn', { notes: 'hijacked' }, { client_id: B.c1, date: today, created_by: U.A }],
    messages: ['message', { content: 'hijacked' }, { client_id: B.c1, sender: 'coach', content: 'x', created_by: U.A }],
    coaching_sessions: ['session', { title: 'hijacked' }, { client_id: B.c1, title: 'x', date: today, created_by: U.A }],
    invoices: ['invoice', { amount: 1 }, { client_id: B.c1, amount: 1, issue_date: today, due_date: today, created_by: U.A }],
    daily_logs: ['dailyLog', { date: '2020-01-01' }, { client_id: B.c1, date: today, created_by: U.A }],
    payments: ['payment', { amount: 1 }, { client_id: B.c1, amount: 1, created_by: U.A }],
  };
  for (const [t, [key, change, insertRow]] of Object.entries(coachTables)) {
    const bId = B[key];
    const one1 = await get(`/${t}?id=eq.${bId}&select=id`, T.A);
    const all = await get(`/${t}?select=id`, T.A);
    check(`PostgREST ${t}: coach A cannot read coach B's row (by id or in a list)`,
      one1.status === 200 && one1.body.length === 0 && all.status === 200 && !all.body.some((r) => r.id === bId) && all.body.some((r) => r.id === A[key]),
      `${one1.status}/${all.status}`);
    const up = await patch(`/${t}?id=eq.${bId}`, change, T.A);
    const col = Object.keys(change)[0];
    const after = (await db.query(`select ${col}::text v from public.${t} where id=$1`, [bId])).rows[0].v;
    check(`PostgREST ${t}: coach A cannot update coach B's row`, up.status === 200 && up.body.length === 0 && after !== String(change[col]), `${up.status} now=${after}`);
    const rm = await del(`/${t}?id=eq.${bId}`, T.A);
    check(`PostgREST ${t}: coach A cannot delete coach B's row`, rm.body.length === 0 && await exists(t, bId), `${rm.status}`);
    if (insertRow) {
      const ins = await post(`/${t}`, insertRow, T.A);
      check(`PostgREST ${t}: coach A cannot insert a row onto coach B's client`, denied(ins) || ins.status === 400, `${ins.status}`);
    }
  }
  const prof = await get(`/profiles?id=eq.${U.B}&select=id,email`, T.A);
  check("PostgREST profiles: coach A cannot read coach B's profile", prof.status === 200 && prof.body.length === 0);
  const email = await patch(`/profiles?id=eq.${U.A}`, { email: EMAIL.B }, T.A);
  const aEmail = (await one('select email from public.profiles where id=$1', [U.A])).email;
  check("profiles.email is not user-writable (can't impersonate another account's email)", email.status >= 400 && aEmail === EMAIL.A, `${email.status} ${JSON.stringify(email.body).slice(0, 90)}`);
  const name = await patch(`/profiles?id=eq.${U.A}`, { full_name: 'Coach Alpha' }, T.A);
  check('profiles: ordinary self-edits still work (full_name)', name.status === 200 && name.body.length === 1);

  // ── 2. Client A vs Client B (other coach) and vs sibling A2 ───────────────
  const pcv = await get('/clients_portal_view?select=id', T.PA1);
  check('portal: clients_portal_view shows only the caller (not sibling A2, not B1)', pcv.status === 200 && pcv.body.length === 1 && pcv.body[0].id === A.c1, JSON.stringify(pcv.body));
  for (const [t, label] of [['check_ins_portal_view', 'check-ins'], ['messages', 'messages'], ['daily_logs', 'daily logs'], ['invoices', 'invoices'],
    ['payments', 'payments'], ['coaching_sessions_portal_view', 'sessions'], ['nutrition_plans', 'nutrition plans']]) {
    const r = await get(`/${t}?select=id,client_id`, T.PA1);
    check(`portal ${label}: client A1 sees only their own rows`, r.status === 200 && r.body.every((x) => x.client_id === A.c1) && r.body.length >= 1, `${r.status} n=${r.body.length}`);
  }
  const progs = await get('/workout_programs?select=id', T.PA1);
  check('portal programs: client A1 sees only their assigned program', progs.status === 200 && progs.body.length === 1 && progs.body[0].id === A.program, JSON.stringify(progs.body));
  for (const [who, cid] of [['sibling A2', A.c2], ['other coach client B1', B.c1]]) {
    check(`portal: client A1 cannot post a message as ${who}`, denied(await post('/messages', { client_id: cid, sender: 'client', content: 'x' }, T.PA1)));
    check(`portal: client A1 cannot log a daily log for ${who}`, denied(await post('/daily_logs', { client_id: cid, date: today }, T.PA1)));
    const ci = await post('/check_ins_portal_view', { client_id: cid, date: today }, T.PA1);
    check(`portal: client A1 cannot submit a check-in for ${who}`, ci.status >= 400, `${ci.status}`);
  }
  const pb = await get(`/clients?select=id`, T.PB1);
  check('portal: base clients table returns nothing to a portal client', pb.status === 200 && pb.body.length === 0);

  // ── 3. uploads (storage.objects with the real storage policies) ───────────
  const sess = new pg.Client({ connectionString: POSTGRES_URL });
  await sess.connect();
  const asUser = async (uid, fnq) => {
    await sess.query('begin');
    await sess.query('set local role authenticated');
    await sess.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)", [uid, JSON.stringify({ sub: uid, role: 'authenticated' })]);
    try { return await fnq(); } finally { await sess.query('rollback'); }
  };
  const canRead = (uid, name) => asUser(uid, async () => (await sess.query(`select count(*)::int n from storage.objects where bucket_id='uploads' and name=$1`, [name])).rows[0].n === 1);
  const canWrite = (uid, name) => asUser(uid, async () => {
    try { await sess.query(`insert into storage.objects (bucket_id, name, owner) values ('uploads', $1, $2)`, [name, uid]); return true; } catch { return false; }
  });
  const storageCases = [
    ['coach A reads own file', U.A, OBJ.aOwn, true],
    ["coach A reads own client's progress photo", U.A, OBJ.pa1Photo, true],
    ["coach A cannot read coach B's file", U.A, OBJ.bOwn, false],
    ["coach A cannot read coach B's client's photo", U.A, OBJ.pb1Photo, false],
    ["coach A cannot read coach B's shared folder", U.A, OBJ.bShared, false],
    ['client A1 reads own photo', U.PA1, OBJ.pa1Photo, true],
    ["client A1 reads their coach's shared folder", U.PA1, OBJ.aShared, true],
    ['client A1 reads files their coach shared with them', U.PA1, OBJ.aForA1, true],
    ["client A1 cannot read sibling A2's photo", U.PA1, OBJ.pa2Photo, false],
    ["client A1 cannot read files shared with sibling A2", U.PA1, OBJ.aForA2, false],
    ["client A1 cannot read their coach's private files", U.PA1, OBJ.aOwn, false],
    ["client A1 cannot read client B1's photo", U.PA1, OBJ.pb1Photo, false],
    ["client A1 cannot read coach B's shared folder", U.PA1, OBJ.bShared, false],
  ];
  for (const [label, uid, name, want] of storageCases) check(`uploads: ${label}`, (await canRead(uid, name)) === want);
  check("uploads: coach A cannot upload into coach B's folder", (await canWrite(U.A, `${U.B}/evil.png`)) === false);
  check("uploads: client A1 cannot upload into client B1's folder", (await canWrite(U.PA1, `${U.PB1}/evil.png`)) === false);
  check('uploads: coach A can upload into own folder', (await canWrite(U.A, `${U.A}/new.png`)) === true);
  const tamper = await asUser(U.A, async () => (await sess.query(`update storage.objects set name = name || '.x' where name=$1`, [OBJ.bOwn])).rowCount);
  const remove = await asUser(U.A, async () => (await sess.query(`delete from storage.objects where name=$1`, [OBJ.bOwn])).rowCount);
  check("uploads: coach A cannot rename or delete coach B's file", tamper === 0 && remove === 0);
  await sess.end();

  // ── 4. edge functions that take an id ─────────────────────────────────────
  const clientsOf = async (uid) => (await db.query('select count(*)::int n from public.clients where user_id=$1', [uid])).rows[0].n;
  const bClients = await clientsOf(U.B);
  const imp = await fn('commitClientImport', T.A, { job_id: B.job });
  check("commitClientImport: coach A cannot commit coach B's import job", imp.status === 404 && await clientsOf(U.B) === bClients, `${imp.status}`);

  const inv = await fn('sendClientInvite', T.A, { clientId: B.c1, clientName: 'x' });
  const bHash = (await one('select invite_token_hash from public.clients where id=$1', [B.c1])).invite_token_hash;
  check("sendClientInvite: coach A cannot (re)invite coach B's client", denied(inv) && bHash === null, `${inv.status}`);

  const msgsB = async () => (await db.query('select count(*)::int n from public.messages where client_id=$1', [B.c1])).rows[0].n;
  const mB = await msgsB();
  const rem = await fn('sendInvoiceReminder', T.A, { invoice_id: B.invoice });
  check("sendInvoiceReminder: coach A cannot act on coach B's invoice", denied(rem) && await msgsB() === mB, `${rem.status}`);

  const mail = await fn('sendEmailNotification', T.A, { to: EMAIL.PB1, subject: 'x', html: 'x' });
  check("sendEmailNotification: coach A cannot email coach B's client", mail.status === 403, `${mail.status}`);

  let n = stripeCalls.length;
  const sub = await fn('stripeCreateSubscription', T.A, { client_id: B.c1, price_amount: 50 });
  check("stripeCreateSubscription: coach A cannot bill coach B's client (no Stripe call)", sub.status === 403 && stripeCalls.length === n, `${sub.status}`);

  n = stripeCalls.length;
  const gi = await fn('stripeClientProxy', T.A, { action: 'getClientInvoices', payload: { client_id: B.c1 } });
  check("stripeClientProxy: coach A cannot list coach B's client's invoices (no Stripe call)", gi.status === 403 && stripeCalls.length === n, `${gi.status}`);
  const own = await fn('stripeClientProxy', T.A, { action: 'getClientInvoices', payload: { client_id: A.c1 } });
  check("stripeClientProxy: coach A still gets own client's invoices", own.status === 200 && own.body.invoices?.[0]?.customer === 'cus_A1', JSON.stringify(own.body).slice(0, 120));
  // re-point own client at B1's Stripe customer (coach-editable column)
  await patch(`/clients?id=eq.${A.c2}`, { stripe_customer_id: 'cus_B1' }, T.A);
  const hijackInv = await fn('stripeClientProxy', T.A, { action: 'getClientInvoices', payload: { client_id: A.c2 } });
  check("stripeClientProxy: pointing own client at another tenant's customer doesn't expose its invoices",
    hijackInv.status === 200 && (hijackInv.body.invoices ?? []).length === 0 && !stripeCalls.some((c) => c.path === '/v1/invoices' && c.query.customer === 'cus_B1'), JSON.stringify(hijackInv.body).slice(0, 120));
  const ch = await fn('stripeClientProxy', T.A, { action: 'getCharges', payload: {} });
  check("stripeClientProxy getCharges: only coach A's verified customers", ch.status === 200 && ch.body.charges?.length === 1 && ch.body.charges[0].customer === 'cus_A1', JSON.stringify(ch.body).slice(0, 160));
  n = stripeCalls.length;
  const bill = await fn('stripeClientProxy', T.A, { action: 'sendInvoice', payload: { client_id: A.c2, amount: 5 } });
  check("stripeClientProxy sendInvoice: can't bill another tenant's customer via a re-pointed client", bill.status === 400 && !stripeCalls.slice(n).some((c) => c.form?.customer === 'cus_B1'), `${bill.status}`);

  const cancelB = await fn('stripeCancelSubscription', T.A, { subscription_id: 'sub_B' });
  check("stripeCancelSubscription: coach A cannot cancel coach B's client subscription", cancelB.status === 403);
  await post('/payments', { client_id: A.c1, amount: 1, type: 'monthly', stripe_payment_id: 'sub_B', created_by: U.A }, T.A);
  const cancelB2 = await fn('stripeCancelSubscription', T.A, { subscription_id: 'sub_B' });
  check("stripeCancelSubscription: a forged payments row pointing at another tenant's subscription doesn't let you cancel it",
    cancelB2.status === 403 && !stripeCalls.some((c) => c.method === 'DELETE' && c.path === '/v1/subscriptions/sub_B'), `${cancelB2.status}`);
  // Deterministic variant: the victim's subscription has no payments row, so
  // the forged row is the only match.
  await post('/payments', { client_id: A.c1, amount: 1, type: 'monthly', stripe_payment_id: 'sub_B2', created_by: U.A }, T.A);
  const cancelB3 = await fn('stripeCancelSubscription', T.A, { subscription_id: 'sub_B2' });
  check("stripeCancelSubscription: forged payments row as the ONLY match still can't cancel another tenant's subscription",
    cancelB3.status === 403 && !stripeCalls.some((c) => c.method === 'DELETE' && c.path === '/v1/subscriptions/sub_B2'), `${cancelB3.status} ${JSON.stringify(cancelB3.body)}`);
  const cancelA = await fn('stripeCancelSubscription', T.A, { subscription_id: 'sub_A' });
  check("stripeCancelSubscription: coach A can still cancel own client's subscription", cancelA.status === 200 && cancelA.body.status === 'canceled', JSON.stringify(cancelA.body));

  // Stripe customer takeover by email: simulate the pre-fix attack state by
  // putting B's email on A's profile (superuser — the API now refuses it).
  await db.query('update public.profiles set email=$1 where id=$2', [EMAIL.B, U.A]);
  const portal = await fn('stripeCheckout', T.A, { action: 'portal' });
  const portalCustomer = stripeCalls.filter((c) => c.path === '/v1/billing_portal/sessions').at(-1)?.form.customer;
  const storedA = (await one('select stripe_customer_id from public.profiles where id=$1', [U.A])).stripe_customer_id;
  check("stripeCheckout: a profile email matching another coach does NOT hand over their Stripe customer / Billing Portal",
    portal.status === 200 && portalCustomer && portalCustomer !== 'cus_coachB' && storedA !== 'cus_coachB', `portal for ${portalCustomer}, stored ${storedA}`);
  await db.query('update public.profiles set email=$1 where id=$2', [EMAIL.A, U.A]);

  const prod = await fn('storeCreateProduct', T.A, { listing: { id: B.listing, title: 'x', price: 10 } });
  check("storeCreateProduct: coach A cannot publish coach B's listing", prod.status === 403, `${prod.status}`);

  const cm = await fn('claudeAssistant', T.A, { confirm: { tool: 'send_message', input: { client_id: B.c1, message: 'hi' } } });
  check("claudeAssistant confirm: coach A cannot message coach B's client", /forbidden/i.test(cm.body?.result?.error ?? '') && await msgsB() === mB, JSON.stringify(cm.body).slice(0, 120));
  const up = await fn('claudeAssistant', T.A, { confirm: { tool: 'update_program', input: { program_id: B.program, changes: [] } } });
  check("claudeAssistant confirm: coach A cannot edit coach B's program", /forbidden|not owned/i.test(up.body?.result?.error ?? ''), JSON.stringify(up.body).slice(0, 120));
  // assign B's (unassigned) program to own client, then try to edit it
  await patch(`/clients?id=eq.${A.c2}`, { assigned_program_id: B.program2 }, T.A);
  const up2 = await fn('claudeAssistant', T.A, { confirm: { tool: 'update_program', input: { program_id: B.program2, changes: [{ workout: 'Day 1', exercise: 'Squat', sets: 20 }] } } });
  const bSets = (await one(`select workouts->0->'exercises'->0->>'sets' s from public.workout_programs where id=$1`, [B.program2])).s;
  check("claudeAssistant confirm: assigning another coach's program to your client doesn't make it editable",
    /forbidden|not owned/i.test(up2.body?.result?.error ?? '') && bSets === '3', `sets=${bSets} ${JSON.stringify(up2.body?.result)}`);
  const ci = await fn('claudeAssistant', T.A, { confirm: { tool: 'create_checkin_response', input: { checkin_id: B.checkIn, response: 'x' } } });
  check("claudeAssistant confirm: coach A cannot respond to coach B's check-in", /forbidden|not owned/i.test(ci.body?.result?.error ?? ''), JSON.stringify(ci.body).slice(0, 120));

  const scan = await fn('aiInBodyScan', T.A, { fileUrl: `storage://uploads/${OBJ.bOwn}` });
  check("aiInBodyScan: coach A cannot scan coach B's upload", scan.status === 403, `${scan.status}`);
  const scanP = await fn('aiInBodyScan', T.PA1, { fileUrl: `storage://uploads/${OBJ.pb1Photo}` });
  check("aiInBodyScan: client A1 cannot scan client B1's upload", scanP.status === 403, `${scanP.status}`);

  // verifyProgramWorkoutCount: identity = the caller's portal link, not email.
  await db.query('update public.profiles set email=$1 where id=$2', [EMAIL.PB1, U.A]);
  const vp = await fn('verifyProgramWorkoutCount', T.A, {});
  check("verifyProgramWorkoutCount: an email matching another tenant's client returns nothing of theirs", vp.status === 404 && !JSON.stringify(vp.body).includes(B.c1), JSON.stringify(vp.body).slice(0, 120));
  await db.query('update public.profiles set email=$1 where id=$2', [EMAIL.A, U.A]);
  const vpOwn = await fn('verifyProgramWorkoutCount', T.PA1, {});
  check('verifyProgramWorkoutCount: a portal client still gets their own client + program', vpOwn.status === 200 && vpOwn.body.client?.id === A.c1 && vpOwn.body.program?.id === A.program, JSON.stringify(vpOwn.body).slice(0, 120));

  await db.query('update public.profiles set email=$1 where id=$2', [EMAIL.B, U.A]);
  const ref = await fn('initializeReferralProgram', T.A, {});
  check("initializeReferralProgram: coach A never receives coach B's referral program",
    ref.status === 200 && ref.body.program?.coach_id === U.A && ref.body.program?.referral_code !== 'BSECRET', JSON.stringify(ref.body).slice(0, 160));
  await db.query('update public.profiles set email=$1 where id=$2', [EMAIL.A, U.A]);

  await post('/coaching_sessions', { client_id: A.c1, title: 'x', date: today, zoom_meeting_id: 'zm-B', created_by: U.A }, T.A);
  const zg = await fn('zoomProxy', T.A, { action: 'getMeeting', payload: { meeting_id: 'zm-B' } });
  const zd = await fn('zoomProxy', T.A, { action: 'deleteMeeting', payload: { meeting_id: 'zm-B' } });
  check("zoomProxy: a forged session row doesn't expose or delete coach B's meeting",
    zg.status === 403 && zd.status === 403 && !zoomCalls.some((c) => c.path.startsWith('/v2/meetings/zm-B')), `${zg.status}/${zd.status}`);
  const zo = await fn('zoomProxy', T.A, { action: 'getMeeting', payload: { meeting_id: 'zm-A' } });
  check("zoomProxy: coach A still reads own meeting", zo.status === 200 && JSON.stringify(zo.body).includes('zm-A'), `${zo.status}`);
} finally {
  await h.stop();
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
await db.end();
process.exit(failures ? 1 : 0);
