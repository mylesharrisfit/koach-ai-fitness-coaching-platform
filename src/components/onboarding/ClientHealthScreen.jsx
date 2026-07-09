import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const CONDITIONS = [
  { id: 'blood_pressure', label: '❤️ High Blood Pressure' },
  { id: 'diabetes', label: '🩸 Diabetes' },
  { id: 'hormonal', label: '⚡ Hormonal Issues' },
  { id: 'digestive', label: '🫁 Digestive Issues' },
  { id: 'asthma', label: '🫧 Asthma' },
  { id: 'heart', label: '💔 Heart Concerns' },
  { id: 'anxiety', label: '🧠 Anxiety / Stress' },
  { id: 'none', label: '✅ None' },
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
      headline="Any medical conditions or concerns?"
      subtext="Everything shared is private. This helps us keep your coaching safe and effective."
      onBack={onBack}
      onNext={() => onNext({ health_conditions: selected, health_notes: notes })}
      nextDisabled={selected.length === 0}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2.5">
          {CONDITIONS.map(c => (
            <ChipSelect key={c.id} label={c.label} selected={selected.includes(c.id)} onClick={() => toggle(c.id)} />
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>Anything else your coach should know?</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add any relevant medical history, medications, or concerns..."
            rows={4}
            className="w-full px-4 py-4 rounded-2xl text-white text-sm leading-relaxed resize-none focus:outline-none transition-all"
            style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)', color: 'rgb(var(--card))' }}
            onFocus={e => { e.target.style.border = '1px solid rgb(var(--primary) / 0.45)'; }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.06)'; }}
          />
        </div>
      </div>
    </OnboardingLayout>
  );
}