import React, { useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

const EQUIPMENT_OPTIONS = ['Full gym', 'Dumbbells only', 'Barbell + rack', 'Home gym', 'Bodyweight only', 'Cables & machines'];
const SPLIT_OPTIONS = ['Let AI decide', 'Full Body', 'Upper/Lower', 'Push/Pull/Legs', 'Body Part Split', 'Hybrid'];
const DIET_OPTIONS = ['Balanced', 'High protein', 'Low carb', 'Carb cycling', 'Vegetarian', 'Vegan', 'Keto'];
const FITNESS_LEVELS = [
  { key: 'beginner', label: 'Beginner', desc: '< 1 year training' },
  { key: 'intermediate', label: 'Intermediate', desc: '1–3 years' },
  { key: 'advanced', label: 'Advanced', desc: '3+ years' },
];
const GOAL_OPTIONS = [
  { key: 'weight_loss', label: 'Fat Loss', emoji: '🔥' },
  { key: 'muscle_gain', label: 'Muscle Gain', emoji: '💪' },
  { key: 'strength', label: 'Strength', emoji: '🏋️' },
  { key: 'endurance', label: 'Endurance', emoji: '🏃' },
  { key: 'general_fitness', label: 'General Fitness', emoji: '⚡' },
];

export default function AIOnboardingQuestionnaire({ client, onGenerate, error }) {
  const [form, setForm] = useState({
    goal: client.goal || 'general_fitness',
    fitness_level: 'intermediate',
    days_per_week: 4,
    session_length: 60,
    preferred_split: 'Let AI decide',
    equipment: ['Full gym'],
    injuries: '',
    movements_to_avoid: '',
    include_cardio: false,
    diet_style: 'Balanced',
    daily_calories: '',
    meals_per_day: 4,
    allergies: '',
    extra_notes: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleEquipment = (item) => {
    setForm(f => ({
      ...f,
      equipment: f.equipment.includes(item)
        ? f.equipment.filter(e => e !== item)
        : [...f.equipment, item],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    await onGenerate(form);
    setLoading(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-7">

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Client context banner */}
        <div className="rounded-xl p-4 border border-blue-100 bg-blue-50 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            AI will combine these answers with <strong>{client.name}</strong>'s existing profile
            {client.current_weight ? ` (${client.current_weight} lbs` : ''}
            {client.target_weight ? `, target ${client.target_weight} lbs` : ''}
            {client.height ? `, ${client.height}` : ''}{client.current_weight ? ')' : ''} to generate the plan.
          </p>
        </div>

        {/* Goal */}
        <Section title="Primary Goal">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {GOAL_OPTIONS.map(g => (
              <button key={g.key} onClick={() => set('goal', g.key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                  form.goal === g.key ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}>
                <span className="text-xl">{g.emoji}</span>
                <span className={`text-[11px] font-semibold ${form.goal === g.key ? 'text-blue-600' : 'text-gray-600'}`}>{g.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Fitness level */}
        <Section title="Experience Level">
          <div className="grid grid-cols-3 gap-2">
            {FITNESS_LEVELS.map(l => (
              <button key={l.key} onClick={() => set('fitness_level', l.key)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  form.fitness_level === l.key ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}>
                <p className={`text-xs font-bold ${form.fitness_level === l.key ? 'text-blue-600' : 'text-gray-700'}`}>{l.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{l.desc}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* Training logistics */}
        <Section title="Training Setup">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Training days / week">
              <div className="flex items-center gap-1">
                {[2,3,4,5,6].map(d => (
                  <button key={d} onClick={() => set('days_per_week', d)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold border-2 transition-all ${
                      form.days_per_week === d ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                    }`}>{d}</button>
                ))}
              </div>
            </Field>
            <Field label="Session length (min)">
              <div className="flex items-center gap-1">
                {[30, 45, 60, 75, 90].map(m => (
                  <button key={m} onClick={() => set('session_length', m)}
                    className={`px-2 h-9 rounded-lg text-xs font-bold border-2 transition-all ${
                      form.session_length === m ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                    }`}>{m}</button>
                ))}
              </div>
            </Field>
          </div>
        </Section>

        {/* Training split preference */}
        <Section title="Preferred Training Split">
          <div className="flex flex-wrap gap-2">
            {SPLIT_OPTIONS.map(s => (
              <button key={s} onClick={() => set('preferred_split', s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  form.preferred_split === s ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}>{s}</button>
            ))}
          </div>
        </Section>

        {/* Equipment */}
        <Section title="Equipment Available">
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map(e => (
              <button key={e} onClick={() => toggleEquipment(e)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  form.equipment.includes(e) ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}>{e}</button>
            ))}
          </div>
        </Section>

        {/* Injuries */}
        <Section title="Injuries / Restrictions (optional)">
          <textarea
            value={form.injuries}
            onChange={e => set('injuries', e.target.value)}
            placeholder="e.g. Lower back pain, avoid heavy deadlifts. Right shoulder impingement."
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </Section>

        {/* Include cardio */}
        <Section title="Include Cardio?">
          <div className="flex items-center gap-3">
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => set('include_cardio', v)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                  form.include_cardio === v ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-600'
                }`}>{v ? 'Yes' : 'No'}</button>
            ))}
          </div>
        </Section>

        {/* Divider */}
        <div className="border-t border-gray-100 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Nutrition</p>
        </div>

        {/* Diet style */}
        <Section title="Diet Style">
          <div className="flex flex-wrap gap-2">
            {DIET_OPTIONS.map(d => (
              <button key={d} onClick={() => set('diet_style', d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  form.diet_style === d ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}>{d}</button>
            ))}
          </div>
        </Section>

        <div className="grid grid-cols-2 gap-4">
          <Section title="Daily Calorie Target (optional)">
            <input
              type="number"
              value={form.daily_calories}
              onChange={e => set('daily_calories', e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 2200 (AI will estimate if blank)"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-400"
            />
          </Section>
          <Section title="Meals per day">
            <div className="flex items-center gap-1">
              {[3,4,5,6].map(n => (
                <button key={n} onClick={() => set('meals_per_day', n)}
                  className={`w-10 h-10 rounded-lg text-sm font-bold border-2 transition-all ${
                    form.meals_per_day === n ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                  }`}>{n}</button>
              ))}
            </div>
          </Section>
        </div>

        <Section title="Food allergies / dislikes (optional)">
          <input
            type="text"
            value={form.allergies}
            onChange={e => set('allergies', e.target.value)}
            placeholder="e.g. No dairy, no shellfish"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-400"
          />
        </Section>

        <Section title="Additional notes for the AI (optional)">
          <textarea
            value={form.extra_notes}
            onChange={e => set('extra_notes', e.target.value)}
            placeholder="e.g. Client trains early mornings. Prefers compound movements. Competes in powerlifting."
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </Section>

        {/* Generate button */}
        <div className="pb-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3.5 rounded-xl transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          >
            <Sparkles className="w-4 h-4" />
            Generate AI Plan for {client.name}
          </button>
          <p className="text-center text-[11px] text-gray-400 mt-2">
            Nothing is saved until you review and approve
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-gray-700">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      {children}
    </div>
  );
}