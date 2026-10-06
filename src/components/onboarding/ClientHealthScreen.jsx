import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect, QuestionLabel, onboardingFieldCls } from './SelectionCard';

const CONDITIONS = [
  { id: 'blood_pressure', label: 'High blood pressure' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'hormonal', label: 'Hormonal issues' },
  { id: 'digestive', label: 'Digestive issues' },
  { id: 'asthma', label: 'Asthma' },
  { id: 'heart', label: 'Heart concerns' },
  { id: 'anxiety', label: 'Anxiety or stress' },
  { id: 'none', label: 'None' },
];

export default function ClientHealthScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.health_conditions || []);
  const [notes, setNotes] = useState(data.health_notes || '');

  const toggle = (id) => {
    if (id === 'none') { setSelected(['none']); return; }
    setSelected(s => {
      const without_none = s.filter(x => x !== 'none');
      return without_none.includes(id) ? without_none.filter(x => x !== id) : [...without_none, id];
    });
  };

  return (
    <OnboardingLayout
      eyebrow="Health"
      headline="Any medical conditions?"
      subtext="Only your coach sees this. It keeps your plan safe."
      onBack={onBack}
      onNext={() => onNext({ health_conditions: selected, health_notes: notes })}
      nextDisabled={selected.length === 0}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(c => (
            <ChipSelect key={c.id} label={c.label} selected={selected.includes(c.id)} onClick={() => toggle(c.id)} />
          ))}
        </div>
        <label className="block space-y-2">
          <QuestionLabel>Anything else your coach should know? (optional)</QuestionLabel>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Medical history, medications, concerns"
            rows={4}
            className={`${onboardingFieldCls} resize-none py-3 leading-relaxed`}
          />
        </label>
      </div>
    </OnboardingLayout>
  );
}
