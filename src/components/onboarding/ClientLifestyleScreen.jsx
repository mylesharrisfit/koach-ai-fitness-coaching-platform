import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';

function PickRow({ label, options, value, onChange }) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>{label}</p>
      <div className="flex gap-2.5">
        {options.map(o => (
          <motion.button
            key={o.id}
            onClick={() => onChange(o.id)}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-3.5 rounded-2xl text-sm font-medium transition-all"
            style={{
              background: value === o.id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
              border: value === o.id ? '1.5px solid rgba(59,130,246,0.5)' : '1.5px solid rgba(255,255,255,0.07)',
              color: value === o.id ? '#fff' : '#7A7A7A',
              boxShadow: value === o.id ? '0 0 20px rgba(59,130,246,0.12)' : 'none',
            }}
          >{o.label}</motion.button>
        ))}
      </div>
    </div>
  );
}

export default function ClientLifestyleScreen({ onNext, onBack, data }) {
  const [form, setForm] = useState({
    sleep_quality: data.sleep_quality || '',
    stress_level: data.stress_level || '',
    activity_outside_gym: data.activity_outside_gym || '',
    water_intake: data.water_intake || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isValid = form.sleep_quality && form.stress_level && form.activity_outside_gym;

  return (
    <OnboardingLayout
      eyebrow="Lifestyle & Recovery"
      headline="How's your lifestyle?"
      subtext="Recovery is half the equation. Help us understand your baseline."
      onBack={onBack}
      onNext={() => onNext(form)}
      nextDisabled={!isValid}
    >
      <div className="space-y-7">
        <PickRow
          label="Sleep quality"
          options={[{ id: 'poor', label: '😴 Poor' }, { id: 'average', label: '😐 Average' }, { id: 'good', label: '😊 Good' }]}
          value={form.sleep_quality}
          onChange={v => set('sleep_quality', v)}
        />
        <PickRow
          label="Stress level"
          options={[{ id: 'low', label: '😌 Low' }, { id: 'moderate', label: '😤 Moderate' }, { id: 'high', label: '🔥 High' }]}
          value={form.stress_level}
          onChange={v => set('stress_level', v)}
        />
        <PickRow
          label="Daily activity outside gym"
          options={[{ id: 'low', label: '🪑 Sedentary' }, { id: 'moderate', label: '🚶 Active' }, { id: 'high', label: '⚡ Very Active' }]}
          value={form.activity_outside_gym}
          onChange={v => set('activity_outside_gym', v)}
        />
        <PickRow
          label="Water intake"
          options={[{ id: 'poor', label: '💧 Poor' }, { id: 'average', label: '💦 Average' }, { id: 'good', label: '🌊 Good' }]}
          value={form.water_intake}
          onChange={v => set('water_intake', v)}
        />
      </div>
    </OnboardingLayout>
  );
}