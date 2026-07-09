#!/usr/bin/env node
/**
 * Step 4.1 parity proof: the shared server module riskScoring.js reproduces
 * src/lib/riskEngine.js EXACTLY (faithful port, not a reinterpretation).
 *
 * Both are run on identical clients + check-ins. To keep the comparison
 * deterministic, the check-in dates are recent (so the time-based
 * missed_checkin flag — the only flag that reads `new Date()` in the client
 * version — resolves the same way for both); every other flag is value-based.
 */
import { getAtRiskClients as clientImpl } from '../src/lib/riskEngine.js';
import { getAtRiskClients as serverImpl } from '../supabase/functions/_shared/riskScoring.js';

const today = new Date();
const iso = (daysAgo) => new Date(today.getTime() - daysAgo * 86400_000).toISOString().slice(0, 10);

const clients = [
  { id: 'c1', name: 'Low Adherence', status: 'active', goal: 'muscle_gain' },
  { id: 'c2', name: 'Poor Sleep + Mood', status: 'active', goal: 'general_fitness' },
  { id: 'c3', name: 'Declining', status: 'active', goal: 'weight_loss' },
  { id: 'c4', name: 'Healthy', status: 'active', goal: 'general_fitness' },
];
const checkIns = [
  // c1: low adherence + missed workouts + low nutrition
  { client_id: 'c1', date: iso(1), compliance_training: 40, compliance_nutrition: 45, sleep_hours: 7 },
  { client_id: 'c1', date: iso(8), compliance_training: 45, compliance_nutrition: 50, sleep_hours: 7 },
  { client_id: 'c1', date: iso(15), compliance_training: 50, compliance_nutrition: 48, sleep_hours: 7 },
  // c2: poor sleep + stressed mood + negative notes
  { client_id: 'c2', date: iso(1), compliance_training: 80, compliance_nutrition: 80, sleep_hours: 5, mood: 'stressed', notes: 'feeling exhausted and overwhelmed' },
  { client_id: 'c2', date: iso(8), compliance_training: 82, compliance_nutrition: 78, sleep_hours: 5, mood: 'tired' },
  // c3: declining trend
  { client_id: 'c3', date: iso(1), compliance_training: 55, compliance_nutrition: 55, sleep_hours: 7 },
  { client_id: 'c3', date: iso(8), compliance_training: 70, compliance_nutrition: 70, sleep_hours: 7 },
  { client_id: 'c3', date: iso(15), compliance_training: 85, compliance_nutrition: 85, sleep_hours: 7 },
  { client_id: 'c3', date: iso(22), compliance_training: 95, compliance_nutrition: 95, sleep_hours: 7 },
  // c4: healthy — no flags
  { client_id: 'c4', date: iso(1), compliance_training: 95, compliance_nutrition: 92, sleep_hours: 8 },
];

const a = clientImpl(clients, checkIns);
const b = serverImpl(clients, checkIns, today);

const norm = (list) => list.map((r) => ({
  id: r.client.id, riskScore: r.riskScore,
  flags: r.flags.map((f) => f.key).sort().join(','),
}));

const na = JSON.stringify(norm(a), null, 2);
const nb = JSON.stringify(norm(b), null, 2);

console.log('client riskEngine.js:\n', na);
console.log('shared riskScoring.js:\n', nb);

if (na === nb) {
  console.log('\nPASS — shared module reproduces riskEngine.js exactly (score + flags identical)');
  process.exit(0);
}
console.log('\nFAIL — divergence between client and server risk scoring');
process.exit(1);
