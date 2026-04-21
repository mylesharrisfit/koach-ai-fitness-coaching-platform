/**
 * Decision Engine — analyzes client check-in data and returns ranked coaching recommendations.
 *
 * Each recommendation:
 *  { id, priority, category, title, reason, action, actionLabel, actionData }
 *
 * priority: 'critical' | 'high' | 'medium' | 'low'
 * category: 'nutrition' | 'cardio' | 'training' | 'recovery' | 'engagement'
 * action:   'adjust_calories' | 'adjust_cardio' | 'maintain' | 'message'
 */

import { compositeAdherenceScore, checkInScore } from './adherence';
import { differenceInDays, parseISO } from 'date-fns';

/* ─── helpers ─── */
function avg(arr) {
  const vals = arr.filter(v => v != null);
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function weightTrend(checkIns, n = 4) {
  const weights = checkIns.slice(0, n).map(ci => ci.weight).filter(w => w != null);
  if (weights.length < 2) return null;
  const oldest = weights[weights.length - 1];
  const newest = weights[0];
  const delta = +(newest - oldest).toFixed(1);
  const weeks = weights.length;
  return {
    direction: delta < -0.5 ? 'down' : delta > 0.5 ? 'up' : 'flat',
    delta,
    weeks,
    lbsPerWeek: weeks > 1 ? +(delta / (weeks - 1)).toFixed(2) : 0,
  };
}

function stressAvg(checkIns, n = 3) {
  return avg(checkIns.slice(0, n).map(ci => ci.stress_level));
}

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

/* ─── main export ─── */
export function generateRecommendations(checkIn, client, allClientCIs = []) {
  if (!checkIn) return [];
  const recs = [];
  const recent = allClientCIs.slice(0, 4);

  const adherence    = compositeAdherenceScore(allClientCIs);
  const avgTraining  = avg(recent.map(ci => ci.compliance_training));
  const avgNutrition = avg(recent.map(ci => ci.compliance_nutrition));
  const avgSleep     = avg(recent.map(ci => ci.sleep_hours));
  const avgEnergy    = avg(recent.map(ci => ci.energy_level));
  const avgStress    = stressAvg(allClientCIs);
  const trend        = weightTrend(allClientCIs);
  const goal         = client?.goal || 'general_fitness';
  const hasNutrition = !!client?.assigned_nutrition_id;

  // Days since last check-in
  const daysSinceCI = checkIn.date ? differenceInDays(new Date(), parseISO(checkIn.date)) : null;

  /* ── 1. Missed check-in / no engagement ── */
  if (daysSinceCI !== null && daysSinceCI > 10 && !checkIn.coach_responded) {
    recs.push({
      id: 'missed-checkin',
      priority: daysSinceCI > 14 ? 'critical' : 'high',
      category: 'engagement',
      title: `No Response in ${daysSinceCI}d`,
      reason: `Check-in was ${daysSinceCI} days ago with no coach response. Send an accountability message now.`,
      action: 'message',
      actionLabel: 'Check In',
      actionData: {
        content: `Hey! I noticed it's been a while since we connected. How are things going? Drop me a quick update — I want to make sure you're staying on track and feeling supported. 💪`,
        tag: 'check_in',
      },
    });
  }

  /* ── 2. Weight gaining on weight-loss goal ── */
  if (goal === 'weight_loss' && trend && trend.direction === 'up' && trend.delta > 1) {
    recs.push({
      id: 'weight-gaining',
      priority: 'critical',
      category: 'nutrition',
      title: `Up ${trend.delta} lbs — Cut Calories`,
      reason: `Gained ${trend.delta} lbs over ${trend.weeks} check-ins despite a weight-loss goal. Deficit too small or nutrition off-track.`,
      action: 'adjust_calories',
      actionLabel: 'Cut 250 kcal',
      actionData: { delta: -250 },
    });
  }

  /* ── 3. Low training compliance ── */
  if (avgTraining !== null && avgTraining < 60) {
    recs.push({
      id: 'low-training',
      priority: avgTraining < 40 ? 'critical' : 'high',
      category: 'training',
      title: `Training at ${Math.round(avgTraining)}% — Send Accountability`,
      reason: `Training compliance is only ${Math.round(avgTraining)}% over 4 check-ins. Client needs direct outreach to identify blockers.`,
      action: 'message',
      actionLabel: 'Accountability Message',
      actionData: {
        content: `Hey! I've noticed your training compliance has been around ${Math.round(avgTraining)}% lately. I want to help — what's been getting in the way of your workouts? Let's find a solution together so you can stay consistent.`,
        tag: 'training',
      },
    });
  }

  /* ── 4. Weight plateau on weight-loss goal ── */
  if (goal === 'weight_loss' && trend && trend.direction === 'flat' && trend.weeks >= 2) {
    // If nutrition is great, add cardio; otherwise cut calories
    if (avgNutrition !== null && avgNutrition >= 85) {
      recs.push({
        id: 'plateau-add-cardio',
        priority: 'high',
        category: 'cardio',
        title: 'Weight Plateau — Add Cardio',
        reason: `Weight flat for ${trend.weeks} check-ins but nutrition is solid (${Math.round(avgNutrition)}%). Increase cardio to deepen the deficit.`,
        action: 'adjust_cardio',
        actionLabel: 'Increase Cardio',
        actionData: { direction: 'up' },
      });
    } else {
      recs.push({
        id: 'weight-plateau',
        priority: 'high',
        category: 'nutrition',
        title: 'Weight Plateau — Cut Calories',
        reason: `Weight has stayed flat for ${trend.weeks} check-ins. A small calorie cut will help break through the plateau.`,
        action: 'adjust_calories',
        actionLabel: 'Cut 150 kcal',
        actionData: { delta: -150 },
      });
    }
  }

  /* ── 5. Low nutrition compliance → simplify the plan ── */
  if (avgNutrition !== null && avgNutrition < 65 && hasNutrition) {
    recs.push({
      id: 'low-nutrition',
      priority: avgNutrition < 50 ? 'high' : 'medium',
      category: 'nutrition',
      title: `Nutrition ${Math.round(avgNutrition)}% — Reduce Target`,
      reason: `Avg nutrition compliance is ${Math.round(avgNutrition)}% over 4 weeks. Targets may be too aggressive — a small reduction improves adherence.`,
      action: 'adjust_calories',
      actionLabel: 'Cut 150 kcal',
      actionData: { delta: -150 },
    });
  }

  /* ── 6. Rapid weight loss → protect muscle ── */
  if (trend && trend.direction === 'down' && trend.lbsPerWeek < -1.2) {
    recs.push({
      id: 'rapid-loss',
      priority: 'high',
      category: 'nutrition',
      title: `Losing ${Math.abs(trend.lbsPerWeek)} lbs/wk — Too Fast`,
      reason: `Losing ~${Math.abs(trend.lbsPerWeek)} lbs/week — well above the 0.5–1 lb/week safe range. Increase calories to protect muscle mass.`,
      action: 'adjust_calories',
      actionLabel: 'Add 150 kcal',
      actionData: { delta: +150 },
    });
  }

  /* ── 7. Muscle gain: not in surplus ── */
  if (goal === 'muscle_gain' && trend && (trend.direction === 'flat' || trend.direction === 'down')) {
    recs.push({
      id: 'muscle-no-gain',
      priority: 'medium',
      category: 'nutrition',
      title: 'Not in Surplus — Add Calories',
      reason: `Weight is ${trend.direction} — client is not gaining for muscle growth. A calorie increase will support muscle gain.`,
      action: 'adjust_calories',
      actionLabel: 'Add 200 kcal',
      actionData: { delta: +200 },
    });
  }

  /* ── 8. Chronically poor sleep ── */
  if (avgSleep !== null && avgSleep < 6.5) {
    recs.push({
      id: 'poor-sleep',
      priority: 'medium',
      category: 'recovery',
      title: `Avg Sleep ${avgSleep.toFixed(1)}h — Recovery at Risk`,
      reason: `Sleep averaging ${avgSleep.toFixed(1)} hrs/night. Below 7 hrs compromises recovery, hormones, and fat loss. Reduce cardio load.`,
      action: 'message',
      actionLabel: 'Send Sleep Message',
      actionData: {
        content: `Your sleep has been averaging ${avgSleep.toFixed(1)} hours lately — that's limiting your recovery and results more than you might think. This week, let's prioritize: consistent bedtime, no screens 30 min before bed. Let me know if stress is a factor.`,
        tag: 'general',
      },
    });
  }

  /* ── 9. Chronically high stress ── */
  if (avgStress !== null && avgStress >= 4) {
    recs.push({
      id: 'high-stress',
      priority: checkIn.stress_level >= 5 ? 'high' : 'medium',
      category: 'recovery',
      title: `Stress Level ${avgStress.toFixed(1)}/10 — Reduce Load`,
      reason: `Stress averaging ${avgStress.toFixed(1)}/10 over recent check-ins. High cortisol blocks fat loss and recovery — ease training volume.`,
      action: 'message',
      actionLabel: 'Send Support Message',
      actionData: {
        content: `I can see stress has been high lately — that's real, and it matters. High stress raises cortisol which makes fat loss harder and recovery slower. Let's keep things light this week. Focus on movement you enjoy, solid sleep, and just showing up. I've got your back.`,
        tag: 'motivation',
      },
    });
  }

  /* ── 10. Low energy → reduce cardio ── */
  if (avgEnergy !== null && avgEnergy < 3) {
    recs.push({
      id: 'low-energy',
      priority: 'medium',
      category: 'recovery',
      title: `Energy ${avgEnergy.toFixed(1)}/10 — Reduce Cardio`,
      reason: `Energy averaging ${avgEnergy.toFixed(1)}/10 — may indicate over-training or under-fueling. Reduce cardio load this week.`,
      action: 'adjust_cardio',
      actionLabel: 'Reduce Cardio',
      actionData: { direction: 'down' },
    });
  }

  /* ── 11. Everything looks great → maintain ── */
  if (recs.length === 0) {
    if (adherence !== null && adherence >= 80) {
      recs.push({
        id: 'maintain',
        priority: 'low',
        category: 'training',
        title: 'On Track — Maintain Plan',
        reason: `Adherence is ${adherence}% and all trends look good. No adjustments needed — great work!`,
        action: 'maintain',
        actionLabel: 'Mark Reviewed',
        actionData: null,
      });
    } else {
      // Not enough data — send check-in prompt
      recs.push({
        id: 'check-in-prompt',
        priority: 'low',
        category: 'engagement',
        title: 'Send Weekly Check-in',
        reason: 'Not enough data yet to make a specific recommendation. Send a check-in to gather more information.',
        action: 'message',
        actionLabel: 'Send Message',
        actionData: {
          content: `Hey! How's everything going this week? Drop me a quick update on your energy, workouts, and how nutrition is feeling. I want to make sure we keep dialing things in for you.`,
          tag: 'check_in',
        },
      });
    }
  }

  return recs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

/* ─── Top recommendation summary (single line) ─── */
export function getTopRecommendation(checkIn, client, allClientCIs = []) {
  const recs = generateRecommendations(checkIn, client, allClientCIs);
  return recs[0] || null;
}

export const PRIORITY_STYLES = {
  critical: { bar: 'bg-destructive', badge: 'bg-destructive/15 text-destructive border-destructive/30', dot: 'bg-destructive', text: 'text-destructive' },
  high:     { bar: 'bg-amber-500',   badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',   dot: 'bg-amber-500',   text: 'text-amber-400' },
  medium:   { bar: 'bg-primary',     badge: 'bg-primary/15 text-primary border-primary/30',         dot: 'bg-primary',     text: 'text-primary' },
  low:      { bar: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500', text: 'text-emerald-400' },
};

export const CATEGORY_ICONS = {
  nutrition:  '🔥',
  cardio:     '🏃',
  training:   '💪',
  recovery:   '😴',
  engagement: '💬',
};