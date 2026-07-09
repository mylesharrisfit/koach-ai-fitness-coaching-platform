import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const STYLES = [
  { id: 'high_protein', label: '🥩 High Protein' },
  { id: 'meal_prep', label: '📦 Meal Prep' },
  { id: 'flexible', label: '🔓 Flexible Dieting' },
  { id: 'performance', label: '⚡ Performance Focused' },
  { id: 'fat_loss', label: '🔥 Fat Loss Focused' },
  { id: 'simple', label: '🍽️ Simple Meals' },
];

const FOODS = [
  { id: 'chicken', label: '🍗 Chicken' },
  { id: 'steak', label: '🥩 Steak' },
  { id: 'rice', label: '🍚 Rice' },
  { id: 'potatoes', label: '🥔 Potatoes' },
  { id: 'eggs', label: '🥚 Eggs' },
  { id: 'yogurt', label: '🫙 Greek Yogurt' },
  { id: 'beef', label: '🍖 Ground Beef' },
  { id: 'fruit', label: '🍎 Fruit' },
  { id: 'pasta', label: '🍝 Pasta' },
  { id: 'salmon', label: '🐟 Salmon' },
  { id: 'turkey', label: '🦃 Turkey' },
];

export default function ClientNutritionScreen({ onNext, onBack, data }) {
  const [styles, setStyles] = useState(data.nutrition_styles || []);
  const [foods, setFoods] = useState(data.food_preferences || []);

  const toggleStyle = (id) => setStyles(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleFood = (id) => setFoods(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Nutrition"
      headline="What nutrition style fits you best?"
      subtext="Select your approach and favourite foods for AI meal plan generation."
      onBack={onBack}
      onNext={() => onNext({ nutrition_styles: styles, food_preferences: foods })}
      nextDisabled={styles.length === 0}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2.5">
          {STYLES.map(s => (
            <ChipSelect key={s.id} label={s.label} selected={styles.includes(s.id)} onClick={() => toggleStyle(s.id)} />
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--kc-b3b3b3)' }}>Foods you enjoy</p>
          <div className="flex flex-wrap gap-2.5">
            {FOODS.map(f => (
              <ChipSelect key={f.id} label={f.label} selected={foods.includes(f.id)} onClick={() => toggleFood(f.id)} />
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}