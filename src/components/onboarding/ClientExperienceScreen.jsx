import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { SelectionCard } from './SelectionCard';
import { Sprout, Flame, Zap } from 'lucide-react';

const LEVELS = [
  { id: 'beginner', icon: Sprout, label: 'Beginner', description: 'New to structured training. Building foundational habits and movement patterns.' },
  { id: 'intermediate', icon: Flame, label: 'Intermediate', description: '1–3 years of consistent training. Ready to optimize and push harder.' },
  { id: 'advanced', icon: Zap, label: 'Advanced', description: '3+ years of serious training. Focused on elite performance and precision.' },
];

export default function ClientExperienceScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.experience || null);

  return (
    <OnboardingLayout
      eyebrow="Experience"
      headline="What's your experience level?"
      subtext="We'll calibrate the intensity and complexity of your plan accordingly."
      onBack={onBack}
      onNext={() => onNext({ experience: selected })}
      nextDisabled={!selected}
    >
      <div className="space-y-3">
        {LEVELS.map(l => (
          <SelectionCard
            key={l.id}
            icon={l.icon}
            label={l.label}
            description={l.description}
            selected={selected === l.id}
            onClick={() => setSelected(l.id)}
          />
        ))}
      </div>
    </OnboardingLayout>
  );
}