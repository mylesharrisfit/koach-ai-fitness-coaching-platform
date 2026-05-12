import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const ACTIVITY = [
  { id: 'sedentary', label: '🪑 Sedentary' },
  { id: 'light', label: '🚶 Lightly Active' },
  { id: 'moderate', label: '🏃 Moderately Active' },
  { id: 'very', label: '⚡ Very Active' },
  { id: 'athlete', label: '🏅 Athlete' },
];

function MetricInput({ label, value, onChange, placeholder, unit, type = 'number' }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7A7A7A' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 rounded-xl text-white text-base font-medium placeholder-opacity-30 focus:outline-none transition-all"
          style={{
            background: '#161616',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#fff',
          }}
          onFocus={e => { e.target.style.border = '1px solid rgba(59,130,246,0.45)'; }}
          onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.06)'; }}
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: '#7A7A7A' }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ClientMetricsScreen({ onNext, onBack, data }) {
  const [form, setForm] = useState({
    age: data.age || '',
    height: data.height || '',
    weight: data.weight || '',
    goal_weight: data.goal_weight || '',
    activity_level: data.activity_level || '',
    body_fat: data.body_fat || '',
    injuries: data.injuries || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isValid = form.age && form.height && form.weight;

  return (
    <OnboardingLayout
      eyebrow="Body Metrics"
      headline="Tell us about yourself."
      subtext="Used to calculate your targets and build your personal plan."
      onBack={onBack}
      onNext={() => onNext(form)}
      nextDisabled={!isValid}
    >
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-3">
          <MetricInput label="Age" value={form.age} onChange={v => set('age', v)} placeholder="25" unit="yrs" />
          <MetricInput label="Height" value={form.height} onChange={v => set('height', v)} placeholder="5ft 10in" unit="in" type="text" />
          <MetricInput label="Current Weight" value={form.weight} onChange={v => set('weight', v)} placeholder="185" unit="lbs" />
          <MetricInput label="Goal Weight" value={form.goal_weight} onChange={v => set('goal_weight', v)} placeholder="175" unit="lbs" />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7A7A7A' }}>Activity Level</label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY.map(a => (
              <ChipSelect
                key={a.id}
                label={a.label}
                selected={form.activity_level === a.id}
                onClick={() => set('activity_level', a.id)}
              />
            ))}
          </div>
        </div>

        {/* Optional fields */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#3A3A3A' }}>Optional</p>
          <div className="grid grid-cols-2 gap-3">
            <MetricInput label="Body Fat %" value={form.body_fat} onChange={v => set('body_fat', v)} placeholder="18" unit="%" />
            <div className="col-span-2">
              <MetricInput label="Injuries / Limitations" value={form.injuries} onChange={v => set('injuries', v)} placeholder="None" unit="" type="text" />
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}