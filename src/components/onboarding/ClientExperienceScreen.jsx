import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { SelectionCard, ChipSelect } from './SelectionCard';
import { Sprout, Flame, Zap } from 'lucide-react';

const LEVELS = [
  { id: 'beginner', icon: Sprout, label: 'Beginner', description: 'New to structured training. Building foundational habits.' },
  { id: 'intermediate', icon: Flame, label: 'Intermediate', description: '1–3 years of consistent training. Ready to optimize.' },
  { id: 'advanced', icon: Zap, label: 'Advanced', description: '3+ years of serious training. Focused on precision.' },
];

const DURATIONS = [
  { id: 'never', label: 'Never' },
  { id: 'under1', label: '< 1 year' },
  { id: '1to3', label: '1–3 years' },
  { id: '3to5', label: '3–5 years' },
  { id: '5plus', label: '5+ years' },
];

export default function ClientExperienceScreen({ onNext, onBack, data }) {
  const [level, setLevel] = useState(data.experience || null);
  const [duration, setDuration] = useState(data.training_duration || null);

  return (
    <OnboardingLayout
      eyebrow="Experience"
      headline="What's your fitness experience?"
      subtext="We'll calibrate intensity and program complexity to match your level."
      onBack={onBack}
      onNext={() => onNext({ experience: level, training_duration: duration })}
      nextDisabled={!level}
    >
      <div className="space-y-8">
        <div className="space-y-3">
          {LEVELS.map(l => (
            <SelectionCard key={l.id} icon={l.icon} label={l.label} description={l.description}
              selected={level === l.id} onClick={() => setLevel(l.id)} />
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>How long have you trained consistently?</p>
          <div className="flex flex-wrap gap-2.5">
            {DURATIONS.map(d => (
              <ChipSelect key={d.id} label={d.label} selected={duration === d.id} onClick={() => setDuration(d.id)} />
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}