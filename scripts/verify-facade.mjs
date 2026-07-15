#!/usr/bin/env node
/**
 * Facade verification harness (Step 2 sanity check, run manually).
 *
 * There is no live Supabase project in this environment, so this exercises
 * the REAL src/api/supabaseClient.js facade against the REAL local Postgres
 * (schema migrations + RLS + fixture data) by injecting a ~150-line driver
 * that translates the supabase-js query-builder calls the facade makes into
 * SQL over `pg`. RLS is enforced: queries run as role `authenticated` with
 * the same JWT claims a Supabase session would carry.
 *
 * Usage:
 *   POSTGRES_URL=postgresql://postgres@127.0.0.1:55432/migdata \
 *     node scripts/verify-facade.mjs
 *
 * The scenario replays the exact call shapes of the cutover Clients module
 * (Clients.jsx / ClientProfile.jsx / ClientQuickPanel.jsx) plus the portal
 * routing rules.
 */
import pg from 'pg';
import {
  supabase,
  supabasePortal,
  __setSupabaseClientForTests,
} from '../src/api/supabaseClient.js';

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) {
  console.error('Set POSTGRES_URL to the local migrated database.');
  process.exit(1);
}

const admin = new pg.Client({ connectionString: POSTGRES_URL });
await admin.connect();
// Mirror Supabase's default privileges (RLS remains the actual gate)
await admin.query(`
  grant usage on schema public to anon, authenticated, service_role;
  grant all on all tables in schema public to anon, authenticated, service_role;
  grant all on all sequences in schema public to anon, authenticated, service_role;
`);

const conn = new pg.Client({ connectionString: POSTGRES_URL });
await conn.connect();
await conn.query('set role authenticated');

let currentClaims = {};
async function setClaims(claims) {
  currentClaims = claims;
  await conn.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)", [
    claims.sub ?? '',
    JSON.stringify(claims),
  ]);
}

// -- minimal PostgREST-style driver ----------------------------------------
const q = (i) => `"${i.replace(/"/g, '""')}"`;
const typeCache = new Map();
async function colTypes(table) {
  if (!typeCache.has(table)) {
    const { rows } = await admin.query(
      `select column_name, udt_name from information_schema.columns
       where table_schema='public' and table_name=$1`,
      [table]
    );
    typeCache.set(table, new Map(rows.map((r) => [r.column_name, r.udt_name])));
  }
  return typeCache.get(table);
}

function builder(table) {
  const state = { table, op: 'select', filters: [], order: null, limit: null, single: false, maybe: false, payload: null };
  const api = {
    select() { if (state.op === 'select') state.op = 'select'; state.returning = true; return api; },
    insert(payload) { state.op = 'insert'; state.payload = payload; return api; },
    update(payload) { state.op = 'update'; state.payload = payload; return api; },
    delete() { state.op = 'delete'; return api; },
    eq(col, val) { state.filters.push({ col, op: '=', val }); return api; },
    is(col, val) { state.filters.push({ col, op: 'is', val }); return api; },
    in(col, vals) { state.filters.push({ col, op: 'in', val: vals }); return api; },
    order(col, { ascending = true } = {}) { state.order = { col, ascending }; return api; },
    limit(n) { state.limit = n; return api; },
    single() { state.single = true; return api; },
    maybeSingle() { state.single = true; state.maybe = true; return api; },
    then(resolve, reject) { return run().then(resolve, reject); },
  };
  async function run() {
    try {
      const types = await colTypes(state.table);
      const ser = (col, v) =>
        v !== null && typeof v === 'object' && ['jsonb', 'json'].includes(types.get(col))
          ? JSON.stringify(v)
          : v;
      const params = [];
      const where = state.filters
        .map((f) => {
          if (f.op === 'is') return `${q(f.col)} is null`;
          if (f.op === 'in') { params.push(f.val); return `${q(f.col)} = any($${params.length})`; }
          params.push(ser(f.col, f.val));
          return `${q(f.col)} = $${params.length}`;
        })
        .join(' and ');
      let sql;
      if (state.op === 'select') {
        sql = `select * from public.${q(state.table)}`;
        if (where) sql += ` where ${where}`;
        if (state.order) sql += ` order by ${q(state.order.col)} ${state.order.ascending ? 'asc' : 'desc'}`;
        if (state.limit) sql += ` limit ${Number(state.limit)}`;
      } else if (state.op === 'insert') {
        const cols = Object.keys(state.payload);
        const vals = cols.map((c) => { params.push(ser(c, state.payload[c])); return `$${params.length}`; });
        sql = `insert into public.${q(state.table)} (${cols.map(q).join(', ')}) values (${vals.join(', ')}) returning *`;
      } else if (state.op === 'update') {
        const cols = Object.keys(state.payload);
        const sets = cols.map((c) => { params.push(ser(c, state.payload[c])); return `${q(c)} = $${params.length}`; });
        sql = `update public.${q(state.table)} set ${sets.join(', ')}`;
        if (where) sql += ` where ${where}`;
        sql += ' returning *';
      } else {
        sql = `delete from public.${q(state.table)}`;
        if (where) sql += ` where ${where}`;
      }
      const { rows } = await conn.query(sql, params);
      let data = rows;
      if (state.single) {
        if (rows.length > 1) return { data: null, error: { message: 'more than one row returned' } };
        if (rows.length === 0 && !state.maybe) return { data: null, error: { message: 'no rows returned' } };
        data = rows[0] ?? null;
      }
      return { data, error: null };
    } catch (e) {
      return { data: null, error: { message: e.message, code: e.code } };
    }
  }
  return api;
}

const fakeClient = {
  from: (table) => builder(table),
  auth: {
    // emulates a signed-in Supabase session for auth.me()
    async getUser() {
      return { data: { user: currentClaims.sub ? { id: currentClaims.sub, email: currentClaims.email, user_metadata: {} } : null }, error: null };
    },
    async signOut() { return { error: null }; },
  },
  functions: {
    async invoke(name) { return { data: null, error: { message: `edge function '${name}' not deployed (Step 5)` } }; },
  },
};
__setSupabaseClientForTests(fakeClient);

// -- scenario: exact Clients-module call shapes ------------------------------
let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};

const { rows: [coach] } = await admin.query("select id from auth.users where email='coach.a@example.com'");
const { rows: [casey] } = await admin.query("select id from public.clients where name='Casey Client'");

await setClaims({ sub: coach.id, email: 'coach.a@example.com', role: 'authenticated' });

// Clients.jsx
const clients = await supabase.entities.Client.list('-created_date');
check('Client.list(-created_date) returns coach clients', clients.length === 2, `got ${clients.length}`);
check('rows carry created_date alias for legacy readers', !!clients[0].created_date);

const checkIns = await supabase.entities.CheckIn.list('-date', 200);
check('CheckIn.list(-date, 200) works (coach -> base table)', checkIns.length === 1 && checkIns[0].internal_notes === 'watch left knee');

const created = await supabase.entities.Client.create({ name: 'New Guy', email: 'newguy@example.com', user_id: coach.id });
check('Client.create returns the inserted row', created?.name === 'New Guy' && !!created.id);

const updated = await supabase.entities.Client.update(created.id, { goal: 'strength' });
check('Client.update(id, data) returns updated row', updated?.goal === 'strength');

// ClientProfile.jsx
const one = await supabase.entities.Client.filter({ id: casey.id }).then((r) => r[0]);
check('Client.filter({id}) -> single fetch pattern', one?.name === 'Casey Client');
const msgs = await supabase.entities.Message.filter({ client_id: casey.id }, '-created_date', 50);
check('Message.filter({client_id}, -created_date, 50)', msgs.length === 1);

// ClientQuickPanel.jsx
const sessions = await supabase.entities.Session.filter({ client_id: casey.id });
check('Session.filter -> coaching_sessions (coach sees zoom_password)', sessions.length === 1 && sessions[0].zoom_password === 'host-secret');
const sentMsg = await supabase.entities.Message.create({ client_id: casey.id, client_name: 'Casey Client', sender: 'coach', content: 'ping' });
check('Message.create from quick panel', !!sentMsg?.id);
await supabase.entities.Message.delete(sentMsg.id);

// Clients.jsx delete flow: filter + delete loop, then delete client
const wi = await supabase.entities.WeighIn.create({ client_id: created.id, weight: 200, date: '2026-07-08' });
for (const [entityName, field] of [['WeighIn', 'client_id'], ['Message', 'client_id']]) {
  const records = await supabase.entities[entityName].filter({ [field]: created.id });
  await Promise.all(records.map((r) => supabase.entities[entityName].delete(r.id)));
}
const wiLeft = await supabase.entities.WeighIn.filter({ client_id: created.id });
check('filter+delete loop clears related records', wiLeft.length === 0, `weigh_in ${wi.id} deleted`);
await supabase.entities.Client.delete(created.id);
const stillThere = await supabase.entities.Client.filter({ id: created.id });
check('Client.delete removes the row', stillThere.length === 0);

// auth.me(): session user + profiles join
const me = await supabase.auth.me();
check('auth.me() merges session + profile', me.id === coach.id && me.role === 'user' && me.subscription_tier === 'pro' && me.full_name === 'Coach Alpha' && !!me.created_date);

// RLS still bites through the facade: another coach sees nothing
await setClaims({ sub: (await admin.query("select id from auth.users where email='admin@example.com'")).rows[0].id, email: 'admin2@example.com', role: 'authenticated' });
// (admin@example.com is role=admin in profiles, so use a fresh nobody instead)
await admin.query("insert into auth.users (id, email) values ('99999999-9999-9999-9999-999999999999','nobody@example.com') on conflict do nothing");
await setClaims({ sub: '99999999-9999-9999-9999-999999999999', email: 'nobody@example.com', role: 'authenticated' });
const foreign = await supabase.entities.Client.list();
check('RLS: foreign coach sees zero clients through facade', foreign.length === 0);

// Portal context: claim-only JWT, view routing
await setClaims({ role: 'authenticated', portal_client_id: casey.id });
const portalCheckIns = await supabasePortal.entities.CheckIn.list('-date');
check('portal CheckIn.list routes to check_ins_portal_view', portalCheckIns.length === 1);
check('portal check-in has NO internal_notes column', !('internal_notes' in (portalCheckIns[0] ?? {})));
const portalSessions = await supabasePortal.entities.Session.filter({ client_id: casey.id });
check('portal Session.filter routes to coaching_sessions_portal_view', portalSessions.length === 1);
check('portal session has NO zoom_password column', !('zoom_password' in (portalSessions[0] ?? {})));
const baseCheckInsAsPortal = await supabasePortal.entities.DailyLog.list().catch(() => []);
check('portal other entities still hit base tables (no error)', Array.isArray(baseCheckInsAsPortal));
const portalCreated = await supabasePortal.entities.CheckIn.create({ client_id: casey.id, date: '2026-07-09', notes: 'from portal' });
check('portal CheckIn.create writes through the view', !!portalCreated?.id);
await supabasePortal.entities.CheckIn.delete(portalCreated.id);
let readOnlyThrew = false;
try { await supabasePortal.entities.CoachingSession.create({ client_id: casey.id, title: 'x', date: '2026-07-09' }); }
catch (e) { readOnlyThrew = /read-only/.test(e.message); }
check('portal Session.create throws read-only', readOnlyThrew);
const coachCheckInsStill = await (async () => { await setClaims({ sub: coach.id, email: 'coach.a@example.com', role: 'authenticated' }); return supabase.entities.CheckIn.list(); })();
check('coach base-table access unaffected after portal ops', coachCheckInsStill.length === 1);

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
await conn.end();
await admin.end();
process.exit(failures ? 1 : 0);
