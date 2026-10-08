#!/usr/bin/env node
/**
 * Client app fixes (fix pass 1, item 7) — data layer + AI tone.
 *
 * Through REAL PostgREST (RLS) and the REAL AI edge functions under Deno
 * (scripts/lib/edgeHarness.mjs; Anthropic faked by intercepting
 * api.anthropic.com so the prompt can be inspected), against a fresh
 * migrated database:
 *   1. portal_coach_view: a portal client sees their own coach's display
 *      name / business / avatar / logo — and only those columns; never another
 *      coach's; coaches and anon see nothing; unpublished white-label logos
 *      are not exposed.
 *   2. weigh-ins: a portal client sees their own (incl. the coach's pending
 *      one) but not a sibling's; portal_log_weigh_in fills in ONLY their own
 *      pending entry, once, with a sane weight.
 *   3. portal_update_my_avatar: sets only the caller's own avatar, only to a
 *      file in their own uploads folder.
 *   4. invoices/payments stay non-writable by portal clients (the fake
 *      "mark as paid" write was removed, not permitted).
 *   5. supplement grouping (src/lib/supplements.js): the coach's real list,
 *      every timing kept, plain-name entries accepted, nothing invented.
 *   6. AI reply tone: aiCheckInInsights now applies the chosen tone;
 *      aiMessageAssistant generateReply keeps applying it.
 *
 * Usage (fresh database: auth-shim.sql + all migrations):
 *   POSTGRES_URL=postgresql://postgres@127.0.0.1:55432/catest \
 *   POSTGREST_BIN=/path/to/postgrest DENO_BIN=/path/to/deno \
 *     node scripts/verify-client-app.mjs
 */
import pg from 'pg';
import { startEdgeHarness, userToken, ANON_KEY } from './lib/edgeHarness.mjs';
import { groupSupplements } from '../src/lib/supplements.js';
import { TONE_INSTRUCTIONS } from '../supabase/functions/_shared/aiTone.js';

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error('Set POSTGRES_URL'); process.exit(1); }
const db = new pg.Client({ connectionString: POSTGRES_URL });
await db.connect();

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};

// ── 5. supplements (pure) ───────────────────────────────────────────────────
{
  const g = groupSupplements([
    { name: 'Creatine', dosage: '5g', timing: 'Pre-Workout' },
    { name: 'Whey', timing: 'post-workout' },
    { name: 'Magnesium', timing: 'Before Bed' },
    { name: 'Vitamin D', timing: 'Morning' },
    { name: 'Fish oil', timing: 'With Meals' },
    'Electrolytes',
    { name: 'Mystery', timing: 'Whenever' },
    { name: '' },
  ]);
  const titles = g.map((x) => x.title);
  check('supplements: grouped in day order, every timing kept', titles.join('|') === 'Morning|Pre-Workout|Post-Workout|With Meals|Night|Any time', titles.join('|'));
  check('supplements: plain-name and unknown-timing entries land in "Any time"', g.at(-1).items.map((i) => i.name).join(',') === 'Electrolytes,Mystery');
  check('supplements: blank entries dropped, dose kept', g.flatMap((x) => x.items).length === 7 && g[1].items[0].dose === '5g');
  check('supplements: empty plan -> nothing invented', groupSupplements([]).length === 0 && groupSupplements(null).length === 0);
}

// ── fixtures ────────────────────────────────────────────────────────────────
const id = (n) => `ca000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const U = { A: id(1), B: id(2), PA1: id(3), PA2: id(4), PB1: id(5) };
if ((await db.query('select 1 from auth.users where id=$1', [U.A])).rowCount) {
  console.error('verify-client-app needs a FRESH migrated database.');
  process.exit(1);
}
for (const [k, v] of Object.entries(U)) await db.query('insert into auth.users (id, email) values ($1, $2)', [v, `${k.toLowerCase()}@ca.test`]);
await db.query(`update public.profiles set billing_status='active', subscription_tier='elite', full_name=$2 where id=$1`, [U.A, 'Alex Profile']);
await db.query(`update public.profiles set billing_status='active', subscription_tier='elite', full_name=$2, avatar_url=$3 where id=$1`, [U.B, 'Blair Coach', 'https://cdn.test/blair.png']);
await db.query(`insert into public.coach_profiles (coach_id, first_name, last_name, business_name, avatar_url, created_by) values ($1, 'Alex', 'Morgan', 'Morgan Strength', 'https://cdn.test/alex.png', $1)`, [U.A]);
await db.query(`insert into public.white_label_settings (coach_id, is_published, business_name, logo_primary_url, created_by) values ($1, true, 'Morgan Strength Co', 'https://cdn.test/morgan-logo.png', $1)`, [U.A]);
await db.query(`insert into public.white_label_settings (coach_id, is_published, business_name, logo_primary_url, created_by) values ($1, false, 'Secret Draft', 'https://cdn.test/draft.png', $1)`, [U.B]);
await db.query(`insert into public.business_settings (coach_id, logo_url, created_by) values ($1, 'https://cdn.test/blair-bs-logo.png', $1)`, [U.B]);
const one = async (sql, v) => (await db.query(sql, v)).rows[0];
const client = async (coach, portal, name) => (await one(
  `insert into public.clients (name, email, user_id, created_by, portal_user_id, lifecycle_status) values ($1, $2, $3, $3, $4, 'active') returning id`,
  [name, `${name.toLowerCase()}@ca.test`, coach, portal])).id;
const A1 = await client(U.A, U.PA1, 'A1');
const A2 = await client(U.A, U.PA2, 'A2');
await client(U.B, U.PB1, 'B1');
const today = new Date().toISOString().slice(0, 10);
const weigh = async (cid, w, coach) => (await one(`insert into public.weigh_ins (client_id, date, weight, note, created_by) values ($1, $2, $3, 'Weigh in Friday', $4) returning id`, [cid, today, w, coach])).id;
const pendingA1 = await weigh(A1, 0, U.A);
const recordedA1 = await weigh(A1, 180, U.A);
const pendingA2 = await weigh(A2, 0, U.A);
const invA1 = (await one(`insert into public.invoices (client_id, amount, issue_date, due_date, status, created_by) values ($1, 120, $2, $2, 'sent', $3) returning id`, [A1, today, U.A])).id;

// ── stack ───────────────────────────────────────────────────────────────────
const prompts = [];
const h = await startEdgeHarness({
  postgresUrl: POSTGRES_URL,
  functions: ['aiCheckInInsights', 'aiMessageAssistant'],
  env: { ANTHROPIC_API_KEY: 'sk-ant-harness' },
  intercept: {
    'api.anthropic.com': ({ body }) => {
      const req = JSON.parse(body || '{}');
      prompts.push(JSON.stringify(req.messages ?? []));
      const tool = req.tools?.[0]?.name;
      const content = tool
        ? [{ type: 'tool_use', id: 'tu', name: tool, input: { summary: 's', suggested_response: 'r', flags: [] } }]
        : [{ type: 'text', text: '{"message":"Nice work","tone":"Direct"}' }];
      return { status: 200, body: { id: 'm', type: 'message', role: 'assistant', stop_reason: tool ? 'tool_use' : 'end_turn', usage: { output_tokens: 5 }, content } };
    },
  },
});
const T = Object.fromEntries(Object.entries(U).map(([k, v]) => [k, userToken(v, `${k.toLowerCase()}@ca.test`)]));
const rest = (path, token, opts = {}) => h.rest(path, { token, ...opts });
const rpc = (fn, args, token) => h.rest(`/rpc/${fn}`, { method: 'POST', token, body: args });
const weightOf = async (wid) => (await one('select weight::text w from public.weigh_ins where id=$1', [wid])).w;

try {
  // ── 1. coach identity ─────────────────────────────────────────────────────
  const pa1 = await rest('/portal_coach_view?select=*', T.PA1);
  const row = pa1.body?.[0] ?? {};
  check('coach view: portal client sees exactly their own coach row', pa1.status === 200 && pa1.body.length === 1 && row.client_id === A1, JSON.stringify(pa1.body));
  check('coach view: name from the coach profile, published white-label business + logo',
    row.coach_name === 'Alex Morgan' && row.business_name === 'Morgan Strength Co' && row.logo_url === 'https://cdn.test/morgan-logo.png' && row.avatar_url === 'https://cdn.test/alex.png', JSON.stringify(row));
  check('coach view: display columns only (no ids, emails, billing, notes)',
    Object.keys(row).sort().join(',') === 'avatar_url,business_name,client_id,coach_name,logo_url', Object.keys(row).join(','));
  const pb1 = (await rest('/portal_coach_view?select=*', T.PB1)).body?.[0] ?? {};
  check("coach view: another coach's client gets THEIR coach, and an unpublished white-label isn't exposed",
    pb1.coach_name === 'Blair Coach' && pb1.logo_url === 'https://cdn.test/blair-bs-logo.png' && pb1.business_name !== 'Secret Draft', JSON.stringify(pb1));
  const coachSees = await rest('/portal_coach_view?select=*', T.A);
  check('coach view: a coach session sees no rows', coachSees.status === 200 && coachSees.body.length === 0);
  const anon = await rest('/portal_coach_view?select=*', ANON_KEY);
  check('coach view: anonymous callers get nothing', anon.status >= 400 || (Array.isArray(anon.body) && anon.body.length === 0), `${anon.status}`);
  check('coach view: read-only', (await rest('/portal_coach_view', T.PA1, { method: 'POST', body: { coach_name: 'x' } })).status >= 400);

  // ── 2. weigh-ins ──────────────────────────────────────────────────────────
  const w = await rest('/weigh_ins?select=id,weight,client_id', T.PA1);
  const ids = new Set((w.body ?? []).map((x) => x.id));
  check("weigh-ins: portal client sees their own (incl. the coach's pending one), not a sibling's",
    w.status === 200 && ids.has(pendingA1) && ids.has(recordedA1) && !ids.has(pendingA2), `n=${w.body?.length}`);
  const log = await rpc('portal_log_weigh_in', { p_weigh_in: pendingA1, p_weight: 178.4 }, T.PA1);
  check('weigh-ins: client logs their pending weigh-in', log.status < 300 && await weightOf(pendingA1) === '178.40', `${log.status} ${JSON.stringify(log.body)} weight=${await weightOf(pendingA1)}`);
  check('weigh-ins: logging the same entry again is refused',
    (await rpc('portal_log_weigh_in', { p_weigh_in: pendingA1, p_weight: 150 }, T.PA1)).status >= 400 && await weightOf(pendingA1) === '178.40');
  check("weigh-ins: can't overwrite a weight the coach recorded",
    (await rpc('portal_log_weigh_in', { p_weigh_in: recordedA1, p_weight: 150 }, T.PA1)).status >= 400 && await weightOf(recordedA1) === '180.00');
  check("weigh-ins: can't log a sibling's weigh-in",
    (await rpc('portal_log_weigh_in', { p_weigh_in: pendingA2, p_weight: 150 }, T.PA1)).status >= 400 && await weightOf(pendingA2) === '0.00');
  check('weigh-ins: nonsense weights refused',
    (await rpc('portal_log_weigh_in', { p_weigh_in: pendingA2, p_weight: -5 }, T.PA2)).status >= 400
    && (await rpc('portal_log_weigh_in', { p_weigh_in: pendingA2, p_weight: 5000 }, T.PA2)).status >= 400);
  const direct = await rest(`/weigh_ins?id=eq.${pendingA2}`, T.PA2, { method: 'PATCH', body: { weight: 1, note: 'x' }, headers: { prefer: 'return=representation' } });
  check('weigh-ins: direct table update by a portal client still matches nothing', (direct.body ?? []).length === 0 && await weightOf(pendingA2) === '0.00');

  // ── 3. avatar ─────────────────────────────────────────────────────────────
  const mine = `storage://uploads/${U.PA1}/avatar.png`;
  const av = await rpc('portal_update_my_avatar', { p_avatar_url: mine }, T.PA1);
  const view = (await rest('/clients_portal_view?select=avatar_url', T.PA1)).body?.[0];
  check('avatar: portal client sets their own photo (visible through clients_portal_view)', av.status < 300 && view?.avatar_url === mine, `${av.status} ${JSON.stringify(av.body)}`);
  check("avatar: only that client's row changed", (await one('select avatar_url from public.clients where id=$1', [A2])).avatar_url === null);
  check("avatar: can't point it at someone else's file", (await rpc('portal_update_my_avatar', { p_avatar_url: `storage://uploads/${U.A}/logo.png` }, T.PA1)).status >= 400);
  check("avatar: a coach (not a portal client) can't use it", (await rpc('portal_update_my_avatar', { p_avatar_url: `storage://uploads/${U.A}/x.png` }, T.A)).status >= 400);

  // ── 4. invoices / payments stay read-only for portal clients ──────────────
  const inv = await rest(`/invoices?id=eq.${invA1}`, T.PA1, { method: 'PATCH', body: { status: 'paid' }, headers: { prefer: 'return=representation' } });
  check('billing: a portal client cannot mark an invoice paid', (inv.body ?? []).length === 0 && (await one('select status from public.invoices where id=$1', [invA1])).status === 'sent');
  const pay = await rest('/payments', T.PA1, { method: 'POST', body: { client_id: A1, amount: 120, status: 'paid' } });
  check('billing: a portal client cannot create a payment record', pay.status >= 400, `${pay.status}`);
  check('billing: portal client can still read their invoices', ((await rest('/invoices?select=id', T.PA1)).body ?? []).some((x) => x.id === invA1));

  // ── 6. AI tone ────────────────────────────────────────────────────────────
  const checkIn = { date: today, weight: 180, mood: 'good', notes: 'Felt strong' };
  for (const tone of ['warm', 'direct', 'detailed']) {
    prompts.length = 0;
    const r = await h.callFunction('aiCheckInInsights', { token: T.A, body: { action: 'reviewCheckIn', checkIn, clientName: 'A1', tone } });
    check(`tone: aiCheckInInsights applies "${tone}"`, r.status === 200 && prompts.length === 1 && prompts[0].includes(TONE_INSTRUCTIONS[tone].slice(0, 40)), `${r.status} ${JSON.stringify(r.body).slice(0, 100)}`);
  }
  prompts.length = 0;
  await h.callFunction('aiCheckInInsights', { token: T.A, body: { action: 'reviewCheckIn', checkIn, clientName: 'A1' } });
  check('tone: no tone -> previous default wording', Boolean(prompts[0]?.includes('encouraging and actionable')));
  prompts.length = 0;
  const gr = await h.callFunction('aiMessageAssistant', { token: T.A, body: { action: 'generateReply', client: { name: 'A1' }, tone: 'professional', conversationMessages: [] } });
  check('tone: aiMessageAssistant generateReply still applies the tone', gr.status === 200 && Boolean(prompts[0]?.includes(TONE_INSTRUCTIONS.professional.slice(0, 40))), `${gr.status} ${JSON.stringify(gr.body).slice(0, 100)}`);
} finally {
  await h.stop();
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
await db.end();
process.exit(failures ? 1 : 0);
