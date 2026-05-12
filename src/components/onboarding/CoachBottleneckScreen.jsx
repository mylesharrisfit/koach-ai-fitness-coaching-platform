import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const BOTTLENECKS = [
  { id: 'client_mgmt', label: '🗂️ Client Management' },
  { id: 'checkins', label: '📋 Check-ins' },
  { id: 'meal_plans', label: '🥗 Meal Plans' },
  { id: 'programming', label: '📝 Programming' },
  { id: 'leads', label: '🎯 Lead Generation' },
  { id: 'retention', label: '🔒 Retention' },
  { id: 'scaling', label: '📈 Scaling' },
];

export default function CoachBottleneckScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.bottlenecks || []);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Pain Points"
      headline="What's your biggest bottleneck?"
      subtext="We'll prioritize solving these in your coaching system setup."
      onBack={onBack}
      onNext={() => onNext({ bottlenecks: selected })}
      nextDisabled={selected.length === 0}
    >
      <div className="flex flex-wrap gap-2.5">
        {BOTTLENECKS.map(b => (
          <ChipSelect key={b.id} label={b.label} selected={selected.includes(b.id)} onClick={() => toggle(b.id)} />
        ))}
      </div>
    </OnboardingLayout>
  );
}