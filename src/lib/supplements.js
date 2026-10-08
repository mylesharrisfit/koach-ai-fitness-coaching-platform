// Supplement grouping for the client app (pure; unit-tested by
// scripts/verify-client-app.mjs).
// The coach's supplements from the client's nutrition plan
// (nutrition_plans.supplements). Grouped by the timings the coach editor offers
// (SupplementPanel), in the order a day runs; anything untimed or with another
// label goes under "Any time". Entries may be objects or plain names (the AI
// generator saves names only). When the coach hasn't added any, say so —
// never show a generic stack as if it were the client's plan.
const TIMING_ORDER = ['Morning', 'Pre-Workout', 'Post-Workout', 'With Meals', 'Night'];
const ALIASES = { 'before bed': 'Night', bedtime: 'Night', evening: 'Night', 'pre workout': 'Pre-Workout', 'post workout': 'Post-Workout', 'with meal': 'With Meals' };

function canonicalTiming(raw) {
  const t = String(raw || '').trim().toLowerCase();
  if (!t) return 'Any time';
  const hit = TIMING_ORDER.find((x) => x.toLowerCase() === t) || ALIASES[t];
  return hit || 'Any time';
}

export function groupSupplements(raw) {
  const items = (Array.isArray(raw) ? raw : [])
    .map((s) => (typeof s === 'string' ? { name: s } : s))
    .filter((s) => s && String(s.name || '').trim())
    .map((s) => ({
      name: String(s.name).trim(),
      dose: s.dosage || s.dose || '',
      why: s.purpose || s.why || '',
      timing: canonicalTiming(s.timing || s.time_of_day),
    }));
  return [...TIMING_ORDER, 'Any time']
    .map((title) => ({ title, items: items.filter((i) => i.timing === title) }))
    .filter((g) => g.items.length > 0);
}

