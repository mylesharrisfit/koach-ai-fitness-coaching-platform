#!/usr/bin/env node
/**
 * Step 6 rehearsal — the rebuilt RBAC against REAL RLS (same harness pattern
 * as verify-auth.mjs: a `set role authenticated` session with PostgREST-style
 * JWT claims), plus the shared server-side role resolver the billing gates
 * use (_shared/teamRole.js — real module, service shim).
 *
 * Identities: founding owner, co-owner (promoted coach), coach member,
 * outsider, platform admin (profiles.role='admin').
 *
 * Proves:
 *   - app.team_role()/app.is_team_owner(): owner/co-owner/coach/null tiers.
 *   - coach keeps CLIENT WORK (team-scoped reads/updates via is_team_member)
 *     but has NO team management: cannot invite, cannot remove, cannot touch
 *     team settings.
 *   - the self-promotion hole is closed: a coach updating their OWN
 *     team_members row cannot change role_label (trigger) or team_id.
 *   - invite acceptance still works (bind user_id + flip invite_status).
 *   - co-owners (role_label='owner') actually get management rights.
 *   - platform admin ('admin' profiles.role) is cross-tenant and SEPARATE
 *     from team tiers; coaches are role='user' and is_admin()=false.
 *   - billing gate: resolveTeamRole/billingDeniedFor deny coach-tier members,
 *     allow owners and solo coaches.
 *
 * Setup (throwaway DB):
 *   psql -p 55432 -U postgres -c 'create database rbactest'
 *   psql -p 55432 -U postgres -d rbactest -f scripts/fixtures/auth-shim.sql
 *   for f in supabase/migrations/*.sql; do psql ... -d rbactest -f $f; done
 * Run:
 *   POSTGRES_URL=postgresql://postgres@127.0.0.1:55432/rbactest \
 *     node scripts/verify-rbac.mjs
 */
import pg from 'pg';
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1184, (v) => v);
pg.types.setTypeParser(1114, (v) => v);

import { resolveTeamRole, billingDeniedFor } from '../supabase/functions/_shared/teamRole.js';

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error('Set POSTGRES_URL'); process.exit(1); }

const admin = new pg.Client({ connectionString: POSTGRES_URL });
await admin.connect();
await admin.query(`
  grant usage on schema public to anon, authenticated, service_role;
  grant all on all tables in schema public to anon, authenticated, service_role;
`);

const sess = new pg.Client({ connectionString: POSTGRES_URL });
await sess.connect();
await sess.query('set role authenticated');
async function as(uid, email) {
  await sess.query(
    "select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)",
    [uid ?? '', JSON.stringify({ sub: uid, email })],
  );
}

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};
// run a session query expecting an RLS/trigger denial
async function denied(sql, params) {
  try {
    const r = await sess.query(sql, params);
    // UPDATE/DELETE silently affecting 0 rows is also a denial under RLS
    return r.command !== 'SELECT' && r.rowCount === 0 ? { silent: true } : false;
  } catch (e) {
    return { error: e.message };
  }
}

// ── seed ─────────────────────────────────────────────────────────────────────
const O = '00000000-0000-0000-0000-0000000000b1'; // founding owner
const W = '00000000-0000-0000-0000-0000000000b2'; // co-owner (promoted)
const C = '00000000-0000-0000-0000-0000000000b3'; // coach member
const X = '00000000-0000-0000-0000-0000000000b4'; // outsider
const P = '00000000-0000-0000-0000-0000000000b5'; // platform admin
const N = '00000000-0000-0000-0000-0000000000b6'; // invited, pending

for (const t of ['team_members', 'teams', 'messages', 'workout_sessions', 'clients', 'notifications']) {
  await admin.query(`delete from public.${t}`);
}
for (const [id, email, name] of [
  [O, 'owner@rbac.io', 'Olive Owner'], [W, 'co@rbac.io', 'Wren Coowner'],
  [C, 'coach@rbac.io', 'Cody Coach'], [X, 'out@rbac.io', 'Xena Outsider'],
  [P, 'staff@rbac.io', 'Pat Platform'], [N, 'newbie@rbac.io', 'Nia Newbie'],
]) {
  await admin.query('delete from public.profiles where id=$1', [id]);
  await admin.query('delete from auth.users where id=$1', [id]);
  await admin.query(
    `insert into auth.users (id, email, raw_user_meta_data) values ($1,$2, jsonb_build_object('full_name',$3::text))`,
    [id, email, name],
  );
}
await admin.query(`update public.profiles set role='admin' where id=$1`, [P]);

const { rows: [team] } = await admin.query(
  `insert into public.teams (name, owner_coach_id, created_by) values ('RBAC Team', $1, $1) returning id`, [O]);
const T = team.id;
await admin.query(
  `insert into public.team_members (team_id, user_id, name, email, role_label, invite_status, created_by)
   values ($1,$2,'Wren Coowner','co@rbac.io','owner','accepted',$3),
          ($1,$4,'Cody Coach','coach@rbac.io','coach','accepted',$3)`, [T, W, O, C]);
const { rows: [pend] } = await admin.query(
  `insert into public.team_members (team_id, name, email, role_label, invite_status, created_by)
   values ($1,'Nia Newbie','newbie@rbac.io','coach','pending',$2) returning id`, [T, N]);

const { rows: [cli] } = await admin.query(
  `insert into public.clients (name, email, user_id, created_by, team_id, lifecycle_status)
   values ('Team Client','tc@rbac.io',$1,$1,$2,'active') returning id`, [O, T]);
await admin.query(
  `insert into public.workout_sessions (client_id, team_id, workout_day_name, status, created_by)
   values ($1,$2,'Leg Day','scheduled',$3)`, [cli.id, T, O]);

// second, unrelated team (cross-tenant target for the platform-admin check)
const { rows: [team2] } = await admin.query(
  `insert into public.teams (name, owner_coach_id, created_by) values ('Other Team', $1, $1) returning id`, [X]);

// ── 1. tier resolution (app.team_role / app.is_team_owner) ───────────────────
await as(O, 'owner@rbac.io');
check('founding owner → team_role=owner',
  (await sess.query('select app.team_role($1) r', [T])).rows[0].r === 'owner');
await as(W, 'co@rbac.io');
check('promoted co-owner (role_label=owner) → team_role=owner',
  (await sess.query('select app.team_role($1) r', [T])).rows[0].r === 'owner');
await as(C, 'coach@rbac.io');
check('coach member → team_role=coach',
  (await sess.query('select app.team_role($1) r', [T])).rows[0].r === 'coach');
await as(X, 'out@rbac.io');
check('outsider → team_role is null',
  (await sess.query('select app.team_role($1) r', [T])).rows[0].r === null);

// ── 2. coach keeps client work ───────────────────────────────────────────────
await as(C, 'coach@rbac.io');
{
  const { rows } = await sess.query('select id, name from public.clients');
  check('coach reads team-scoped clients (client work intact)',
    rows.some((r) => r.id === cli.id));
  const { rowCount } = await sess.query(
    `update public.workout_sessions set status='completed', duration_minutes=45 where client_id=$1`, [cli.id]);
  check('coach updates team-scoped workout sessions', rowCount === 1);
  const { rows: teammates } = await sess.query('select email from public.team_members where team_id=$1', [T]);
  check('coach can SEE teammates (roster visibility)', teammates.length >= 2);
}

// ── 3. coach has NO team management ──────────────────────────────────────────
{
  const ins = await denied(
    `insert into public.team_members (team_id, name, email, role_label, invite_status, created_by)
     values ($1,'Evil Add','evil@rbac.io','coach','pending',$2)`, [T, C]);
  check('coach CANNOT invite members (RLS insert denied)', Boolean(ins), JSON.stringify(ins));

  const del = await denied('delete from public.team_members where email=$1', ['co@rbac.io']);
  check('coach CANNOT remove members (RLS delete denied)', Boolean(del));

  const upTeam = await denied(`update public.teams set name='Hacked' where id=$1`, [T]);
  check('coach CANNOT update team settings', Boolean(upTeam));

  // THE hole this step closes: self-promotion via own-row update
  const promo = await denied(
    `update public.team_members set role_label='owner' where user_id=$1`, [C]);
  check('coach CANNOT self-promote to owner (trigger blocks role_label change)',
    Boolean(promo?.error) && promo.error.includes('only a team owner'), JSON.stringify(promo));

  const move = await denied(
    `update public.team_members set team_id=$1 where user_id=$2`, [team2.id, C]);
  check('coach CANNOT move own membership to another team', Boolean(move?.error), JSON.stringify(move));

  const esc = await denied(`update public.profiles set role='admin' where id=$1`, [C]);
  check('coach CANNOT self-grant platform admin (privileged-columns trigger)',
    Boolean(esc?.error), JSON.stringify(esc));
}

// ── 4. invite acceptance still works ─────────────────────────────────────────
await as(N, 'newbie@rbac.io');
{
  const { rowCount } = await sess.query(
    `update public.team_members set user_id=$1, invite_status='accepted' where id=$2`, [N, pend.id]);
  check('invitee accepts: binds user_id + flips invite_status (email-matched row)', rowCount === 1);
  check('accepted invitee resolves as coach tier',
    (await sess.query('select app.team_role($1) r', [T])).rows[0].r === 'coach');
}

// ── 5. owner + co-owner management rights ────────────────────────────────────
await as(W, 'co@rbac.io');
{
  const { rowCount } = await sess.query(
    `update public.team_members set role_label='owner' where user_id=$1 and team_id=$2`, [C, T]);
  check('co-owner CAN promote a member (role change allowed for owners)', rowCount === 1);
  const { rowCount: back } = await sess.query(
    `update public.team_members set role_label='coach' where user_id=$1 and team_id=$2`, [C, T]);
  check('co-owner CAN demote back', back === 1);
  const { rowCount: renamed } = await sess.query(
    `update public.teams set name='RBAC Team v2' where id=$1`, [T]);
  check('co-owner CAN update team settings', renamed === 1);
  await sess.query(
    `insert into public.team_members (team_id, name, email, role_label, invite_status, created_by)
     values ($1,'Added By Coowner','abc@rbac.io','coach','pending',$2)`, [T, W]);
  check('co-owner CAN invite members', true);
}
await as(O, 'owner@rbac.io');
{
  const { rowCount } = await sess.query(
    `delete from public.team_members where email='abc@rbac.io' and team_id=$1`, [T]);
  check('founding owner CAN remove members', rowCount === 1);
}

// ── 6. platform admin is separate + cross-tenant ─────────────────────────────
await as(P, 'staff@rbac.io');
{
  const { rows } = await sess.query('select id from public.teams');
  check('platform admin (profiles.role=admin) reads teams CROSS-TENANT',
    rows.length === 2, `sees ${rows.length}`);
  check('platform admin is_admin()=true',
    (await sess.query('select app.is_admin() a')).rows[0].a === true);
}
await as(C, 'coach@rbac.io');
check("coach (profiles.role='user') is_admin()=false — team tier ≠ platform tier",
  (await sess.query('select app.is_admin() a')).rows[0].a === false);
await as(X, 'out@rbac.io');
{
  const { rows } = await sess.query('select id from public.teams where id=$1', [T]);
  check('outsider cannot see the team at all', rows.length === 0);
}

// ── 7. billing gate (shared server-side resolver, real module) ───────────────
{
  // minimal service shim over pg for the resolver's two queries
  const svc = {
    from(table) {
      const q = { table, wheres: [], limit: null, cols: '*' };
      const b = {
        select(cols) { q.cols = cols; return b; },
        eq(col, val) { q.wheres.push([col, val]); return b; },
        limit(n) { q.limit = n; return b; },
        then(res, rej) {
          const params = q.wheres.map(([, v]) => v);
          const where = q.wheres.length
            ? ' where ' + q.wheres.map(([c], i) => `${c}=$${i + 1}`).join(' and ') : '';
          return admin.query(
            `select ${q.cols} from public.${q.table}${where}${q.limit ? ` limit ${q.limit}` : ''}`, params,
          ).then((r) => ({ data: r.rows, error: null })).then(res, rej);
        },
      };
      return b;
    },
  };
  check('resolveTeamRole: founding owner → owner', await resolveTeamRole(svc, O) === 'owner');
  check('resolveTeamRole: co-owner → owner', await resolveTeamRole(svc, W) === 'owner');
  check('resolveTeamRole: coach member → coach', await resolveTeamRole(svc, C) === 'coach');
  check('resolveTeamRole: solo coach (no affiliation) → owner', await resolveTeamRole(svc, X) === 'owner');
  const deniedCoach = await billingDeniedFor(svc, C);
  const allowedOwner = await billingDeniedFor(svc, O);
  check('billing gate denies coach-tier member (owner_only 403 body)',
    deniedCoach?.owner_only === true && deniedCoach.team_role === 'coach');
  check('billing gate allows owners/solo coaches', allowedOwner === null);
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
await sess.end();
await admin.end();
process.exit(failures ? 1 : 0);
