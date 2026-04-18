import { differenceInDays, parseISO, isAfter, subDays } from 'date-fns';

/**
 * Calculate composite adherence score (0–100) from a check-in record.
 * Weights: training 40%, nutrition 30%, sleep 30%
 */
export function checkInScore(ci) {
  let score = 0;
  let weight = 0;

  if (ci.compliance_training != null) { score += ci.compliance_training * 0.4; weight += 0.4; }
  if (ci.compliance_nutrition != null) { score += ci.compliance_nutrition * 0.3; weight += 0.3; }
  if (ci.sleep_hours != null) {
    // 7–9h = 100, below 6 = 40, above 9 = 80
    const sleepScore = ci.sleep_hours >= 7 && ci.sleep_hours <= 9 ? 100
      : ci.sleep_hours >= 6 ? 70
      : ci.sleep_hours >= 9.5 ? 80
      : 40;
    score += sleepScore * 0.3;
    weight += 0.3;
  }

  if (weight === 0) return null;
  return Math.round(score / weight);
}

/**
 * Get the latest adherence score for a client from their check-ins.
 */
export function latestAdherenceScore(checkIns) {
  for (const ci of checkIns) {
    const s = checkInScore(ci);
    if (s !== null) return s;
  }
  return null;
}

/**
 * Average score over last N check-ins.
 */
export function averageAdherenceScore(checkIns, n = 4) {
  const recent = checkIns.slice(0, n).map(checkInScore).filter(s => s !== null);
  if (!recent.length) return null;
  return Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
}

/**
 * Score color class based on value.
 */
export function scoreColor(score) {
  if (score === null) return 'text-muted-foreground';
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-destructive';
}

export function scoreBg(score) {
  if (score === null) return 'bg-secondary';
  if (score >= 75) return 'bg-emerald-500/10 border-emerald-500/30';
  if (score >= 50) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-destructive/10 border-destructive/30';
}

export function scoreLabel(score) {
  if (score === null) return 'No Data';
  if (score >= 85) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Fair';
  return 'At Risk';
}

/**
 * Calculate current streak: consecutive days (within 2-day gaps) with check-ins.
 */
export function calculateStreak(checkIns) {
  if (!checkIns.length) return 0;
  const sorted = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = differenceInDays(parseISO(sorted[i].date), parseISO(sorted[i + 1].date));
    if (gap <= 8) streak++; // weekly check-ins count
    else break;
  }
  return streak;
}

/**
 * Detect which badges a client should have earned (not yet persisted).
 */
export function detectEarnedBadges(checkIns) {
  const badges = [];
  const streak = calculateStreak(checkIns);

  if (streak >= 7) badges.push('streak_7');
  if (streak >= 14) badges.push('streak_14');
  if (streak >= 30) badges.push('streak_30');

  // Perfect week: last 4 check-ins all >= 80
  const recentScores = checkIns.slice(0, 4).map(checkInScore).filter(s => s !== null);
  if (recentScores.length >= 4 && recentScores.every(s => s >= 80)) badges.push('perfect_week');

  // Comeback: score was below 50, now above 70
  if (checkIns.length >= 2) {
    const latest = checkInScore(checkIns[0]);
    const prev = checkInScore(checkIns[1]);
    if (prev !== null && latest !== null && prev < 50 && latest >= 70) badges.push('comeback');
  }

  return badges;
}