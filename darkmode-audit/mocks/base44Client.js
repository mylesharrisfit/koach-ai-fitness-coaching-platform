/* Mock data client for the dark-mode audit harness — no network. Returns
 * representative rows so real page markup (rows, cards, tables) renders in
 * dark mode for contrast scanning. */
const COACH = {
  id: 'coach-1', email: 'coach@audit.local', full_name: 'Audit Coach', role: 'admin',
  subscription_tier: 'elite', billing_status: 'active', stripe_subscription_id: 'sub_x',
  created_date: '2026-01-01T00:00:00Z',
};

const mkClient = (i) => ({
  id: `client-${i}`, name: `Client ${i}`, email: `client${i}@audit.local`,
  client_name: `Client ${i}`, lifecycle_status: i % 3 ? 'active' : 'at_risk', status: 'active',
  goal: 'weight_loss', current_weight: 180 - i, starting_weight: 190, target_weight: 165,
  monthly_rate: 200, tags: ['premium'], created_date: '2026-05-01T00:00:00Z', start_date: '2026-05-01',
  assigned_program_id: 'prog-1', assigned_nutrition_id: 'plan-1', avatar_url: null, phone: '555-0100',
});
const mkCheckIn = (i) => ({
  id: `ci-${i}`, client_id: `client-${(i % 6) + 1}`, client_name: `Client ${(i % 6) + 1}`,
  date: `2026-07-0${(i % 9) + 1}`, weight: 180 - i, compliance_training: 90 - i * 5,
  compliance_nutrition: 85 - i * 4, sleep_hours: 7, mood: i % 2 ? 'good' : 'stressed',
  energy_level: 7, review_status: i % 2 ? 'pending' : 'reviewed', notes: 'Feeling good this week',
  coach_responded: false, created_date: '2026-07-01T00:00:00Z',
});
const mkGeneric = (i) => ({
  id: `row-${i}`, name: `Item ${i}`, title: `Item ${i}`, client_name: `Client ${i}`,
  client_id: `client-${i}`, status: 'active', amount: 200, calories: 2200, protein_g: 180,
  carbs_g: 220, fats_g: 70, date: '2026-07-01', created_date: '2026-07-01T00:00:00Z',
  content: 'Sample content', is_active: true, price: 99, duration_weeks: 8,
});

const N = (fn, n = 6) => Array.from({ length: n }, (_, i) => fn(i + 1));

const DATA = {
  Client: () => N(mkClient), CheckIn: () => N(mkCheckIn, 12),
  Message: () => N(mkGeneric), WorkoutProgram: () => N(mkGeneric),
  NutritionPlan: () => N(mkGeneric), Invoice: () => N(mkGeneric),
  ClientBadge: () => [], Goal: () => N(mkGeneric), Habit: () => N(mkGeneric),
};

function rowsFor(entity) { return (DATA[entity] || (() => N(mkGeneric)))(); }

function makeEntity(name) {
  return {
    list: async () => rowsFor(name),
    filter: async (criteria = {}) => {
      const rows = rowsFor(name);
      // shallow filter so { id } / { client_id } style lookups return something
      return rows.filter((r) => Object.entries(criteria).every(([k, v]) => r[k] === undefined || r[k] === v)).length
        ? rows.filter((r) => Object.entries(criteria).every(([k, v]) => r[k] === undefined || r[k] === v))
        : rows.slice(0, 1);
    },
    get: async () => rowsFor(name)[0],
    create: async (d) => ({ id: 'new', ...d }),
    update: async (id, d) => ({ id, ...d }),
    delete: async () => ({}),
    subscribe: () => () => {},
  };
}

const entities = new Proxy({}, { get: (_t, name) => makeEntity(String(name)) });

export const base44 = {
  entities,
  auth: {
    me: async () => COACH,
    updateMe: async (d) => ({ ...COACH, ...d }),
    logout: () => {},
    redirectToLogin: () => {},
  },
  functions: { invoke: async () => ({ data: {} }) },
};
