import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const OPTIONS = [
  { id: 'weekly_checkins', label: 'Weekly check-ins' },
  { id: 'daily_habits', label: 'Daily habits' },
  { id: 'ai_reminders', label: 'Reminders' },
  { id: 'coach_messages', label: 'Messages from my coach' },
  { id: 'progress_tracking', label: 'Progress tracking' },
  { id: 'community', label: 'Community' },
];

export default function ClientAccountabilityScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.accountability_prefs || []);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Accountability"
      headline="What keeps you on track?"
      subtext="Your check-ins are set up around what you pick."
      onBack={onBack}
      onNext={() => onNext({ accountability_prefs: selected })}
      nextDisabled={selected.length === 0}
      nextLabel="Next"
    >
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(o => (
          <ChipSelect key={o.id} label={o.label} selected={selected.includes(o.id)} onClick={() => toggle(o.id)} />
        ))}
      </div>
    </OnboardingLayout>
  );
}
