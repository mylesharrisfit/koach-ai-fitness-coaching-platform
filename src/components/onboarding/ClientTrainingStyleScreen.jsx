import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const STYLES = [
  { id: 'gym', label: '🏋️ Gym' },
  { id: 'running', label: '🏃 Running' },
  { id: 'hybrid', label: '⚡ Hybrid' },
  { id: 'functional', label: '🔄 Functional' },
  { id: 'bodybuilding', label: '💪 Bodybuilding' },
  { id: 'strength', label: '🏆 Strength' },
  { id: 'home', label: '🏠 Home Workouts' },
  { id: 'sports', label: '🏅 Sports Performance' },
];

const EQUIPMENT = [
  { id: 'full_gym', label: '🏢 Full Gym' },
  { id: 'dumbbells', label: '🏋️ Dumbbells Only' },
  { id: 'home_gym', label: '🏠 Home Gym' },
  { id: 'bands', label: '🪢 Resistance Bands' },
  { id: 'cardio', label: '🚴 Cardio Equipment' },
  { id: 'bodyweight', label: '🤸 Bodyweight Only' },
];

export default function ClientTrainingStyleScreen({ onNext, onBack, data }) {
  const [styles, setStyles] = useState(data.training_styles || []);
  const [equipment, setEquipment] = useState(data.equipment || []);

  const toggleStyle = (id) => setStyles(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleEquip = (id) => setEquipment(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Training"
      headline="How do you prefer to train?"
      subtext="Select all that apply so we can match your program to your environment."
      onBack={onBack}
      onNext={() => onNext({ training_styles: styles, equipment })}
      nextDisabled={styles.length === 0}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2.5">
          {STYLES.map(s => (
            <ChipSelect key={s.id} label={s.label} selected={styles.includes(s.id)} onClick={() => toggleStyle(s.id)} />
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>What equipment do you have access to?</p>
          <div className="flex flex-wrap gap-2.5">
            {EQUIPMENT.map(e => (
              <ChipSelect key={e.id} label={e.label} selected={equipment.includes(e.id)} onClick={() => toggleEquip(e.id)} />
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}