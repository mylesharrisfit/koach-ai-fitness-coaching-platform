import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const HABITS = [
  { id: 'meal_prep', label: '📦 I meal prep consistently' },
  { id: 'eat_out', label: '🍽️ I eat out often' },
  { id: 'snacker', label: '🍿 I snack a lot' },
  { id: 'busy', label: '⚡ Busy schedule' },
  { id: 'emotional', label: '😔 Emotional eater' },
  { id: 'late_night', label: '🌙 Late night eating' },
  { id: 'skip_meals', label: '⏭️ I skip meals often' },
  { id: 'low_protein', label: '🥩 I struggle hitting protein' },
];

const MEALS = [
  { id: '2', label: '2 meals' },
  { id: '3', label: '3 meals' },
  { id: '4', label: '4 meals' },
  { id: 'flexible', label: 'Flexible' },
];

export default function ClientNutritionHabitsScreen({ onNext, onBack, data }) {
  const [habits, setHabits] = useState(data.nutrition_habits || []);
  const [meals, setMeals] = useState(data.meals_per_day || null);

  const toggle = (id) => setHabits(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Eating Habits"
      headline="What best describes your eating habits?"
      subtext="Being honest here helps us build a plan you'll actually stick to."
      onBack={onBack}
      onNext={() => onNext({ nutrition_habits: habits, meals_per_day: meals })}
      nextDisabled={habits.length === 0}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2.5">
          {HABITS.map(h => (
            <ChipSelect key={h.id} label={h.label} selected={habits.includes(h.id)} onClick={() => toggle(h.id)} />
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>How many meals per day do you prefer?</p>
          <div className="grid grid-cols-2 gap-2.5">
            {MEALS.map(m => (
              <button
                key={m.id}
                onClick={() => setMeals(m.id)}
                className="py-4 rounded-2xl text-sm font-semibold transition-all"
                style={{
                  background: meals === m.id ? 'rgba(59,130,246,0.1)' : '#161616',
                  border: meals === m.id ? '1px solid rgba(59,130,246,0.45)' : '1px solid rgba(255,255,255,0.06)',
                  color: meals === m.id ? '#fff' : '#7A7A7A',
                  boxShadow: meals === m.id ? '0 0 18px rgba(59,130,246,0.12)' : 'none',
                }}
              >{m.label}</button>
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}