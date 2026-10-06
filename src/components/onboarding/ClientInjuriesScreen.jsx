import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect, QuestionLabel, onboardingFieldCls } from './SelectionCard';

const INJURIES = [
  { id: 'lower_back',  label: 'Lower back' },
  { id: 'knee',        label: 'Knees' },
  { id: 'shoulder',    label: 'Shoulders' },
  { id: 'hip',         label: 'Hips' },
  { id: 'ankle',       label: 'Ankles' },
  { id: 'neck',        label: 'Neck' },
  { id: 'elbow_wrist', label: 'Wrists or elbows' },
  { id: 'mobility',    label: 'Mobility issues' },
  { id: 'surgery',     label: 'Previous surgery' },
  { id: 'none',        label: 'No injuries' },
];

export default function ClientInjuriesScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.injuries || []);
  const [notes, setNotes] = useState(data.injury_notes || '');

  const toggle = (id) => {
    if (id === 'none') { setSelected(['none']); return; }
    setSelected(s => {
      const without_none = s.filter(x => x !== 'none');
      return without_none.includes(id)
        ? without_none.filter(x => x !== id)
        : [...without_none, id];
    });
  };

  return (
    <OnboardingLayout
      eyebrow="Injuries"
      headline="Anything that hurts or limits you?"
      subtext="Exercises get swapped around anything you pick."
      onBack={onBack}
      onNext={() => onNext({ injuries: selected, injury_notes: notes })}
      nextDisabled={selected.length === 0}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {INJURIES.map(inj => (
            <ChipSelect key={inj.id} label={inj.label} selected={selected.includes(inj.id)} onClick={() => toggle(inj.id)} />
          ))}
        </div>
        <label className="block space-y-2">
          <QuestionLabel>Tell your coach more (optional)</QuestionLabel>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Where it hurts, how much, and what makes it worse"
            rows={4}
            className={`${onboardingFieldCls} resize-none py-3 leading-relaxed`}
          />
        </label>
      </div>
    </OnboardingLayout>
  );
}
