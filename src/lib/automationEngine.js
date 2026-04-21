import { differenceInDays, parseISO } from 'date-fns';
import { checkInScore, averageAdherenceScore } from './adherence';

/**
 * Condition definitions: each returns { triggered: boolean, detail: string, affectedClients: [] }
 */

export const CONDITION_META = {
  missed_checkin: {
    label: 'Missed Check-in',
    description: 'Client has not submitted a check-in',
    icon: '📋',
    defaultThreshold: 10,
    thresholdLabel: 'days without check-in',
    thresholdType: 'days',
  },
  missed_workouts: {
    label: 'Missed Workouts',
    description: 'Training compliance drops below threshold',
    icon: '🏋️',
    defaultThreshold: 60,
    thresholdLabel: '% training compliance',
    thresholdType: 'percent',
  },
  low_adherence: {
    label: 'Low Adherence Score',
    description: 'Overall adherence average falls below threshold',
    icon: '📉',
    defaultThreshold: 60,
    thresholdLabel: '% average adherence',
    thresholdType: 'percent',
  },
  weight_plateau: {
    label: 'Weight Plateau',
    description: 'No weight change over recent check-ins',
    icon: '⚖️',
    defaultThreshold: 3,
    thresholdLabel: 'consecutive check-ins with <1 lb change',
    thresholdType: 'count',
  },
  low_nutrition: {
    label: 'Low Nutrition Compliance',
    description: 'Nutrition compliance below threshold',
    icon: '🥗',
    defaultThreshold: 60,
    thresholdLabel: '% nutrition compliance',
    thresholdType: 'percent',
  },
  mood_low: {
    label: 'Low Mood Reported',
    description: 'Client reports stressed or tired mood',
    icon: '😔',
    defaultThreshold: 2,
    thresholdLabel: 'consecutive low-mood check-ins',
    thresholdType: 'count',
  },
  no_progress: {
    label: 'No Progress',
    description: 'Weight stalled for weight-loss clients',
    icon: '🚫',
    defaultThreshold: 4,
    thresholdLabel: 'check-ins with <1 lb change',
    thresholdType: 'count',
  },
  declining_trend: {
    label: 'Declining Trend',
    description: 'Adherence scores dropping consecutively',
    icon: '↘️',
    defaultThreshold: 3,
    thresholdLabel: 'consecutive declining check-ins',
    thresholdType: 'count',
  },
};

export const ACTION_META = {
  send_message: {
    label: 'Send Message to Client',
    icon: '💬',
    description: 'Send a pre-written message directly to the client',
    needsMessage: true,
  },
  send_template: {
    label: 'Send Template Message',
    icon: '📝',
    description: 'Send a coaching template message',
    needsMessage: true,
  },
  notify_coach: {
    label: 'Notify Coach',
    icon: '🔔',
    description: 'Add a dashboard alert for the coach to review',
    needsMessage: false,
  },
  adjust_calories: {
    label: 'Adjust Calorie Target',
    icon: '🔥',
    description: 'Automatically adjust client calorie target',
    needsCalorieDelta: true,
  },
  flag_client: {
    label: 'Flag Client as At-Risk',
    icon: '🚩',
    description: 'Mark client lifecycle status as at_risk',
    needsMessage: false,
  },
  suggest_adjustment: {
    label: 'Suggest Plan Adjustment',
    icon: '💡',
    description: 'Notify coach to review and adjust the client\'s plan',
    needsMessage: true,
  },
};

/**
 * Evaluate whether a single client triggers a rule's condition.
 * Returns { triggered: boolean, detail: string }
 */
export function evaluateCondition(rule, client, clientCheckIns) {
  const sorted = [...clientCheckIns].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latest = sorted[0];
  const threshold = rule.condition_threshold ?? CONDITION_META[rule.condition_type]?.defaultThreshold;

  switch (rule.condition_type) {
    case 'missed_checkin': {
      if (!latest) return { triggered: true, detail: 'No check-ins on record' };
      const days = differenceInDays(new Date(), parseISO(latest.date));
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
      const withWeight = sorted.filter(ci => ci.weight != null).slice(0, threshold + 1);
      if (withWeight.length < threshold) return { triggered: false, detail: 'Not enough weight data' };
      const range = Math.max(...withWeight.map(ci => ci.weight)) - Math.min(...withWeight.map(ci => ci.weight));
      return { triggered: range < 1, detail: `Weight range over last ${threshold} check-ins: ${range.toFixed(1)} lbs` };
    }
    case 'low_nutrition': {
      const recent = sorted.slice(0, 3);
      if (!recent.length) return { triggered: false, detail: 'No data' };
      const avg = recent.reduce((s, ci) => s + (ci.compliance_nutrition ?? 100), 0) / recent.length;
      return { triggered: avg < threshold, detail: `Avg nutrition compliance: ${Math.round(avg)}% (threshold: ${threshold}%)` };
    }
    case 'mood_low': {
      const lowMoodCount = sorted.slice(0, threshold).filter(ci => ci.mood === 'stressed' || ci.mood === 'tired').length;
      return { triggered: lowMoodCount >= threshold, detail: `${lowMoodCount} consecutive low-mood check-ins` };
    }
    case 'no_progress': {
      if (client.goal !== 'weight_loss') return { triggered: false, detail: 'Not a weight-loss client' };
      const withWeight = sorted.filter(ci => ci.weight != null).slice(0, threshold);
      if (withWeight.length < threshold) return { triggered: false, detail: 'Not enough data' };
      const range = Math.max(...withWeight.map(ci => ci.weight)) - Math.min(...withWeight.map(ci => ci.weight));
      return { triggered: range < 1, detail: `Weight stalled: ${range.toFixed(1)} lbs change` };
    }
    case 'declining_trend': {
      const scores = sorted.slice(0, threshold + 1).map(checkInScore).filter(s => s !== null);
      if (scores.length < threshold) return { triggered: false, detail: 'Not enough data' };
      let declining = 0;
      for (let i = 0; i < scores.length - 1; i++) {
        if (scores[i] < scores[i + 1]) declining++;
      }
      return { triggered: declining >= threshold - 1, detail: `${declining + 1} consecutive declining scores` };
    }
    default:
      return { triggered: false, detail: 'Unknown condition' };
  }
}

/**
 * Run all active rules against all clients. Returns array of { rule, client, detail }.
 */
export function runAutomations(rules, clients, checkIns) {
  const results = [];
  const activeRules = rules.filter(r => r.is_active);

  for (const rule of activeRules) {
    for (const client of clients) {
      if (client.lifecycle_status !== 'active' && client.status !== 'active') continue;
      const clientCheckIns = checkIns.filter(ci => ci.client_id === client.id);
      const result = evaluateCondition(rule, client, clientCheckIns);
      if (result.triggered) {
        results.push({ rule, client, detail: result.detail });
      }
    }
  }
  return results;
}

export const AUTOMATION_TEMPLATES = [
  {
    name: 'Missed Check-in Alert',
    description: 'Automatically message clients who miss their weekly check-in',
    condition_type: 'missed_checkin',
    condition_threshold: 10,
    action_type: 'send_message',
    action_message: "Hey! Just checking in — I noticed you missed your weekly check-in. How has training been going? Drop me a message when you get a chance 💪",
    icon: '📋',
    color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  },
  {
    name: 'Low Adherence Coach Alert',
    description: "Notify yourself when a client's adherence drops below 60%",
    condition_type: 'low_adherence',
    condition_threshold: 60,
    action_type: 'notify_coach',
    action_message: '',
    icon: '📉',
    color: 'bg-destructive/10 border-destructive/20 text-destructive',
  },
  {
    name: 'Missed Workouts Message',
    description: 'Send motivation when training compliance is below 60%',
    condition_type: 'missed_workouts',
    condition_threshold: 60,
    action_type: 'send_message',
    action_message: "I noticed training compliance has been a bit low recently. Life gets busy — let's chat about adjusting the schedule to make it work better for you! 🔥",
    icon: '🏋️',
    color: 'bg-chart-4/10 border-chart-4/20 text-chart-4',
  },
  {
    name: 'Weight Plateau Calorie Adjust',
    description: 'Reduce calories by 100 when weight stalls for 3 check-ins',
    condition_type: 'weight_plateau',
    condition_threshold: 3,
    action_type: 'adjust_calories',
    action_calorie_delta: -100,
    icon: '⚖️',
    color: 'bg-accent/10 border-accent/20 text-accent',
  },
  {
    name: 'Flag At-Risk Client',
    description: 'Auto-flag client when adherence and workouts both decline',
    condition_type: 'declining_trend',
    condition_threshold: 3,
    action_type: 'flag_client',
    action_message: '',
    icon: '🚩',
    color: 'bg-destructive/10 border-destructive/20 text-destructive',
  },
  {
    name: 'Low Mood Check-in',
    description: 'Send a supportive message when client reports stressed/tired',
    condition_type: 'mood_low',
    condition_threshold: 2,
    action_type: 'send_message',
    action_message: "Hey, I noticed things have been feeling a bit heavy lately — that's completely normal. Remember why you started and know I'm here to support you every step 💙",
    icon: '😔',
    color: 'bg-primary/10 border-primary/20 text-primary',
  },
];