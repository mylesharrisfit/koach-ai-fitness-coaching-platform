import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const GOALS = [
  { id: 'fat_loss', label: '🔥 Lose Fat' },
  { id: 'muscle', label: '💪 Build Muscle' },
  { id: 'hybrid', label: '⚡ Hybrid Performance' },
  { id: 'strength', label: '🏋️ Strength' },
  { id: 'endurance', label: '🏃 Endurance' },
  { id: 'health', label: '🩺 General Health' },
  { id: 'athletic', label: '🏅 Athleticism' },
];

export default function ClientGoalScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.goals || []);

  const toggle = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  return (
    <OnboardingLayout
      eyebrow="Goals"
      headline="What's your primary goal?"
      subtext="Select all that apply — we'll personalize your plan around these."
      onBack={onBack}
      onNext={() => onNext({ goals: selected })}
      nextDisabled={selected.length === 0}
    >
      <div className="flex flex-wrap gap-2.5">
        {GOALS.map(g => (
          <ChipSelect
            key={g.id}
            label={g.label}
            selected={selected.includes(g.id)}
            onClick={() => toggle(g.id)}
          />
        ))}
      </div>
    </OnboardingLayout>
  );
}