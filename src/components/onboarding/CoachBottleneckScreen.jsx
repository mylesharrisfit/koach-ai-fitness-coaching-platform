import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { SelectionCard } from './SelectionCard';

const BOTTLENECKS = [
  { id: 'checkins',    label: 'Check-ins' },
  { id: 'programming', label: 'Writing programs' },
  { id: 'nutrition',   label: 'Nutrition plans' },
  { id: 'client_mgmt', label: 'Keeping track of clients' },
  { id: 'leads',       label: 'Finding new clients' },
  { id: 'accountability', label: 'Keeping clients accountable' },
  { id: 'retention',   label: 'Keeping clients longer' },
  { id: 'scaling',     label: 'Taking on more clients' },
  { id: 'time',        label: 'Not enough hours' },
];

export default function CoachBottleneckScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.bottlenecks || []);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Where time goes"
      headline="What takes up most of your week?"
      subtext="Pick everything that applies. We set these up first."
      onBack={onBack}
      onNext={() => onNext({ bottlenecks: selected })}
      nextDisabled={selected.length === 0}
    >
      <div className="space-y-2">
        {BOTTLENECKS.map(b => (
          <SelectionCard key={b.id} size="sm" label={b.label} selected={selected.includes(b.id)} onClick={() => toggle(b.id)} />
        ))}
      </div>
    </OnboardingLayout>
  );
}
