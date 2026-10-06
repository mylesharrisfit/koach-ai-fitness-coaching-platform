import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { QuestionLabel, SegmentRow } from './SelectionCard';

function PickRow({ label, options, value, onChange }) {
  return (
    <div className="space-y-2.5">
      <QuestionLabel>{label}</QuestionLabel>
      <SegmentRow options={options} value={value} onChange={onChange} />
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
      eyebrow="Lifestyle"
      headline="What does a normal week look like?"
      subtext="Sleep and stress change how much training you can recover from."
      onBack={onBack}
      onNext={() => onNext(form)}
      nextDisabled={!isValid}
    >
      <div className="space-y-6">
        <PickRow
          label="Sleep"
          options={[{ id: 'poor', label: 'Poor' }, { id: 'average', label: 'Average' }, { id: 'good', label: 'Good' }]}
          value={form.sleep_quality}
          onChange={v => set('sleep_quality', v)}
        />
        <PickRow
          label="Stress"
          options={[{ id: 'low', label: 'Low' }, { id: 'moderate', label: 'Moderate' }, { id: 'high', label: 'High' }]}
          value={form.stress_level}
          onChange={v => set('stress_level', v)}
        />
        <PickRow
          label="Activity outside the gym"
          options={[{ id: 'low', label: 'Mostly sitting' }, { id: 'moderate', label: 'Active' }, { id: 'high', label: 'Very active' }]}
          value={form.activity_outside_gym}
          onChange={v => set('activity_outside_gym', v)}
        />
        <PickRow
          label="Water"
          options={[{ id: 'poor', label: 'Too little' }, { id: 'average', label: 'Some' }, { id: 'good', label: 'Plenty' }]}
          value={form.water_intake}
          onChange={v => set('water_intake', v)}
        />
      </div>
    </OnboardingLayout>
  );
}
