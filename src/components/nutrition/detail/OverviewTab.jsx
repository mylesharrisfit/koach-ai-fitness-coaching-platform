import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Droplets, CheckCircle2, XCircle, Clock, Pill } from 'lucide-react';

const MACRO_COLORS = ['#3B82F6', '#F97316', '#EAB308'];

function DonutChart({ protein, carbs, fats }) {
  const total = (protein * 4) + (carbs * 4) + (fats * 9);
  if (!total) return null;
  const data = [
    { name: 'Protein', value: Math.round((protein * 4 / total) * 100), color: '#3B82F6', grams: protein },
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

const MEAL_TIMING = [
  'Eat every 3–4 hours to maintain energy and muscle protein synthesis.',
  'Pre-workout meal 1–2 hours before training — focus on complex carbs + protein.',
  'Post-workout: consume protein within 30–60 minutes after training.',
  'Avoid large meals within 90 minutes of bedtime.',
];

const PRIORITIZE = ['Lean meats (chicken, turkey, fish)', 'Leafy greens & cruciferous vegetables', 'Whole grains (rice, oats, quinoa)', 'Legumes and beans', 'Healthy fats (avocado, olive oil, nuts)'];
const AVOID = ['Processed / packaged snacks', 'Sugary drinks and sodas', 'Fried and fast food', 'Excess alcohol', 'High-sodium convenience meals'];

export default function OverviewTab({ plan }) {
  const isHabits = plan.tracking_mode === 'habits';
  const supplements = plan.supplements || [];

  return (
    <div className="space-y-6 pb-4">
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
          <div className="bg-white border border-[#E7EAF3] rounded-xl p-4">
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
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Prioritize
          </h4>
          <div className="space-y-1.5">
            {PRIORITIZE.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-red-400" /> Avoid
          </h4>
          <div className="space-y-1.5">
            {AVOID.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                <span className="text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hydration */}
      <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
        <Droplets className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Hydration Goal</p>
          <p className="text-xs text-muted-foreground">Aim for 3–4 litres of water per day. Add electrolytes during intense training days.</p>
        </div>
      </div>

      {/* Supplements */}
      {supplements.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5" /> Supplements
          </h4>
          <div className="space-y-2">
            {supplements.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white border border-[#E7EAF3] rounded-xl text-sm">
                <div>
                  <p className="font-semibold text-foreground">{s.name}</p>
                  {s.purpose && <p className="text-xs text-muted-foreground">{s.purpose}</p>}
                </div>
                <div className="text-right">
                  {s.dosage && <p className="text-xs font-bold text-primary">{s.dosage}</p>}
                  {s.timing && <p className="text-xs text-muted-foreground">{s.timing}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}