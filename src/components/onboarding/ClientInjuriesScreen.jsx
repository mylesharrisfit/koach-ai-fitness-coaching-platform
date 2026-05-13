import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const INJURIES = [
  { id: 'lower_back', label: '🔴 Lower Back Pain' },
  { id: 'knee', label: '🔴 Knee Pain' },
  { id: 'shoulder', label: '🔴 Shoulder Pain' },
  { id: 'hip', label: '🔴 Hip Pain' },
  { id: 'neck', label: '🔴 Neck Pain' },
  { id: 'elbow_wrist', label: '🔴 Elbow / Wrist' },
  { id: 'ankle', label: '🔴 Ankle Issues' },
  { id: 'mobility', label: '🟡 Mobility Limitations' },
  { id: 'surgery', label: '🟡 Previous Surgeries' },
  { id: 'none', label: '✅ None' },
];

export default function ClientInjuriesScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.injuries || []);
  const [notes, setNotes] = useState(data.injury_notes || '');

  const toggle = (id) => {
    if (id === 'none') {
      setSelected(['none']);
      return;
    }
    setSelected(s => {
      const without_none = s.filter(x => x !== 'none');
      return without_none.includes(id) ? without_none.filter(x => x !== id) : [...without_none, id];
    });
  };

  return (
    <OnboardingLayout
      eyebrow="Injuries & Limitations"
      headline="Any injuries or physical limitations?"
      subtext="This is critical. We'll modify exercises to keep you safe and progressing."
      onBack={onBack}
      onNext={() => onNext({ injuries: selected, injury_notes: notes })}
      nextDisabled={selected.length === 0}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2.5">
          {INJURIES.map(i => (
            <ChipSelect key={i.id} label={i.label} selected={selected.includes(i.id)} onClick={() => toggle(i.id)} />
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>Anything else we should know?</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Describe any injuries, surgeries, or pain points in detail..."
            rows={4}
            className="w-full px-4 py-4 rounded-2xl text-white text-sm leading-relaxed resize-none focus:outline-none transition-all"
            style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}
            onFocus={e => { e.target.style.border = '1px solid rgba(59,130,246,0.45)'; }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.06)'; }}
          />
        </div>
      </div>
    </OnboardingLayout>
  );
}