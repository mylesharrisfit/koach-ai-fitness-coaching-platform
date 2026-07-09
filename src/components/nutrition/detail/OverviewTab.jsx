import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Droplets, CheckCircle2, XCircle, Clock, Pill, Flame, Dumbbell, Zap, Leaf, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GOAL_META = {
  fat_loss:    { emoji: '🔥', label: 'Fat Loss',    color: 'text-destructive',    bg: 'bg-destructive/10',    border: 'border-destructive',   icon: Flame },
  muscle_gain: { emoji: '💪', label: 'Muscle Gain', color: 'text-primary',   bg: 'bg-accent',   border: 'border-accent',  icon: Dumbbell },
  performance: { emoji: '⚡', label: 'Performance', color: 'text-warning',  bg: 'bg-warning/10',  border: 'border-warning', icon: Zap },
  maintenance: { emoji: '🌿', label: 'Maintenance', color: 'text-success',bg: 'bg-success/10',border: 'border-success',icon: Leaf },
};

const PRIORITIZE_BY_GOAL = {
  fat_loss:    ['Lean proteins (chicken, fish, egg whites)', 'Leafy greens & cruciferous vegetables', 'High-fiber foods (beans, oats)', 'Low-calorie dense foods', 'Water-rich fruits & vegetables'],
  muscle_gain: ['Red meat & lean beef', 'Whole milk & dairy', 'Oats, rice & complex carbs', 'Eggs & egg yolks', 'Calorie-dense whole foods'],
  performance: ['Complex carbohydrates (oats, rice, potato)', 'Lean protein (chicken, turkey, fish)', 'Fruits for fast energy (banana, berries)', 'Electrolyte-rich foods', 'Anti-inflammatory foods'],
  maintenance: ['Lean meats (chicken, turkey, fish)', 'Leafy greens & cruciferous vegetables', 'Whole grains (rice, oats, quinoa)', 'Legumes and beans', 'Healthy fats (avocado, olive oil, nuts)'],
};

const AVOID_BY_GOAL = {
  fat_loss:    ['Sugary drinks and sodas', 'Alcohol and liquid calories', 'Fried and fast food', 'Processed snacks and pastries', 'High-sodium convenience meals'],
  muscle_gain: ['Low-calorie filler foods', 'Excessive cardio without eating back', 'Skipping meals', 'Diet / zero-calorie products', 'Highly processed junk food'],
  performance: ['Heavy fats before workouts', 'Alcohol on training days', 'Simple sugars mid-session', 'Skipping post-workout nutrition', 'High-fiber foods pre-competition'],
  maintenance: ['Processed / packaged snacks', 'Sugary drinks and sodas', 'Fried and fast food', 'Excess alcohol', 'High-sodium convenience meals'],
};

const MEAL_TIMING = [
  'Eat every 3–4 hours to maintain energy and muscle protein synthesis.',
  'Pre-workout meal 1–2 hours before training — focus on complex carbs + protein.',
  'Post-workout: consume protein within 30–60 minutes after training.',
  'Avoid large meals within 90 minutes of bedtime.',
];

function DonutChart({ protein, carbs, fats }) {
  const total = (protein * 4) + (carbs * 4) + (fats * 9);
  if (!total) return null;
  const data = [
    { name: 'Protein', value: Math.round((protein * 4 / total) * 100), color: 'rgb(var(--primary))', grams: protein },
    { name: 'Carbs',   value: Math.round((carbs * 4 / total) * 100),   color: '#F97316', grams: carbs },
    { name: 'Fats',    value: Math.round((fats * 9 / total) * 100),    color: '#EAB308', grams: fats },
  ];
  return (
    <div className="flex items-center gap-4">
      <div className="w-36 h-36 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={2} dataKey="value">
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [`${v}%`, n]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 flex-1">
        {data.map(d => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
              <span className="text-sm font-medium text-foreground">{d.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-foreground">{d.grams}g</span>
              <span className="text-muted-foreground text-xs">({d.value}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_MORNING = [
  { name: 'Multivitamin',         dosage: '1 serving',       timing: 'Morning', purpose: 'Micronutrient insurance' },
  { name: 'Vitamin D3',           dosage: '2,000–5,000 IU',  timing: 'Morning', purpose: 'Testosterone, immunity, bone health' },
  { name: 'Omega-3 Fish Oil',     dosage: '2–3g EPA+DHA',    timing: 'Morning', purpose: 'Inflammation, joints, recovery' },
  { name: 'Creatine Monohydrate', dosage: '5g daily',        timing: 'Morning', purpose: 'Strength, power, muscle retention' },
  { name: 'Vitamin C',            dosage: '500–1,000mg',     timing: 'Morning', purpose: 'Immune support, collagen synthesis' },
];
const DEFAULT_NIGHT = [
  { name: 'Magnesium Glycinate',  dosage: '200–400mg',       timing: 'Night', purpose: 'Sleep, muscle recovery, stress' },
  { name: 'Zinc',                 dosage: '15–30mg',         timing: 'Night', purpose: 'Testosterone, immune health, protein synthesis' },
  { name: 'Ashwagandha KSM-66',   dosage: '300–600mg',       timing: 'Night', purpose: 'Cortisol, sleep quality, testosterone' },
];

function SupStack({ title, emoji, items, badgeColor }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted hover:bg-muted transition-colors text-left">
        <span className="text-base">{emoji}</span>
        <span className="text-xs font-bold text-foreground flex-1">{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="text-left px-4 py-2 text-muted-foreground font-semibold">Supplement</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Dose</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold hidden sm:table-cell">Why it matters</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s, i) => (
                    <tr key={i} className="border-b border-muted last:border-0 bg-card">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeColor}`}>
                            {s.timing || title.split(' ')[0]}
                          </span>
                          <span className="font-semibold text-foreground">{s.name}</span>
                        </div>
                        <p className="text-muted-foreground mt-0.5 sm:hidden">{s.purpose}</p>
                      </td>
                      <td className="px-3 py-2.5 text-primary font-bold whitespace-nowrap">{s.dosage}</td>
                      <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{s.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SupplementSection({ supplements }) {
  // Split by timing or fall back to default stacks
  const hasTiming = supplements.some(s => s.timing);
  const morning = hasTiming
    ? supplements.filter(s => s.timing === 'Morning' || s.timing === 'morning')
    : DEFAULT_MORNING;
  const night = hasTiming
    ? supplements.filter(s => s.timing === 'Night' || s.timing === 'night' || s.timing === 'Before Bed')
    : DEFAULT_NIGHT;
  const other = hasTiming
    ? supplements.filter(s => !['Morning','morning','Night','night','Before Bed'].includes(s.timing))
    : [];

  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
        <Pill className="w-3.5 h-3.5" /> Supplement Protocol
      </h4>
      <div className="space-y-3">
        {morning.length > 0 && (
          <SupStack title="Morning Stack" emoji="☀️" items={morning} badgeColor="bg-warning/10 text-warning" />
        )}
        {night.length > 0 && (
          <SupStack title="Night Stack" emoji="🌙" items={night} badgeColor="bg-accent text-primary" />
        )}
        {other.length > 0 && (
          <SupStack title="Other Supplements" emoji="💊" items={other} badgeColor="bg-muted text-muted-foreground" />
        )}
        <p className="text-[11px] text-warning bg-warning/10 rounded-xl px-3 py-2">
          ⚠️ General recommendations. Coach may adjust based on your specific needs.
        </p>
      </div>
    </div>
  );
}

export default function OverviewTab({ plan }) {
  const isHabits = plan.tracking_mode === 'habits';
  const supplements = plan.supplements || [];
  const goalKey = plan.goal || (
    ((plan.title || '') + ' ' + (plan.description || '')).toLowerCase().includes('fat loss') ? 'fat_loss' :
    ((plan.title || '') + ' ' + (plan.description || '')).toLowerCase().includes('muscle') ? 'muscle_gain' : null
  );
  const goalMeta = goalKey ? GOAL_META[goalKey] : null;
  const prioritize = PRIORITIZE_BY_GOAL[goalKey] || PRIORITIZE_BY_GOAL.maintenance;
  const avoid = AVOID_BY_GOAL[goalKey] || AVOID_BY_GOAL.maintenance;
  const condiments = plan.condiments || [];

  const hasBMR = plan.bmr || plan.tdee;
  const deficit = plan.daily_deficit || (plan.tdee && plan.calories ? plan.tdee - plan.calories : null);

  return (
    <div className="space-y-6 pb-4">

      {/* Goal banner */}
      {goalMeta && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${goalMeta.bg} ${goalMeta.border}`}>
          <span className="text-2xl">{goalMeta.emoji}</span>
          <div>
            <p className={`text-sm font-bold ${goalMeta.color}`}>{goalMeta.label}</p>
            {plan.weekly_loss_rate && (
              <p className="text-xs text-muted-foreground">Target: lose {plan.weekly_loss_rate} lb/week</p>
            )}
          </div>
        </div>
      )}

      {/* BMR / TDEE info banner */}
      {hasBMR && (
        <div className="flex items-center gap-2 px-4 py-3 bg-muted border border-border rounded-xl text-xs text-muted-foreground flex-wrap gap-y-1">
          {plan.bmr && <span><span className="font-semibold text-foreground">BMR:</span> {plan.bmr} kcal</span>}
          {plan.bmr && plan.tdee && <span className="text-border">·</span>}
          {plan.tdee && <span><span className="font-semibold text-foreground">TDEE:</span> {plan.tdee} kcal</span>}
          {deficit && deficit > 0 && (
            <>
              <span className="text-border">·</span>
              <span><span className="font-semibold text-foreground">Deficit:</span> {deficit} kcal/day</span>
            </>
          )}
        </div>
      )}

      {/* Description */}
      {plan.description && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">About this plan</h4>
          <p className="text-sm text-foreground leading-relaxed">{plan.description}</p>
        </div>
      )}

      {/* Macro ratio donut */}
      {!isHabits && (plan.protein_g || plan.carbs_g || plan.fats_g) ? (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Macro Ratio</h4>
          <div className="bg-card border border-border rounded-xl p-4">
            <DonutChart protein={plan.protein_g || 0} carbs={plan.carbs_g || 0} fats={plan.fats_g || 0} />
          </div>
        </div>
      ) : null}

      {/* Meal timing */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Meal Timing
        </h4>
        <div className="space-y-2">
          {MEAL_TIMING.map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
              <span className="text-muted-foreground">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Foods to prioritize / avoid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Prioritize
          </h4>
          <div className="space-y-1.5">
            {prioritize.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                <span className="text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-destructive" /> Avoid
          </h4>
          <div className="space-y-1.5">
            {avoid.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                <span className="text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hydration */}
      <div className="flex items-center gap-3 p-3.5 bg-accent border border-accent rounded-xl">
        <Droplets className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Hydration Goal</p>
          <p className="text-xs text-muted-foreground">Aim for 3–4 litres of water per day. Add electrolytes during intense training days.</p>
        </div>
      </div>

      {/* Approved Seasonings */}
      {condiments.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">🧂 Approved Seasonings</h4>
          <div className="flex flex-wrap gap-2">
            {condiments.map((c, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-secondary border border-border text-xs font-medium text-foreground">{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Supplements — always show default stacks for macro plans */}
      {(!plan.tracking_mode || plan.tracking_mode !== 'habits') && (
        <SupplementSection supplements={supplements} />
      )}
    </div>
  );
}