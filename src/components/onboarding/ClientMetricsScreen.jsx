import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';

function MetricBox({ label, value, onChange, unit, placeholder }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2 flex-1 p-5 rounded-2xl"
      style={{ background: 'color-mix(in srgb, white 3%, transparent)', border: '1.5px solid color-mix(in srgb, white 7%, transparent)' }}
    >
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--kc-5a5a5a)' }}>{label}</p>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-center text-3xl font-bold text-white bg-transparent border-0 focus:outline-none placeholder-white/15"
        style={{ minWidth: 0 }}
        onFocus={e => { e.target.closest('div').style.border = '1.5px solid color-mix(in srgb, var(--tc-primary) 45%, transparent)'; }}
        onBlur={e => { e.target.closest('div').style.border = '1.5px solid color-mix(in srgb, white 7%, transparent)'; }}
      />
      {unit && <p className="text-xs" style={{ color: 'var(--kc-5a5a5a)' }}>{unit}</p>}
    </motion.div>
  );
}

const ACTIVITY = [
  { id: 'sedentary',  label: '🪑 Sedentary' },
  { id: 'light',      label: '🚶 Light' },
  { id: 'moderate',   label: '🏃 Moderate' },
  { id: 'very',       label: '⚡ Very Active' },
  { id: 'athlete',    label: '🏅 Athlete' },
];

export default function ClientMetricsScreen({ onNext, onBack, data }) {
  const [form, setForm] = useState({
    age: data.age || '',
    height: data.height || '',
    weight: data.weight || data.current_weight || '',
    goal_weight: data.goal_weight || '',
    activity_level: data.activity_level || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isValid = form.age && form.height && form.weight;

  return (
    <OnboardingLayout
      eyebrow="Body Stats"
      headline="Tell us about yourself."
      subtext="Used to calculate your personalized targets."
      onBack={onBack}
      onNext={() => onNext({ ...form, current_weight: form.weight })}
      nextDisabled={!isValid}
    >
      <div className="space-y-8">
        {/* Core metrics */}
        <div className="flex gap-3">
          <MetricBox label="Age" value={form.age} onChange={v => set('age', v)} unit="years" placeholder="25" />
          <MetricBox label="Weight" value={form.weight} onChange={v => set('weight', v)} unit="lbs" placeholder="175" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--kc-5a5a5a)' }}>Height</p>
          <input
            type="text"
            value={form.height}
            onChange={e => set('height', e.target.value)}
            placeholder={`5'10"`}
            className="w-full px-5 py-4 rounded-2xl text-white text-lg font-semibold bg-transparent focus:outline-none transition-all text-center placeholder-white/15"
            style={{ background: 'color-mix(in srgb, white 3%, transparent)', border: '1.5px solid color-mix(in srgb, white 7%, transparent)' }}
            onFocus={e => { e.target.style.border = '1.5px solid color-mix(in srgb, var(--tc-primary) 45%, transparent)'; }}
            onBlur={e => { e.target.style.border = '1.5px solid color-mix(in srgb, white 7%, transparent)'; }}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--kc-b3b3b3)' }}>Current activity level</p>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY.map(a => (
              <motion.button key={a.id} whileTap={{ scale: 0.95 }}
                onClick={() => set('activity_level', a.id)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: form.activity_level === a.id ? 'color-mix(in srgb, var(--tc-primary) 12%, transparent)' : 'color-mix(in srgb, white 4%, transparent)',
                  border: form.activity_level === a.id ? '1px solid color-mix(in srgb, var(--tc-primary) 50%, transparent)' : '1px solid color-mix(in srgb, white 7%, transparent)',
                  color: form.activity_level === a.id ? 'var(--tc-card)' : 'var(--kc-7a7a7a)',
                  boxShadow: form.activity_level === a.id ? '0 0 16px color-mix(in srgb, var(--tc-primary) 15%, transparent)' : 'none',
                }}>{a.label}</motion.button>
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}