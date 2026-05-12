import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const STYLES = [
  { id: 'gym', label: '🏋️ Gym' },
  { id: 'running', label: '🏃 Running' },
  { id: 'hybrid', label: '⚡ Hybrid' },
  { id: 'functional', label: '🔄 Functional Fitness' },
  { id: 'bodybuilding', label: '💪 Bodybuilding' },
  { id: 'strength', label: '🏆 Strength Training' },
  { id: 'home', label: '🏠 Home Workouts' },
];

export default function ClientTrainingStyleScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.training_styles || []);

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Training"
      headline="How do you like to train?"
      subtext="Select your preferred training environments and styles."
      onBack={onBack}
      onNext={() => onNext({ training_styles: selected })}
      nextDisabled={selected.length === 0}
    >
      <div className="flex flex-wrap gap-2.5">
        {STYLES.map(s => (
          <ChipSelect key={s.id} label={s.label} selected={selected.includes(s.id)} onClick={() => toggle(s.id)} />
        ))}
      </div>
    </OnboardingLayout>
  );
}