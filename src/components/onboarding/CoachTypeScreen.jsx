import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const TYPES = [
  { id: 'online', label: '💻 Online Coaching' },
  { id: 'in_person', label: '🏋️ In-Person Training' },
  { id: 'hybrid', label: '⚡ Hybrid Coaching' },
  { id: 'group', label: '👥 Group Coaching' },
  { id: 'lifestyle', label: '🌿 Lifestyle Coaching' },
];

export default function CoachTypeScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.coaching_types || []);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Coaching Style"
      headline="What type of coaching do you do?"
      onBack={onBack}
      onNext={() => onNext({ coaching_types: selected })}
      nextDisabled={selected.length === 0}
    >
      <div className="flex flex-wrap gap-2.5">
        {TYPES.map(t => (
          <ChipSelect key={t.id} label={t.label} selected={selected.includes(t.id)} onClick={() => toggle(t.id)} />
        ))}
      </div>
    </OnboardingLayout>
  );
}