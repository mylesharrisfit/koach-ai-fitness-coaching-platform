/**
 * Shared automation evaluation core (Migration Step 4.2).
 *
 * Faithful merge of the TWO browser engines that currently disagree:
 *   - src/lib/automationEngine.js  → legacy `condition_type` rules
 *     (missed_checkin, missed_workouts, low_adherence, weight_plateau,
 *      low_nutrition, mood_low, no_progress, declining_trend)
 *   - the inline engine in src/pages/Automations.jsx → newer `trigger_type`
 *     rules (no_checkin, low_compliance, high_compliance, streak,
 *      weight_plateau, weight_loss_fast, new_client)
 *
 * The live browser engine (Automations.jsx) filters `r.is_active && r.trigger_type`,
 * so legacy condition_type rules were SILENTLY IGNORED — the schema-drift bug
 * from the audit. This runner handles BOTH shapes: a rule is dispatched by
 * whichever discriminator it carries (trigger_type wins if both are present,
 * matching the browser's action-normalization precedence). Rule *semantics*
 * are ported verbatim from each source; nothing is reinterpreted.
 *
 * Pure module: it decides WHAT should happen (triggered? which actions?). The
 * caller (edge function / harness) performs the DB side effects, so the same
 * code is testable without a DB.
 */
import { differenceInDays, parseISO } from 'date-fns';
import { checkInScore, averageAdherenceScore, calculateStreak } from './adherence.js';

// ── legacy condition_type defaults (from automationEngine.CONDITION_META) ────
const CONDITION_DEFAULT_THRESHOLD = {
  missed_checkin: 10, missed_workouts: 60, low_adherence: 60, weight_plateau: 3,
  low_nutrition: 60, mood_low: 2, no_progress: 4, declining_trend: 3,
};

/** Which schema shape is this rule? trigger_type takes precedence. */
export function ruleShape(rule) {
  if (rule.trigger_type) return 'trigger';
  if (rule.condition_type) return 'condition';
  return 'unknown';
}

/** Verbatim port of automationEngine.evaluateCondition (legacy condition_type). */
function evaluateConditionRule(rule, client, sorted, now) {
  const latest = sorted[0];
  const threshold = rule.condition_threshold ?? CONDITION_DEFAULT_THRESHOLD[rule.condition_type];

  switch (rule.condition_type) {
    case 'missed_checkin': {
      if (!latest) return { triggered: true, detail: 'No check-ins on record' };
      const days = differenceInDays(now, parseISO(latest.date));
      return { triggered: days >= threshold, detail: `${days} days since last check-in (threshold: ${threshold})` };
    }
    case 'missed_workouts': {
      const recent = sorted.slice(0, 3);
      if (!recent.length) return { triggered: false, detail: 'No data' };
      const avg = recent.reduce((s, ci) => s + (ci.compliance_training ?? 100), 0) / recent.length;
      return { triggered: avg < threshold, detail: `Avg training compliance: ${Math.round(avg)}% (threshold: ${threshold}%)` };
    }
    case 'low_adherence': {
      const avg = averageAdherenceScore(sorted, 3);
      if (avg === null) return { triggered: false, detail: 'No data' };
      return { triggered: avg < threshold, detail: `Avg adherence: ${avg}% (threshold: ${threshold}%)` };
    }
    case 'weight_plateau': {
      const withWeight = sorted.filter((ci) => ci.weight != null).slice(0, threshold + 1);
      if (withWeight.length < threshold) return { triggered: false, detail: 'Not enough weight data' };
      const range = Math.max(...withWeight.map((ci) => ci.weight)) - Math.min(...withWeight.map((ci) => ci.weight));
      return { triggered: range < 1, detail: `Weight range over last ${threshold} check-ins: ${range.toFixed(1)} lbs` };
    }
    case 'low_nutrition': {
      const recent = sorted.slice(0, 3);
      if (!recent.length) return { triggered: false, detail: 'No data' };
      const avg = recent.reduce((s, ci) => s + (ci.compliance_nutrition ?? 100), 0) / recent.length;
      return { triggered: avg < threshold, detail: `Avg nutrition compliance: ${Math.round(avg)}% (threshold: ${threshold}%)` };
    }
    case 'mood_low': {
      const lowMoodCount = sorted.slice(0, threshold).filter((ci) => ci.mood === 'stressed' || ci.mood === 'tired').length;
      return { triggered: lowMoodCount >= threshold, detail: `${lowMoodCount} consecutive low-mood check-ins` };
    }
    case 'no_progress': {
      if (client.goal !== 'weight_loss') return { triggered: false, detail: 'Not a weight-loss client' };
      const withWeight = sorted.filter((ci) => ci.weight != null).slice(0, threshold);
      if (withWeight.length < threshold) return { triggered: false, detail: 'Not enough data' };
      const range = Math.max(...withWeight.map((ci) => ci.weight)) - Math.min(...withWeight.map((ci) => ci.weight));
      return { triggered: range < 1, detail: `Weight stalled: ${range.toFixed(1)} lbs change` };
    }
    case 'declining_trend': {
      const scores = sorted.slice(0, threshold + 1).map(checkInScore).filter((s) => s !== null);
      if (scores.length < threshold) return { triggered: false, detail: 'Not enough data' };
      let declining = 0;
      for (let i = 0; i < scores.length - 1; i++) if (scores[i] < scores[i + 1]) declining++;
      return { triggered: declining >= threshold - 1, detail: `${declining + 1} consecutive declining scores` };
    }
    default:
      return { triggered: false, detail: `Unknown condition_type: ${rule.condition_type}` };
  }
}

/** Verbatim port of the Automations.jsx inline engine (new trigger_type). */
function evaluateTriggerRule(rule, client, sorted, now) {
  const lastCI = sorted[0];
  const tv = Number(rule.trigger_value) || 0;
  switch (rule.trigger_type) {
    case 'no_checkin': {
      const daysSince = lastCI ? differenceInDays(now, parseISO(lastCI.date)) : 999;
      return { triggered: daysSince >= tv, detail: `${daysSince} days since last check-in (threshold: ${tv})` };
    }
    case 'low_compliance': {
      const score = averageAdherenceScore(sorted.slice(0, 3));
      return { triggered: score !== null && score < tv, detail: `Avg adherence: ${score ?? 'n/a'} (threshold: <${tv})` };
    }
    case 'high_compliance': {
      const score = averageAdherenceScore(sorted.slice(0, 3));
      return { triggered: score !== null && score >= tv, detail: `Avg adherence: ${score ?? 'n/a'} (threshold: ≥${tv})` };
    }
    case 'streak': {
      const s = calculateStreak(sorted);
      return { triggered: s >= tv, detail: `Streak: ${s} (threshold: ≥${tv})` };
    }
    case 'weight_plateau': {
      const withW = sorted.filter((ci) => ci.weight != null).slice(0, tv + 1);
      if (withW.length >= tv) {
        const range = Math.max(...withW.map((c) => c.weight)) - Math.min(...withW.map((c) => c.weight));
        return { triggered: range < 1, detail: `Weight range over ${tv} check-ins: ${range.toFixed(1)} lbs` };
      }
      return { triggered: false, detail: 'Not enough weight data' };
    }
    case 'weight_loss_fast': {
      if (sorted.length >= 2 && sorted[0].weight && sorted[1].weight) {
        const drop = sorted[1].weight - sorted[0].weight;
        return { triggered: drop > tv, detail: `Lost ${drop.toFixed(1)} lbs since prior check-in (threshold: >${tv})` };
      }
      return { triggered: false, detail: 'Not enough weight data' };
    }
    case 'new_client': {
      const triggered = client.lifecycle_status === 'active' &&
        differenceInDays(now, parseISO(client.created_date || now.toISOString())) <= 1;
      return { triggered, detail: triggered ? 'New active client' : 'Not a new client' };
    }
    default:
      return { triggered: false, detail: `Unknown trigger_type: ${rule.trigger_type}` };
  }
}

/** Evaluate one rule against one client. Dispatches by shape. */
export function evaluateRule(rule, client, clientCheckIns, now = new Date()) {
  const sorted = [...clientCheckIns].sort((a, b) => new Date(b.date) - new Date(a.date));
  const shape = ruleShape(rule);
  if (shape === 'trigger') return { shape, ...evaluateTriggerRule(rule, client, sorted, now) };
  if (shape === 'condition') return { shape, ...evaluateConditionRule(rule, client, sorted, now) };
  return { shape, triggered: false, detail: 'Rule has neither trigger_type nor condition_type' };
}

/**
 * Normalize a rule's actions across both shapes into a single list.
 * New rules carry actions:[{type,value,message}]; legacy carry the flat
 * action_type/action_message/action_calorie_delta (verbatim from the browser
 * engine's fallback at Automations.jsx:157). Action-type synonyms across the
 * two engines (flag_client≡flag_at_risk, update_status) are unified downstream.
 */
export function resolveActions(rule) {
  if (Array.isArray(rule.actions) && rule.actions.length) return rule.actions;
  if (rule.action_type) {
    return [{
      type: rule.action_type,
      message: rule.action_message,
      value: rule.action_calorie_delta != null ? String(rule.action_calorie_delta) : undefined,
    }];
  }
  return [];
}

/** Is this client eligible for automation? (leads are skipped, as in both engines.) */
export function isEligibleClient(client) {
  return client.lifecycle_status !== 'lead';
}

/** {client_name}/{streak}/{compliance}/{weight} interpolation (from Automations.jsx). */
export function renderMessage(template, client, lastCheckIn, clientCheckIns) {
  return (template || '')
    .replace(/\{client_name\}/g, client.name ?? '')
    .replace(/\{streak\}/g, String(calculateStreak(clientCheckIns)))
    .replace(/\{compliance\}/g, String(lastCheckIn?.compliance_training ?? 0))
    .replace(/\{weight\}/g, String(lastCheckIn?.weight ?? client.current_weight ?? '?'));
}
