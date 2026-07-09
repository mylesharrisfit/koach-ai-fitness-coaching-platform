import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';

function MetricBox({ label, value, onChange, unit, placeholder }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2 flex-1 p-5 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.07)' }}
    >
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#5A5A5A' }}>{label}</p>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-center text-3xl font-bold text-white bg-transparent border-0 focus:outline-none placeholder-white/15"
        style={{ minWidth: 0 }}
        onFocus={e => { e.target.closest('div').style.border = '1.5px solid rgba(59,130,246,0.45)'; }}
        onBlur={e => { e.target.closest('div').style.border = '1.5px solid rgba(255,255,255,0.07)'; }}
      />
      {unit && <p className="text-xs" style={{ color: '#5A5A5A' }}>{unit}</p>}
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
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#5A5A5A' }}>Height</p>
          <input
            type="text"
            value={form.height}
            onChange={e => set('height', e.target.value)}
            placeholder={`5'10"`}
            className="w-full px-5 py-4 rounded-2xl text-white text-lg font-semibold bg-transparent focus:outline-none transition-all text-center placeholder-white/15"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.07)' }}
            onFocus={e => { e.target.style.border = '1.5px solid rgba(59,130,246,0.45)'; }}
            onBlur={e => { e.target.style.border = '1.5px solid rgba(255,255,255,0.07)'; }}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>Current activity level</p>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY.map(a => (
              <motion.button key={a.id} whileTap={{ scale: 0.95 }}
                onClick={() => set('activity_level', a.id)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: form.activity_level === a.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                  border: form.activity_level === a.id ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.07)',
                  color: form.activity_level === a.id ? 'rgb(var(--card))' : '#7A7A7A',
                  boxShadow: form.activity_level === a.id ? '0 0 16px rgba(59,130,246,0.15)' : 'none',
                }}>{a.label}</motion.button>
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}