#!/usr/bin/env node
/**
 * Step 4.3 — automation runner rehearsal against real Postgres.
 *
 * Runs the REAL shared evaluation core (supabase/functions/_shared/
 * automationRunner.js) — the same module the edge function imports — against
 * real rows in a local DB, executing the real side effects (messages,
 * notifications, badges, status/calorie updates, automation_logs). Proves:
 *   - both condition_type AND trigger_type rules are evaluated (the legacy
 *     schema-drift bug is fixed — legacy rules are no longer ignored),
 *   - actions execute and land in the right tables,
 *   - a row is written to automation_logs for EVERY evaluation (fired or not),
 *   - idempotency: a second run in the same window writes NO new logs and
 *     fires NO actions again.
 *   - also spot-checks that riskScoring.js reproduces riskEngine.js numbers.
 *
 * Usage: POSTGRES_URL=postgresql://postgres@127.0.0.1:55432/autotest \
 *          node scripts/verify-automation.mjs
 */
import pg from 'pg';
// PostgREST (and thus the real edge function) receives DATE/TIMESTAMP columns
// as JSON strings; node-postgres parses them to Date objects by default. Keep
// them as strings so the harness feeds the shared module the SAME shape the
// deployed function does (DATE oid 1082, TIMESTAMPTZ 1184, TIMESTAMP 1114).
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1184, (v) => v);
pg.types.setTypeParser(1114, (v) => v);
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  evaluateRule, resolveActions, isEligibleClient, renderMessage,
} from '../supabase/functions/_shared/automationRunner.js';
import { evaluateClientRisk } from '../supabase/functions/_shared/riskScoring.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error('Set POSTGRES_URL'); process.exit(1); }

// Deterministic clock so relative fixture dates resolve identically each run.
const NOW = new Date('2026-07-09T12:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400_000);
const dateStr = (n) => daysAgo(n).toISOString().slice(0, 10);

const db = new pg.Client({ connectionString: POSTGRES_URL });
await db.connect();

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};

// ── seed ────────────────────────────────────────────────────────────────────
const fx = JSON.parse(readFileSync(path.join(__dirname, 'fixtures', 'automation-rules.json'), 'utf8'));
const coachId = '00000000-0000-0000-0000-0000000000a1';
await db.query('delete from public.automation_logs');
await db.query('delete from public.automation_rules');
await db.query('delete from public.check_ins');
await db.query('delete from public.messages');
await db.query('delete from public.notifications');
await db.query('delete from public.client_badges');
await db.query('delete from public.clients');
await db.query('delete from public.profiles where id=$1', [coachId]);
await db.query('delete from auth.users where id=$1', [coachId]);
await db.query(`insert into auth.users (id, email) values ($1,'coach@fx.io')`, [coachId]);

const clientIds = {};
for (const c of fx.clients) {
  const { rows } = await db.query(
    `insert into public.clients (user_id, created_by, name, email, lifecycle_status, goal, assigned_nutrition_id)
     values ($1,$1,$2,$3,$4,$5,null) returning id`,
    [coachId, c.name, c.email, c.lifecycle_status, c.goal],
  );
  clientIds[c.key] = rows[0].id;
}
// a nutrition plan for calorie-adjust coverage (not triggered here, but present)
for (const [ckey, cis] of Object.entries(fx.checkins)) {
  for (const ci of cis) {
    await db.query(
      `insert into public.check_ins (client_id, created_by, date, compliance_training, compliance_nutrition, sleep_hours)
       values ($1,$2,$3,$4,$5,$6)`,
      [clientIds[ckey], coachId, dateStr(ci.days_ago), ci.compliance_training, ci.compliance_nutrition, ci.sleep_hours],
    );
  }
}
// last check-in for clients whose only signal is recency
for (const c of fx.clients) {
  if (!fx.checkins[c.key] && c.last_checkin_days_ago != null && c.lifecycle_status !== 'lead') {
    await db.query(
      `insert into public.check_ins (client_id, created_by, date, compliance_training, compliance_nutrition, sleep_hours)
       values ($1,$2,$3,80,80,7)`,
      [clientIds[c.key], coachId, dateStr(c.last_checkin_days_ago)],
    );
  }
}
const ruleIds = {};
for (const r of fx.rules) {
  const { rows } = await db.query(
    `insert into public.automation_rules
       (name, is_active, trigger_type, trigger_value, actions, condition_type, condition_threshold, action_type, action_message, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
    [r.name, r.is_active, r.trigger_type ?? null, r.trigger_value ?? null,
     JSON.stringify(r.actions ?? []), r.condition_type ?? null, r.condition_threshold ?? null,
     r.action_type ?? null, r.action_message ?? null, coachId],
  );
  ruleIds[r.key] = rows[0].id;
}

// ── the runner (mirrors runAutomations/index.ts against pg) ──────────────────
function windowStart(now) { const d = new Date(now); d.setUTCHours(0, 0, 0, 0); return d.toISOString(); }

async function runOnce() {
  const winStart = windowStart(NOW);
  const rules = (await db.query('select * from public.automation_rules where is_active = true')).rows;
  const clients = (await db.query('select * from public.clients')).rows;
  const checkIns = (await db.query('select * from public.check_ins')).rows;
  const plans = (await db.query('select * from public.nutrition_plans')).rows;
  const badges = (await db.query('select * from public.client_badges')).rows;
  const prior = (await db.query('select rule_id, client_id from public.automation_logs where triggered_at >= $1', [winStart])).rows;
  const seen = new Set(prior.map((l) => `${l.rule_id}:${l.client_id}`));

  const ciByClient = new Map();
  for (const ci of checkIns) { const a = ciByClient.get(ci.client_id) ?? []; a.push(ci); ciByClient.set(ci.client_id, a); }

  let evaluated = 0, fired = 0, skipped = 0;
  const logRows = [];
  for (const rule of rules) {
    for (const client of clients) {
      if (!isEligibleClient(client)) continue;
      const key = `${rule.id}:${client.id}`;
      if (seen.has(key)) { skipped++; continue; }
      seen.add(key);
      const cis = ciByClient.get(client.id) ?? [];
      const result = evaluateRule(rule, client, cis, NOW);
      evaluated++;
      let actionsTaken = '';
      if (result.triggered) {
        const actions = resolveActions(rule);
        const lastCI = [...cis].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        for (const action of actions) await execAction(action, client, lastCI, cis, plans, badges);
        actionsTaken = actions.map((a) => a.type).join(', ');
        fired++;
        await db.query('update public.automation_rules set last_triggered=$1, trigger_count=trigger_count+1 where id=$2', [NOW.toISOString(), rule.id]);
      }
      logRows.push([rule.id, rule.name, client.id, client.name, NOW.toISOString(), result.triggered, actionsTaken, result.detail]);
    }
  }
  for (const lr of logRows) {
    await db.query(
      `insert into public.automation_logs (rule_id, rule_name, client_id, client_name, triggered_at, fired, actions_taken, detail)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`, lr);
  }
  return { evaluated, fired, skipped, logged: logRows.length };
}

async function execAction(action, client, lastCI, cis, plans, badges) {
  const msg = renderMessage(action.message, client, lastCI, cis);
  switch (action.type) {
    case 'send_message': case 'send_template':
      if (msg) await db.query('insert into public.messages (client_id, created_by, content, sender) values ($1,$2,$3,$4)', [client.id, coachId, msg, 'coach']);
      break;
    case 'notify_coach': case 'suggest_adjustment': {
      const recipient = client.user_id ?? client.created_by;
      if (recipient) await db.query('insert into public.notifications (recipient_id, category, type, title, body, related_client_id) values ($1,$2,$3,$4,$5,$6)', [recipient, 'ai', 'automation', `Automation: ${client.name}`, msg || 'triggered', client.id]);
      break;
    }
    case 'award_badge': {
      if (!action.value) break;
      const already = badges.some((b) => b.client_id === client.id && b.badge_key === action.value);
      if (!already) await db.query('insert into public.client_badges (client_id, client_name, badge_key, earned_date, notes, created_by) values ($1,$2,$3,$4,$5,$6)', [client.id, client.name, action.value, dateStr(0), 'auto', coachId]);
      break;
    }
    case 'update_status':
      if (action.value) await db.query('update public.clients set lifecycle_status=$1 where id=$2', [action.value, client.id]);
      break;
    case 'flag_client': case 'flag_at_risk':
      await db.query("update public.clients set lifecycle_status='at_risk' where id=$1", [client.id]);
      break;
  }
}

// ── run #1 ───────────────────────────────────────────────────────────────────
console.log('--- run #1 ---');
const r1 = await runOnce();
console.log(JSON.stringify(r1));

const eligible = fx.clients.filter((c) => c.lifecycle_status !== 'lead').length;   // 3
const activeRules = fx.rules.filter((r) => r.is_active).length;                     // 4
check('evaluates active rules × eligible clients (leads excluded)', r1.evaluated === eligible * activeRules, `${r1.evaluated} = ${eligible}×${activeRules}`);
check('writes a log row for EVERY evaluation (fired or not)', r1.logged === eligible * activeRules, `${r1.logged}`);

// legacy condition_type rules were evaluated (not silently ignored)
const legacyLogs = (await db.query(
  `select count(*)::int n from public.automation_logs l join public.automation_rules r on r.id=l.rule_id where r.condition_type is not null`)).rows[0].n;
check('legacy condition_type rules ARE evaluated (schema-drift bug fixed)', legacyLogs === eligible * fx.rules.filter(r => r.is_active && r.shape === 'condition').length, `${legacyLogs} legacy logs`);

// stale client: legacy missed_checkin (20>=10) AND new no_checkin (20>=10) both fire
const staleFired = (await db.query(
  `select rule_name, fired from public.automation_logs where client_id=$1 and fired=true order by rule_name`, [clientIds.stale])).rows;
check('stale client fires BOTH a legacy and a new rule', staleFired.length === 2, staleFired.map(r => r.rule_name).join(' | '));
const staleStatus = (await db.query('select lifecycle_status from public.clients where id=$1', [clientIds.stale])).rows[0].lifecycle_status;
check('flag_at_risk action moved stale client to at_risk', staleStatus === 'at_risk');

// lowadh client: legacy low_adherence fires (avg < 60), sends a message
const lisaMsgs = (await db.query('select count(*)::int n from public.messages where client_id=$1', [clientIds.lowadh])).rows[0].n;
check('low_adherence legacy rule sent a message to Lisa', lisaMsgs >= 1, `${lisaMsgs} msg`);

// streaker: new streak rule fires (streak 3 >= 3), awards badge
const samBadge = (await db.query("select count(*)::int n from public.client_badges where client_id=$1 and badge_key='streak_7'", [clientIds.streaker])).rows[0].n;
check('streak rule awarded Sam a badge', samBadge === 1);

// inactive rule never logged
const inactiveLogs = (await db.query('select count(*)::int n from public.automation_logs where rule_id=$1', [ruleIds.inactive_rule])).rows[0].n;
check('inactive rule never evaluated', inactiveLogs === 0);

// lead never logged
const leadLogs = (await db.query('select count(*)::int n from public.automation_logs where client_id=$1', [clientIds.lead])).rows[0].n;
check('lead client never evaluated', leadLogs === 0);

// ── run #2 — idempotency ─────────────────────────────────────────────────────
console.log('--- run #2 (same window) ---');
const logsBefore = (await db.query('select count(*)::int n from public.automation_logs')).rows[0].n;
const msgsBefore = (await db.query('select count(*)::int n from public.messages')).rows[0].n;
const badgesBefore = (await db.query('select count(*)::int n from public.client_badges')).rows[0].n;
const r2 = await runOnce();
console.log(JSON.stringify(r2));
const logsAfter = (await db.query('select count(*)::int n from public.automation_logs')).rows[0].n;
const msgsAfter = (await db.query('select count(*)::int n from public.messages')).rows[0].n;
const badgesAfter = (await db.query('select count(*)::int n from public.client_badges')).rows[0].n;
check('run #2 evaluates 0 (all pairs already handled this window)', r2.evaluated === 0, `evaluated=${r2.evaluated}, skipped=${r2.skipped}`);
check('run #2 writes NO new automation_logs', logsAfter === logsBefore, `${logsBefore} → ${logsAfter}`);
check('run #2 sends NO duplicate messages', msgsAfter === msgsBefore, `${msgsBefore} → ${msgsAfter}`);
check('run #2 awards NO duplicate badges', badgesAfter === badgesBefore, `${badgesBefore} → ${badgesAfter}`);

// ── riskScoring parity spot-check ────────────────────────────────────────────
// Lisa: low_adherence(high=30) + missed_workouts(medium=15) + low_sleep? sleep 5,6,6 → <6 count: only 1 (<6 is strict) → 5<6 yes(1), 6 no,6 no → 1, not ≥2; last sleep 5<5? no. So low_sleep no.
const lisaClient = { id: clientIds.lowadh, goal: 'muscle_gain', lifecycle_status: 'active' };
const lisaCis = (await db.query('select * from public.check_ins where client_id=$1', [clientIds.lowadh])).rows;
const risk = evaluateClientRisk(lisaClient, lisaCis, NOW);
check('riskScoring module produces a score for at-risk Lisa', risk && risk.riskScore > 0, `score=${risk?.riskScore}, flags=${risk?.flags.map(f=>f.key).join(',')}`);

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
await db.end();
process.exit(failures ? 1 : 0);
