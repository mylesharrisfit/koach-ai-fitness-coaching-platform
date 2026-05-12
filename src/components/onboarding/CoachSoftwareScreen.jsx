import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const SOFTWARE = [
  { id: 'everfit', label: 'Everfit' },
  { id: 'trainerize', label: 'Trainerize' },
  { id: 'mfp', label: 'MyFitnessPal' },
  { id: 'sheets', label: 'Google Sheets' },
  { id: 'notion', label: 'Notion' },
  { id: 'none', label: 'Nothing yet' },
  { id: 'other', label: 'Other' },
];

export default function CoachSoftwareScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.current_software || []);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Migration"
      headline="What software are you currently using?"
      subtext="We'll help you migrate your data and workflows seamlessly."
      onBack={onBack}
      onNext={() => onNext({ current_software: selected })}
      nextLabel="Build My System →"
    >
      <div className="flex flex-wrap gap-2.5">
        {SOFTWARE.map(s => (
          <ChipSelect key={s.id} label={s.label} selected={selected.includes(s.id)} onClick={() => toggle(s.id)} />
        ))}
      </div>
    </OnboardingLayout>
  );
}