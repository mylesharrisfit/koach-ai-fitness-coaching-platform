// Only ever show what the coach prescribed. The previous version fell back to a
// hard-coded "default stack" (ashwagandha, zinc, …) whenever the plan had no
// supplements OR used any timing other than exactly Morning/Night — so clients
// were shown supplements their coach never chose (smoke test 2026-10-05, 11c).
// Group order mirrors the coach editor's TIMING_OPTIONS (SupplementPanel.jsx).
const TIMING_GROUPS = [
  { key: 'morning',      title: 'Morning',      emoji: '☀️', match: ['morning'] },
  { key: 'pre-workout',  title: 'Pre-Workout',  emoji: '⚡', match: ['pre-workout', 'preworkout', 'pre workout'] },
  { key: 'post-workout', title: 'Post-Workout', emoji: '💪', match: ['post-workout', 'postworkout', 'post workout'] },
  { key: 'with-meals',   title: 'With Meals',   emoji: '🍽️', match: ['with meals', 'with meal', 'with food'] },
  { key: 'night',        title: 'Night',        emoji: '🌙', match: ['night', 'before bed', 'evening', 'bedtime'] },
];

export function groupSupplements(raw) {
  const items = (Array.isArray(raw) ? raw : []).filter((s) => s && s.name);
  const groups = TIMING_GROUPS.map((g) => ({ ...g, items: [] }));
  const other = { key: 'other', title: 'Anytime', emoji: '💊', items: [] };
  for (const s of items) {
    const timing = String(s.timing || s.time_of_day || '').trim().toLowerCase();
    const item = { name: s.name, dose: s.dosage || s.dose || '', why: s.purpose || s.why || '' };
    const group = groups.find((g) => g.match.includes(timing)) || other;
    group.items.push(item);
  }
  return [...groups, other].filter((g) => g.items.length > 0);
}
