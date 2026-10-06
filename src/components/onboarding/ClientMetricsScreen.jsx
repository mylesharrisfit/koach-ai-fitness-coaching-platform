import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect, NumberTile, QuestionLabel, onboardingFieldCls } from './SelectionCard';

const ACTIVITY = [
  { id: 'sedentary',  label: 'Mostly sitting' },
  { id: 'light',      label: 'Light' },
  { id: 'moderate',   label: 'Moderate' },
  { id: 'very',       label: 'Very active' },
  { id: 'athlete',    label: 'Athlete' },
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
      eyebrow="Your numbers"
      headline="Your starting numbers."
      subtext="Used to set your calories and training targets. Rough is fine."
      onBack={onBack}
      onNext={() => onNext({ ...form, current_weight: form.weight })}
      nextDisabled={!isValid}
    >
      <div className="space-y-6">
        <div className="flex gap-3">
          <NumberTile label="Age" value={form.age} onChange={v => set('age', v)} unit="years" placeholder="25" />
          <NumberTile label="Weight" value={form.weight} onChange={v => set('weight', v)} unit="lb" placeholder="175" />
        </div>

        <label className="block space-y-2">
          <QuestionLabel>Height</QuestionLabel>
          <input
            type="text"
            value={form.height}
            onChange={e => set('height', e.target.value)}
            placeholder={`5'10"`}
            className={`${onboardingFieldCls} h-12`}
          />
        </label>

        <div className="space-y-3">
          <QuestionLabel>Activity level today</QuestionLabel>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY.map(a => (
              <ChipSelect key={a.id} label={a.label} selected={form.activity_level === a.id} onClick={() => set('activity_level', a.id)} />
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
