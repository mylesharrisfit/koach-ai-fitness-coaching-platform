/**
 * deviationThresholds — the tunable gate for client-driven plan adaptation
 * (closed loop, client side). Mirrors the shape of _shared/riskScoring.js: a
 * const rule table + a pure, DB-free, injectable evaluator, so thresholds can
 * be tuned/tested independently and reused as more trigger types are added.
 *
 * The adaptationEvaluator edge function loads a client's assigned plans and
 * recent logs, calls evaluateDeviations(), and — only when a rule fires — asks
 * Claude for a structured plan diff and routes it through planMutationService.
 * Nothing here writes to the DB.
 *
 * Thresholds are overridable per-coach via coach_defaults.adaptation_thresholds
 * (jsonb) — pass that object as `overrides`.
 */

export const DEFAULT_THRESHOLDS = {
  meal_swaps_7d: 3,            // client-logged meal changes in 7 days
  workout_volume_delta_pct: 15, // % change in training volume vs the prior window
  min_sessions_for_volume: 4,   // need this many completed sessions to judge volume
};

const DAY_MS = 86_400_000;

/** Count client-logged food entries within the last `days`. */
function mealSwapCount(foodLogs, now, days) {
  const cutoff = now.getTime() - days * DAY_MS;
  return (foodLogs ?? []).filter((f) => {
    if (f.logged_by !== 'client') return false;
    const d = f.logged_date ? new Date(f.logged_date).getTime() : NaN;
    return !Number.isNaN(d) && d >= cutoff;
  }).length;
}

/** Training volume for one session = Σ weight × reps over completed sets. */
function sessionVolume(session) {
  const logs = Array.isArray(session?.exercise_logs) ? session.exercise_logs : [];
  let vol = 0;
  for (const ex of logs) {
    for (const set of ex?.sets_completed ?? []) {
      if (set?.completed === false) continue;
      vol += (Number(set?.weight) || 0) * (Number(set?.reps) || 0);
    }
  }
  return vol;
}

/**
 * Percent change in volume between the most-recent half of completed sessions
 * and the prior half. Returns { delta, recentAvg, olderAvg, n } or null when
 * there isn't enough data.
 */
function volumeDelta(sessions, minSessions) {
  const completed = (sessions ?? [])
    .filter((s) => s.status === 'completed')
    .sort((a, b) => new Date(b.completed_at || b.scheduled_date || 0) - new Date(a.completed_at || a.scheduled_date || 0));
  if (completed.length < minSessions) return null;
  const half = Math.floor(completed.length / 2);
  const recent = completed.slice(0, half);
  const older = completed.slice(half);
  const avg = (arr) => arr.reduce((s, x) => s + sessionVolume(x), 0) / arr.length;
  const recentAvg = avg(recent);
  const olderAvg = avg(older);
  if (olderAvg <= 0) return null;
  return { delta: ((recentAvg - olderAvg) / olderAvg) * 100, recentAvg, olderAvg, n: completed.length };
}

const RULES = [
  {
    trigger_type: 'client_meal_swap_threshold',
    plan_kind: 'nutrition',
    detect: ({ foodLogs, now, t }) => {
      const count = mealSwapCount(foodLogs, now, 7);
      if (count >= t.meal_swaps_7d) {
        return { triggered: true, detail: `${count} client-logged meal changes in the last 7 days (threshold ${t.meal_swaps_7d})` };
      }
      return { triggered: false };
    },
  },
  {
    trigger_type: 'client_workout_volume_delta',
    plan_kind: 'workout',
    detect: ({ sessions, t }) => {
      const v = volumeDelta(sessions, t.min_sessions_for_volume);
      if (v && Math.abs(v.delta) > t.workout_volume_delta_pct) {
        const dir = v.delta > 0 ? 'up' : 'down';
        return { triggered: true, detail: `Training volume ${dir} ${Math.abs(v.delta).toFixed(0)}% vs prior window (threshold ${t.workout_volume_delta_pct}%)` };
      }
      return { triggered: false };
    },
  },
];

/**
 * Evaluate every deviation rule for one client. Returns an array of triggered
 * deviations: [{ trigger_type, plan_kind, detail }]. Empty when nothing fires.
 *
 * ctx: { client, foodLogs, sessions }
 * overrides: coach_defaults.adaptation_thresholds (partial; merged over defaults)
 */
export function evaluateDeviations(ctx, overrides = null, now = new Date()) {
  const t = { ...DEFAULT_THRESHOLDS, ...(overrides && typeof overrides === 'object' ? overrides : {}) };
  const out = [];
  for (const rule of RULES) {
    const r = rule.detect({ ...ctx, t, now });
    if (r.triggered) out.push({ trigger_type: rule.trigger_type, plan_kind: rule.plan_kind, detail: r.detail });
  }
  return out;
}
