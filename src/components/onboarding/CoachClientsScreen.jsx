import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { SelectionCard } from './SelectionCard';

const OPTIONS = [
  { id: '1-10',   label: '1 to 10',   sub: 'A small, hands-on practice' },
  { id: '10-25',  label: '10 to 25',  sub: 'Growing, and starting to need systems' },
  { id: '25-50',  label: '25 to 50',  sub: 'Busy. Check-ins eat your evenings' },
  { id: '50-100', label: '50 to 100', sub: 'High volume, probably with help' },
  { id: '100+',   label: 'More than 100', sub: 'A team, or about to need one' },
];

export default function CoachClientsScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.client_count || null);

  return (
    <OnboardingLayout
      eyebrow="Your clients"
      headline="How many clients do you coach today?"
      subtext="Used to size your plan and your Today page."
      onBack={onBack}
      onNext={() => onNext({ client_count: selected })}
      nextDisabled={!selected}
    >
      <div className="space-y-2">
        {OPTIONS.map(o => (
          <SelectionCard key={o.id} label={o.label} description={o.sub} selected={selected === o.id} onClick={() => setSelected(o.id)} />
        ))}
      </div>
    </OnboardingLayout>
  );
}
