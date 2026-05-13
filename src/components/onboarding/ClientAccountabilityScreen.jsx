import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const OPTIONS = [
  { id: 'weekly_checkins', label: '📋 Weekly Check-Ins' },
  { id: 'daily_habits', label: '✅ Daily Habits' },
  { id: 'ai_reminders', label: '🤖 AI Reminders' },
  { id: 'coach_messages', label: '💬 Coach Messaging' },
  { id: 'progress_tracking', label: '📈 Progress Tracking' },
  { id: 'community', label: '👥 Community' },
];

export default function ClientAccountabilityScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.accountability_prefs || []);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Accountability"
      headline="How do you prefer accountability?"
      subtext="We'll set up your check-in system based on what works best for you."
      onBack={onBack}
      onNext={() => onNext({ accountability_prefs: selected })}
      nextDisabled={selected.length === 0}
      nextLabel="Build My System →"
    >
      <div className="flex flex-wrap gap-2.5">
        {OPTIONS.map(o => (
          <ChipSelect key={o.id} label={o.label} selected={selected.includes(o.id)} onClick={() => toggle(o.id)} />
        ))}
      </div>
    </OnboardingLayout>
  );
}