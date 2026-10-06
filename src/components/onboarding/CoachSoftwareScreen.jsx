import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { SelectionCard } from './SelectionCard';

const SOFTWARE = [
  { id: 'trainerize',   label: 'Trainerize' },
  { id: 'everfit',      label: 'Everfit' },
  { id: 'trucoach',     label: 'TrueCoach' },
  { id: 'sheets',       label: 'Google Sheets' },
  { id: 'notion',       label: 'Notion' },
  { id: 'mfp',          label: 'MyFitnessPal' },
  { id: 'spreadsheets', label: 'My own spreadsheets' },
  { id: 'none',         label: 'Nothing yet' },
];

export default function CoachSoftwareScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.current_software || []);

  const toggle = (id) => {
    if (id === 'none') { setSelected(['none']); return; }
    setSelected(s => {
      const without = s.filter(x => x !== 'none');
      return without.includes(id) ? without.filter(x => x !== id) : [...without, id];
    });
  };

  return (
    <OnboardingLayout
      eyebrow="Moving over"
      headline="What do you use today?"
      subtext="We import your clients and programs from it, so you don't start from zero."
      onBack={onBack}
      onNext={() => onNext({ current_software: selected })}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SOFTWARE.map(s => (
          <SelectionCard key={s.id} size="sm" label={s.label} selected={selected.includes(s.id)} onClick={() => toggle(s.id)} />
        ))}
      </div>
    </OnboardingLayout>
  );
}
