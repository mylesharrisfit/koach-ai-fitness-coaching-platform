import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect, QuestionLabel } from './SelectionCard';

const STYLES = [
  { id: 'gym', label: 'Gym' },
  { id: 'running', label: 'Running' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'functional', label: 'Functional' },
  { id: 'bodybuilding', label: 'Bodybuilding' },
  { id: 'strength', label: 'Strength' },
  { id: 'home', label: 'Home workouts' },
  { id: 'sports', label: 'Sport-specific' },
];

const EQUIPMENT = [
  { id: 'full_gym', label: 'Full gym' },
  { id: 'dumbbells', label: 'Dumbbells only' },
  { id: 'home_gym', label: 'Home gym' },
  { id: 'bands', label: 'Resistance bands' },
  { id: 'cardio', label: 'Cardio machines' },
  { id: 'bodyweight', label: 'Bodyweight only' },
];

export default function ClientTrainingStyleScreen({ onNext, onBack, data }) {
  const [styles, setStyles] = useState(data.training_styles || []);
  const [equipment, setEquipment] = useState(data.equipment || []);

  const toggleStyle = (id) => setStyles(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleEquip = (id) => setEquipment(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Training"
      headline="How do you like to train?"
      subtext="Pick everything that fits. Your program only uses equipment you have."
      onBack={onBack}
      onNext={() => onNext({ training_styles: styles, equipment })}
      nextDisabled={styles.length === 0}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {STYLES.map(s => (
            <ChipSelect key={s.id} label={s.label} selected={styles.includes(s.id)} onClick={() => toggleStyle(s.id)} />
          ))}
        </div>
        <div className="space-y-3">
          <QuestionLabel>What equipment can you use?</QuestionLabel>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT.map(e => (
              <ChipSelect key={e.id} label={e.label} selected={equipment.includes(e.id)} onClick={() => toggleEquip(e.id)} />
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
