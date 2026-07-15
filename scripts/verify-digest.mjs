#!/usr/bin/env node
/**
 * Step 5b rehearsal: weeklyDigest now uses the shared risk model.
 *
 * Runs the REAL shared builder (_shared/weeklyDigest.js, which calls
 * getAtRiskClients) against real Postgres rows and asserts the digest carries
 * 0–100 risk scores that match getAtRiskClients directly — proving no local
 * reimplementation remains and the scale changed from 0–10 to 0–100.
 *
 * Usage: POSTGRES_URL=postgresql://postgres@127.0.0.1:55432/digesttest \
 *          node scripts/verify-digest.mjs
 */
import pg from 'pg';
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1184, (v) => v);
pg.types.setTypeParser(1114, (v) => v);
import { buildWeeklyDigest } from '../supabase/functions/_shared/weeklyDigest.js';
import { getAtRiskClients } from '../supabase/functions/_shared/riskScoring.js';

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error('Set POSTGRES_URL'); process.exit(1); }
const NOW = new Date('2026-07-09T12:00:00Z');
const dstr = (n) => new Date(NOW.getTime() - n * 86400_000).toISOString().slice(0, 10);

const db = new pg.Client({ connectionString: POSTGRES_URL });
await db.connect();

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};

const coachId = '00000000-0000-0000-0000-0000000000b9';
await db.query('delete from public.check_ins');
await db.query('delete from public.clients');
await db.query('delete from public.profiles where id=$1', [coachId]);
await db.query('delete from auth.users where id=$1', [coachId]);
await db.query(`insert into auth.users (id, email) values ($1,'coach@dg.io')`, [coachId]);

// churn client: no check-in for 20 days → missed_checkin flag fires (high, 30)
const clients = [
  { key: 'churn', name: 'Churn Chris', status: 'active', goal: 'weight_loss', lastCI: 20 },
  { key: 'lowadh', name: 'Lowadh Lana', status: 'active', goal: 'muscle_gain', cis: [
    { d: 1, t: 40, n: 45, s: 5 }, { d: 8, t: 45, n: 48, s: 6 }, { d: 15, t: 42, n: 47, s: 6 } ] },
  { key: 'healthy', name: 'Healthy Hank', status: 'active', goal: 'general_fitness', cis: [
    { d: 1, t: 95, n: 92, s: 8 } ] },
  { key: 'lead', name: 'Lead Lou', status: 'lead', goal: 'general_fitness', created: 15 },
];
const ids = {};
for (const c of clients) {
  const { rows } = await db.query(
    `insert into public.clients (user_id, created_by, name, email, lifecycle_status, status, goal, monthly_rate, created_at)
     values ($1,$1,$2,$3,$4,$5,$6,$7,$8) returning id`,
    [coachId, c.name, `${c.key}@dg.io`, c.status === 'lead' ? 'lead' : 'active',
     c.status === 'lead' ? 'prospect' : 'active', c.goal, 200,
     new Date(NOW.getTime() - (c.created ?? 60) * 86400_000).toISOString()]);
  ids[c.key] = rows[0].id;
  for (const ci of (c.cis ?? [])) {
    await db.query(`insert into public.check_ins (client_id, created_by, date, compliance_training, compliance_nutrition, sleep_hours) values ($1,$2,$3,$4,$5,$6)`,
      [ids[c.key], coachId, dstr(ci.d), ci.t, ci.n, ci.s]);
  }
  if (c.lastCI) await db.query(`insert into public.check_ins (client_id, created_by, date, compliance_training, compliance_nutrition, sleep_hours) values ($1,$2,$3,80,80,7)`,
    [ids[c.key], coachId, dstr(c.lastCI)]);
}

const clientRows = (await db.query('select * from public.clients')).rows;
const ciRows = (await db.query('select * from public.check_ins')).rows;

const digest = buildWeeklyDigest(clientRows, ciRows, NOW);
const direct = getAtRiskClients(clientRows, ciRows, NOW);

console.log('digest.top_priority:', JSON.stringify(digest.top_priority));
console.log('digest.churn_risks:', JSON.stringify(digest.churn_risks));

check('digest top_priority uses 0-100 risk_score (not 0-10)', digest.top_priority.every((p) => p.risk_score >= 0 && p.risk_score <= 100) && digest.top_priority.some((p) => p.risk_score > 10));
check('top_priority scores match getAtRiskClients directly (no reimplementation)',
  JSON.stringify(digest.top_priority.map((p) => p.risk_score)) === JSON.stringify(direct.slice(0, 3).map((r) => r.riskScore)),
  digest.top_priority.map((p) => p.risk_score).join(','));
check('churn_risks derives from the missed_checkin flag (Churn Chris present)',
  digest.churn_risks.includes('Churn Chris'));
check('lead excluded from risk sections (leads are not active)', !digest.top_priority.some((p) => p.name === 'Lead Lou'));
check('lead surfaces under leads_to_convert instead', digest.leads_to_convert.includes('Lead Lou'));
check('healthy client not flagged as top priority', !digest.top_priority.some((p) => p.name === 'Healthy Hank'));
check('no "/10" language: digest exposes risk_score field, not priorityScore', 'risk_score' in (digest.top_priority[0] ?? { risk_score: 0 }) && !('priorityScore' in (digest.top_priority[0] ?? {})));

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
await db.end();
process.exit(failures ? 1 : 0);
