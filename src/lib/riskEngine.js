import { differenceInDays, parseISO } from 'date-fns';
import { checkInScore, averageAdherenceScore } from './adherence';

/**
 * Risk flag definitions — each has a key, label, severity, and detection logic.
 */
const FLAGS = [
  {
    key: 'missed_checkin',
    label: 'Missed check-in',
    severity: 'high',
    detect: ({ lastCheckIn }) => {
      if (!lastCheckIn) return { triggered: true, detail: 'No check-ins on record' };
      const days = differenceInDays(new Date(), parseISO(lastCheckIn.date));
      if (days >= 14) return { triggered: true, detail: `No check-in in ${days} days` };
      return { triggered: false };
    },
  },
  {
    key: 'low_adherence',
    label: 'Low adherence',
    severity: 'high',
    detect: ({ clientCheckIns }) => {
      const avg = averageAdherenceScore(clientCheckIns, 3);
      if (avg !== null && avg < 55) return { triggered: true, detail: `Avg adherence ${avg}%` };
      return { triggered: false };
    },
  },
  {
    key: 'missed_workouts',
    label: 'Missed workouts',
    severity: 'medium',
    detect: ({ lastCheckIn, clientCheckIns }) => {
      if (!lastCheckIn) return { triggered: false };
      const recent = clientCheckIns.slice(0, 3);
      const lowTraining = recent.filter(
        ci => ci.compliance_training != null && ci.compliance_training < 60
      );
      if (lowTraining.length >= 2)
        return { triggered: true, detail: `Training compliance <60% in last ${recent.length} check-ins` };
      return { triggered: false };
    },
  },
  {
    key: 'low_nutrition',
    label: 'Nutrition off-track',
    severity: 'medium',
    detect: ({ clientCheckIns }) => {
      const recent = clientCheckIns.slice(0, 3);
      const low = recent.filter(ci => ci.compliance_nutrition != null && ci.compliance_nutrition < 55);
      if (low.length >= 2) return { triggered: true, detail: `Nutrition compliance <55% recently` };
      return { triggered: false };
    },
  },
  {
    key: 'no_progress',
    label: 'No weight progress',
    severity: 'medium',
    detect: ({ clientCheckIns, client }) => {
      const withWeight = clientCheckIns.filter(ci => ci.weight != null);
      if (withWeight.length < 3) return { triggered: false };
      // Check last 3 check-ins for stalled weight (when goal is weight_loss)
      if (client.goal === 'weight_loss') {
        const weights = withWeight.slice(0, 4).map(ci => ci.weight);
        const range = Math.max(...weights) - Math.min(...weights);
        if (range < 1) return { triggered: true, detail: 'Weight stalled for last 4 check-ins' };
      }
      return { triggered: false };
    },
  },
  {
    key: 'declining_trend',
    label: 'Declining scores',
    severity: 'medium',
    detect: ({ clientCheckIns }) => {
      if (clientCheckIns.length < 3) return { triggered: false };
      const scores = clientCheckIns.slice(0, 4).map(checkInScore).filter(s => s !== null);
      if (scores.length < 3) return { triggered: false };
      // Declining if each score is lower than the previous
      let declining = 0;
      for (let i = 0; i < scores.length - 1; i++) {
        if (scores[i] < scores[i + 1]) declining++;
      }
      if (declining >= 2) return { triggered: true, detail: `Adherence dropping for ${declining + 1} check-ins` };
      return { triggered: false };
    },
  },
  {
    key: 'mood_low',
    label: 'Low mood reported',
    severity: 'low',
    detect: ({ lastCheckIn }) => {
      if (!lastCheckIn) return { triggered: false };
      if (lastCheckIn.mood === 'stressed' || lastCheckIn.mood === 'tired')
        return { triggered: true, detail: `Reported mood: ${lastCheckIn.mood}` };
      return { triggered: false };
    },
  },
];

/**
 * Calculates a risk score (0–100) and list of triggered flags for a single client.
 * Returns null if client doesn't have enough data to evaluate.
 */
export function evaluateClientRisk(client, allCheckIns) {
  const clientCheckIns = allCheckIns
    .filter(ci => ci.client_id === client.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const lastCheckIn = clientCheckIns[0] || null;

  const ctx = { client, clientCheckIns, lastCheckIn };

  const triggered = [];
  for (const flag of FLAGS) {
    const result = flag.detect(ctx);
    if (result.triggered) {
      triggered.push({ ...flag, detail: result.detail });
    }
  }

  if (!triggered.length) return null;

  // Risk score: high=30pts, medium=15pts, low=5pts
  const score = triggered.reduce((acc, f) => {
    return acc + (f.severity === 'high' ? 30 : f.severity === 'medium' ? 15 : 5);
  }, 0);

  return {
    client,
    flags: triggered,
    riskScore: Math.min(score, 100),
    lastCheckInDate: lastCheckIn?.date || null,
  };
}

/**
 * Returns all at-risk clients sorted by risk score descending.
 */
export function getAtRiskClients(clients, checkIns) {
  return clients
    .filter(c => c.lifecycle_status === 'active' || c.status === 'active')
    .map(c => evaluateClientRisk(c, checkIns))
    .filter(Boolean)
    .sort((a, b) => b.riskScore - a.riskScore);
}

export const SEVERITY_CONFIG = {
  high:   { color: 'text-destructive bg-destructive/10 border-destructive/20' },
  medium: { color: 'text-chart-4 bg-chart-4/10 border-chart-4/20' },
  low:    { color: 'text-muted-foreground bg-secondary border-border' },
};