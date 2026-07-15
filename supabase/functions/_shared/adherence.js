/**
 * Faithful server-side port of src/lib/adherence.js (Migration Step 4.1).
 *
 * ONLY the scoring primitives are ported (the numbers), not the UI helpers
 * (scoreColor/scoreBg/scoreLabel/etc). Kept byte-for-byte identical in logic
 * to the client version so the server produces exactly the number coaches see
 * in the Adherence / At-Risk UI. Portable: pass `now` in for determinism; the
 * only date math is day differences.
 *
 * date-fns is imported via a bare specifier so the SAME file works in Deno
 * (`npm:date-fns`) and Node (node_modules) — see importmap note in
 * AUTOMATION_MIGRATION.md.
 */
import { differenceInDays, parseISO, subWeeks } from 'date-fns';

/** Sleep score: 7–9h = 100, 6–7h = 70, >9h = 80, <6h = 40  (verbatim) */
function sleepScore(hours) {
  if (hours == null) return null;
  if (hours >= 7 && hours <= 9) return 100;
  if (hours >= 6) return 70;
  if (hours > 9) return 80;
  return 40;
}

/** Check-in completion rate over the last N weeks. Expects newest-first. */
function checkInCompletionScore(checkIns, weeksBack = 4, now = new Date()) {
  if (!checkIns.length) return 0;
  const cutoff = subWeeks(now, weeksBack);
  const recent = checkIns.filter((ci) => ci.date && parseISO(ci.date) >= cutoff);
  const expectedCount = weeksBack;
  return Math.min(100, Math.round((recent.length / expectedCount) * 100));
}

/** Composite adherence from a single check-in (training 35 / nutrition 30 / sleep 20). */
export function checkInScore(ci) {
  let score = 0;
  let weight = 0;
  if (ci.compliance_training != null) { score += ci.compliance_training * 0.35; weight += 0.35; }
  if (ci.compliance_nutrition != null) { score += ci.compliance_nutrition * 0.30; weight += 0.30; }
  const sl = sleepScore(ci.sleep_hours);
  if (sl !== null) { score += sl * 0.20; weight += 0.20; }
  if (weight === 0) return null;
  return Math.round(score / weight);
}

/** Average of single-check-in scores over the last N. */
export function averageAdherenceScore(checkIns, n = 4) {
  const recent = checkIns.slice(0, n).map(checkInScore).filter((s) => s !== null);
  if (!recent.length) return null;
  return Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
}

/** Full 4-component composite (adds check-in completion 15%). */
export function compositeAdherenceScore(checkIns, now = new Date()) {
  if (!checkIns.length) return null;
  const recent = checkIns.slice(0, 4);
  const trainingVals = recent.map((ci) => ci.compliance_training).filter((v) => v != null);
  const trainingAvg = trainingVals.length ? trainingVals.reduce((a, b) => a + b, 0) / trainingVals.length : null;
  const nutritionVals = recent.map((ci) => ci.compliance_nutrition).filter((v) => v != null);
  const nutritionAvg = nutritionVals.length ? nutritionVals.reduce((a, b) => a + b, 0) / nutritionVals.length : null;
  const sleepVals = recent.map((ci) => sleepScore(ci.sleep_hours)).filter((v) => v != null);
  const sleepAvg = sleepVals.length ? sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length : null;
  const ciCompletion = checkInCompletionScore(checkIns, 4, now);
  let score = 0;
  let weight = 0;
  if (trainingAvg != null) { score += trainingAvg * 0.35; weight += 0.35; }
  if (nutritionAvg != null) { score += nutritionAvg * 0.30; weight += 0.30; }
  if (sleepAvg != null) { score += sleepAvg * 0.20; weight += 0.20; }
  score += ciCompletion * 0.15; weight += 0.15;
  if (weight === 0) return null;
  return Math.round(score / weight);
}

/** Consecutive weekly check-in streak (gap ≤ 8 days). */
export function calculateStreak(checkIns) {
  if (!checkIns.length) return 0;
  const sorted = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = differenceInDays(parseISO(sorted[i].date), parseISO(sorted[i + 1].date));
    if (gap <= 8) streak++;
    else break;
  }
  return streak;
}
