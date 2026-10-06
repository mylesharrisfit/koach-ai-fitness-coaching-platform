import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { SelectionCard, QuestionLabel, SegmentRow } from './SelectionCard';

const LEVELS = [
  { id: 'beginner', label: 'Beginner', description: 'New to structured training.' },
  { id: 'intermediate', label: 'Intermediate', description: '1 to 3 years of regular training.' },
  { id: 'advanced', label: 'Advanced', description: '3+ years of serious training.' },
];

const DAYS = [2, 3, 4, 5, 6];

export default function ClientExperienceScreen({ onNext, onBack, data }) {
  const [level, setLevel] = useState(data.experience || null);
  const [days, setDays] = useState(data.training_days_per_week || null);

  return (
    <OnboardingLayout
      eyebrow="Experience"
      headline="How much have you trained?"
      subtext="Sets how hard and how complex your program starts."
      onBack={onBack}
      onNext={() => onNext({ experience: level, training_days_per_week: days })}
      nextDisabled={!level}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          {LEVELS.map(l => (
            <SelectionCard key={l.id} label={l.label} description={l.description} selected={level === l.id} onClick={() => setLevel(l.id)} />
          ))}
        </div>
        <div className="space-y-3">
          <QuestionLabel>Days a week you can train</QuestionLabel>
          <SegmentRow options={DAYS} value={days} onChange={setDays} />
        </div>
      </div>
    </OnboardingLayout>
  );
}
