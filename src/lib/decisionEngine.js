/**
 * Decision Engine — analyzes client check-in data and returns ranked recommendations.
 *
 * Each recommendation:
 *  { id, priority, category, title, reason, action, actionLabel, actionData }
 *
 * priority: 'critical' | 'high' | 'medium' | 'low'
 * category: 'nutrition' | 'cardio' | 'training' | 'recovery' | 'engagement'
 * action:   'adjust_calories' | 'adjust_cardio' | 'maintain' | 'message' | 'flag'
 */

import { compositeAdherenceScore, checkInScore, averageAdherenceScore } from './adherence';

/* ─── helpers ─── */
function avg(arr) {
  const vals = arr.filter(v => v != null);
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function weightTrend(checkIns, n = 4) {
  const weights = checkIns.slice(0, n).map(ci => ci.weight).filter(w => w != null);
  if (weights.length < 2) return null; // { direction, delta, weeks }
  const oldest = weights[weights.length - 1];
  const newest = weights[0];
  const delta = +(newest - oldest).toFixed(1);
  return {
    direction: delta < -0.5 ? 'down' : delta > 0.5 ? 'up' : 'flat',
    delta,
    weeks: weights.length,
  };
}

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

/* ─── main export ─── */
export function generateRecommendations(checkIn, client, allClientCIs = []) {
  if (!checkIn) return [];
  const recs = [];
  const recent = allClientCIs.slice(0, 4);

  const adherence      = compositeAdherenceScore(allClientCIs);
  const latestScore    = checkInScore(checkIn);
  const avgTraining    = avg(recent.map(ci => ci.compliance_training));
  const avgNutrition   = avg(recent.map(ci => ci.compliance_nutrition));
  const avgSleep       = avg(recent.map(ci => ci.sleep_hours));
  const avgEnergy      = avg(recent.map(ci => ci.energy_level));
  const trend          = weightTrend(allClientCIs);
  const goal           = client?.goal || 'general_fitness';
  const hasNutrition   = !!client?.assigned_nutrition_id;

  /* ── 1. Weight plateau (weight_loss goal, no change for 2+ weeks) ── */
  if (goal === 'weight_loss' && trend) {
    if (trend.direction === 'flat' && trend.weeks >= 2) {
      recs.push({
        id: 'weight-plateau',
        priority: 'high',
        category: 'nutrition',
        title: 'Weight Plateau Detected',
        reason: `Weight has stayed flat for ${trend.weeks} check-ins. A calorie deficit adjustment will help break through.`,
        action: 'adjust_calories',
        actionLabel: 'Cut 150 kcal',
        actionData: { delta: -150 },
      });
    }
    if (trend.direction === 'up' && trend.delta > 1) {
      recs.push({
        id: 'weight-gaining',
        priority: 'critical',
        category: 'nutrition',
        title: `Gained ${trend.delta} lbs',`,
        reason: `Client has gained ${trend.delta} lbs over ${trend.weeks} check-ins despite a weight-loss goal. Deficit too small or nutrition off-track.`,
        action: 'adjust_calories',
        actionLabel: 'Cut 250 kcal',
        actionData: { delta: -250 },
      });
    }
  }

  /* ── 2. Low nutrition compliance → cut calories to make adherence easier ── */
  if (avgNutrition !== null && avgNutrition < 65 && hasNutrition) {
    recs.push({
      id: 'low-nutrition',
      priority: avgNutrition < 50 ? 'high' : 'medium',
      category: 'nutrition',
      title: 'Low Nutrition Compliance',
      reason: `4-week avg nutrition compliance is ${Math.round(avgNutrition)}%. Targets may be too aggressive — a small reduction can improve adherence.`,
      action: 'adjust_calories',
      actionLabel: 'Cut 150 kcal',
      actionData: { delta: -150 },
    });
  }

  /* ── 3. High nutrition compliance + weight loss goal → maintain or slight cut ── */
  if (goal === 'weight_loss' && avgNutrition !== null && avgNutrition >= 90 && trend?.direction === 'flat') {
    recs.push({
      id: 'good-nutrition-plateau',
      priority: 'medium',
      category: 'cardio',
      title: 'Nutrition Great, Add Cardio',
      reason: `Nutrition compliance is excellent (${Math.round(avgNutrition)}%) but weight is flat. Adding cardio will create more of a deficit.`,
      action: 'adjust_cardio',
      actionLabel: 'Increase Cardio',
      actionData: { direction: 'up' },
    });
  }

  /* ── 4. Low training compliance → flag + message ── */
  if (avgTraining !== null && avgTraining < 60) {
    recs.push({
      id: 'low-training',
      priority: avgTraining < 40 ? 'critical' : 'high',
      category: 'training',
      title: 'Missing Workouts',
      reason: `Training compliance is only ${Math.round(avgTraining)}% over the last 4 check-ins. Client needs a check-in to identify blockers.`,
      action: 'message',
      actionLabel: 'Send Check-in Message',
      actionData: {
        content: `Hey! I noticed your training compliance has been around ${Math.round(avgTraining)}% recently. Let's chat — what's been getting in the way of your workouts? I want to make sure we find a plan that works for your schedule.`,
      },
    });
  }

  /* ── 5. Rapid weight loss → increase calories ── */
  if (trend && trend.direction === 'down' && trend.delta < -2 && trend.weeks <= 3) {
    recs.push({
      id: 'rapid-loss',
      priority: 'high',
      category: 'nutrition',
      title: 'Losing Weight Too Fast',
      reason: `Client has lost ${Math.abs(trend.delta)} lbs in ${trend.weeks} weeks — faster than the recommended 0.5–1 lb/week. Increase calories to protect muscle.`,
      action: 'adjust_calories',
      actionLabel: 'Add 150 kcal',
      actionData: { delta: +150 },
    });
  }

  /* ── 6. Muscle gain goal + weight flat/down → increase calories ── */
  if (goal === 'muscle_gain' && trend) {
    if (trend.direction === 'flat' || trend.direction === 'down') {
      recs.push({
        id: 'muscle-no-gain',
        priority: 'medium',
        category: 'nutrition',
        title: 'Not in Caloric Surplus',
        reason: `Weight is ${trend.direction} — client is not in the surplus needed for muscle gain. A small calorie increase will support muscle growth.`,
        action: 'adjust_calories',
        actionLabel: 'Add 200 kcal',
        actionData: { delta: +200 },
      });
    }
  }

  /* ── 7. Poor sleep consistently ── */
  if (avgSleep !== null && avgSleep < 6.5) {
    recs.push({
      id: 'poor-sleep',
      priority: 'medium',
      category: 'recovery',
      title: 'Chronic Sleep Deficit',
      reason: `Average sleep is ${avgSleep.toFixed(1)} hrs — below the 7–9 hr optimal range. Recovery is compromised, consider reducing training intensity.`,
      action: 'message',
      actionLabel: 'Send Sleep Tip',
      actionData: {
        content: `I noticed your sleep has been averaging around ${avgSleep.toFixed(1)} hours — that's going to limit your recovery and results. Let's make sleep a priority this week. Try a consistent bedtime, no screens 30 min before bed, and let me know if stress is a factor.`,
        tag: 'general',
      },
    });
  }

  /* ── 8. Low energy consistently ── */
  if (avgEnergy !== null && avgEnergy < 3) {
    recs.push({
      id: 'low-energy',
      priority: 'medium',
      category: 'recovery',
      title: 'Consistently Low Energy',
      reason: `Average energy level is ${avgEnergy.toFixed(1)}/10. Could indicate over-training, under-eating, or poor recovery.`,
      action: 'adjust_cardio',
      actionLabel: 'Reduce Cardio',
      actionData: { direction: 'down' },
    });
  }

  /* ── 9. Stressed mood ── */
  if (checkIn.mood === 'stressed' && checkIn.stress_level != null && checkIn.stress_level >= 4) {
    recs.push({
      id: 'high-stress',
      priority: 'medium',
      category: 'recovery',
      title: 'High Stress This Week',
      reason: `Client reported stressed mood with stress level ${checkIn.stress_level}/10. Consider reducing training intensity or volume temporarily.`,
      action: 'message',
      actionLabel: 'Send Support Message',
      actionData: {
        content: `I can see this week has been stressful — that's totally normal and I want you to know I've got you. Don't let a tough week derail everything we've built. Let's keep things light this week: focus on your walks, sleep, and just getting your workouts in — quality over intensity.`,
        tag: 'motivation',
      },
    });
  }

  /* ── 10. Everything looks great → maintain ── */
  if (recs.length === 0 && adherence !== null && adherence >= 80) {
    recs.push({
      id: 'maintain',
      priority: 'low',
      category: 'training',
      title: 'On Track — Maintain Plan',
      reason: `Adherence is ${adherence}% and trends look good. No adjustments needed — keep up the excellent work!`,
      action: 'maintain',
      actionLabel: 'Mark Reviewed',
      actionData: null,
    });
  }

  /* ── Sort by priority ── */
  return recs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

export const PRIORITY_STYLES = {
  critical: { bar: 'bg-destructive', badge: 'bg-destructive/15 text-destructive border-destructive/30', dot: 'bg-destructive' },
  high:     { bar: 'bg-amber-500',   badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',   dot: 'bg-amber-500' },
  medium:   { bar: 'bg-primary',     badge: 'bg-primary/15 text-primary border-primary/30',         dot: 'bg-primary' },
  low:      { bar: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
};

export const CATEGORY_ICONS = {
  nutrition: '🔥',
  cardio: '🏃',
  training: '💪',
  recovery: '😴',
  engagement: '💬',
};