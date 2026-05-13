import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const OBSTACLES = [
  { id: 'consistency', label: '🔄 Consistency' },
  { id: 'motivation', label: '🔋 Motivation' },
  { id: 'time', label: '⏱️ Time' },
  { id: 'nutrition', label: '🍽️ Nutrition' },
  { id: 'gym_anxiety', label: '😰 Gym Anxiety' },
  { id: 'recovery', label: '😴 Recovery' },
  { id: 'stress', label: '🧠 Stress' },
  { id: 'travel', label: '✈️ Travel' },
  { id: 'discipline', label: '💪 Discipline' },
  { id: 'structure', label: '📋 Lack of Structure' },
];

export default function ClientObstaclesScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.obstacles || []);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Mindset"
      headline="What usually holds you back?"
      subtext="Knowing your obstacles helps us build a system that anticipates them."
      onBack={onBack}
      onNext={() => onNext({ obstacles: selected })}
      nextDisabled={selected.length === 0}
    >
      <div className="flex flex-wrap gap-2.5">
        {OBSTACLES.map(o => (
          <ChipSelect key={o.id} label={o.label} selected={selected.includes(o.id)} onClick={() => toggle(o.id)} />
        ))}
      </div>
    </OnboardingLayout>
  );
}