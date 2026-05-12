import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { SelectionCard } from './SelectionCard';
import { Users } from 'lucide-react';

const OPTIONS = [
  { id: '1-10', label: '1–10 clients', description: 'Just getting started or running a boutique coaching practice.' },
  { id: '10-25', label: '10–25 clients', description: 'Growing steadily. Efficiency is becoming critical.' },
  { id: '25-50', label: '25–50 clients', description: 'Scaling your business. Systems need to be airtight.' },
  { id: '50+', label: '50+ clients', description: 'High-volume operation. You need elite-grade automation.' },
];

export default function CoachClientsScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.client_count || null);

  return (
    <OnboardingLayout
      eyebrow="Your Business"
      headline="How many clients do you currently coach?"
      onBack={onBack}
      onNext={() => onNext({ client_count: selected })}
      nextDisabled={!selected}
    >
      <div className="space-y-2.5">
        {OPTIONS.map(o => (
          <SelectionCard
            key={o.id}
            icon={Users}
            label={o.label}
            description={o.description}
            selected={selected === o.id}
            onClick={() => setSelected(o.id)}
          />
        ))}
      </div>
    </OnboardingLayout>
  );
}