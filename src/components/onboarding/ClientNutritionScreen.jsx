import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect, QuestionLabel } from './SelectionCard';

const STYLES = [
  { id: 'high_protein', label: 'High protein' },
  { id: 'meal_prep', label: 'Meal prep' },
  { id: 'flexible', label: 'Flexible dieting' },
  { id: 'performance', label: 'Fuel for performance' },
  { id: 'fat_loss', label: 'Fat loss' },
  { id: 'simple', label: 'Simple meals' },
];

const FOODS = [
  { id: 'chicken', label: 'Chicken' },
  { id: 'steak', label: 'Steak' },
  { id: 'rice', label: 'Rice' },
  { id: 'potatoes', label: 'Potatoes' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'yogurt', label: 'Greek yogurt' },
  { id: 'beef', label: 'Ground beef' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'pasta', label: 'Pasta' },
  { id: 'salmon', label: 'Salmon' },
  { id: 'turkey', label: 'Turkey' },
];

export default function ClientNutritionScreen({ onNext, onBack, data }) {
  const [styles, setStyles] = useState(data.nutrition_styles || []);
  const [foods, setFoods] = useState(data.food_preferences || []);

  const toggleStyle = (id) => setStyles(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleFood = (id) => setFoods(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Nutrition"
      headline="How do you like to eat?"
      subtext="Pick an approach and the foods you enjoy. Your meal plan starts from these."
      onBack={onBack}
      onNext={() => onNext({ nutrition_styles: styles, food_preferences: foods })}
      nextDisabled={styles.length === 0}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {STYLES.map(s => (
            <ChipSelect key={s.id} label={s.label} selected={styles.includes(s.id)} onClick={() => toggleStyle(s.id)} />
          ))}
        </div>

        <div className="space-y-3">
          <QuestionLabel>Foods you enjoy</QuestionLabel>
          <div className="flex flex-wrap gap-2">
            {FOODS.map(f => (
              <ChipSelect key={f.id} label={f.label} selected={foods.includes(f.id)} onClick={() => toggleFood(f.id)} />
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
