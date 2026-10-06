import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { SelectionCard } from './SelectionCard';

const FEATURES = [
  { id: 'ai_meals',      label: 'Meal plans' },
  { id: 'ai_workouts',   label: 'Workout programs' },
  { id: 'checkins',      label: 'Weekly check-ins' },
  { id: 'progress',      label: 'Progress tracking' },
  { id: 'habits',        label: 'Habit tracking' },
  { id: 'automations',   label: 'Reminders and follow-ups' },
  { id: 'analytics',     label: 'Business numbers' },
  { id: 'messaging',     label: 'Client messaging' },
  { id: 'payments',      label: 'Payments' },
  { id: 'team',          label: 'A coaching team' },
];

export default function CoachTypeScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.wanted_features || []);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Your setup"
      headline="What should KOACH handle for you?"
      subtext="Pick everything you want switched on. You can change this later."
      onBack={onBack}
      onNext={() => onNext({ wanted_features: selected })}
      nextDisabled={selected.length === 0}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {FEATURES.map(f => (
          <SelectionCard key={f.id} size="sm" label={f.label} selected={selected.includes(f.id)} onClick={() => toggle(f.id)} />
        ))}
      </div>
    </OnboardingLayout>
  );
}
