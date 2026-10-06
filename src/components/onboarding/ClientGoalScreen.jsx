import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { SelectionCard } from './SelectionCard';

const GOALS = [
  { id: 'fat_loss',  label: 'Lose fat',            sublabel: 'Get leaner and lighter' },
  { id: 'muscle',    label: 'Build muscle',        sublabel: 'Add size and strength' },
  { id: 'hybrid',    label: 'Lose fat and build muscle', sublabel: 'Recomposition' },
  { id: 'strength',  label: 'Get stronger',        sublabel: 'Lift heavier weights' },
  { id: 'endurance', label: 'Endurance',           sublabel: 'Cardio, stamina and conditioning' },
  { id: 'athletic',  label: 'Athleticism',         sublabel: 'Speed, agility and sport performance' },
  { id: 'health',    label: 'General health',      sublabel: 'Feel better day to day' },
  { id: 'lifestyle', label: 'A full reset',        sublabel: 'New habits from the ground up' },
];

export default function ClientGoalScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.goals?.length ? data.goals[0] : (data.goal || null));

  return (
    <OnboardingLayout
      eyebrow="Goals"
      headline="What's your main goal?"
      subtext="Your plan is built around this one."
      onBack={onBack}
      onNext={() => onNext({ goals: [selected], goal: selected })}
      nextDisabled={!selected}
    >
      <div className="space-y-2">
        {GOALS.map(g => (
          <SelectionCard key={g.id} label={g.label} description={g.sublabel} selected={selected === g.id} onClick={() => setSelected(g.id)} />
        ))}
      </div>
    </OnboardingLayout>
  );
}
