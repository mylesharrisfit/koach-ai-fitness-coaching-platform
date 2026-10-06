import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect, QuestionLabel, SegmentRow } from './SelectionCard';

const FOODS = ['Chicken', 'Salmon', 'Steak', 'Eggs', 'Rice', 'Potatoes', 'Oats', 'Greek Yogurt', 'Broccoli', 'Avocado', 'Pasta', 'Bread', 'Beans', 'Tuna'];

const DIETS = [
  { id: 'none',         label: 'No restrictions' },
  { id: 'vegetarian',   label: 'Vegetarian' },
  { id: 'vegan',        label: 'Vegan' },
  { id: 'gluten_free',  label: 'Gluten-free' },
  { id: 'dairy_free',   label: 'Dairy-free' },
  { id: 'halal',        label: 'Halal' },
];

const MEALS = [
  { id: '2', label: '2' },
  { id: '3', label: '3' },
  { id: '4', label: '4' },
  { id: 'flexible', label: 'Flexible' },
];

export default function ClientNutritionHabitsScreen({ onNext, onBack, data }) {
  const [favFoods, setFavFoods] = useState(data.fav_foods || []);
  const [diet, setDiet] = useState(data.diet || null);
  const [meals, setMeals] = useState(data.meals_per_day || null);

  const toggleFood = (f) => setFavFoods(s => s.includes(f) ? s.filter(x => x !== f) : [...s, f]);

  return (
    <OnboardingLayout
      eyebrow="Nutrition"
      headline="What do you like to eat?"
      subtext="Your meal plan is built around food you already enjoy."
      onBack={onBack}
      onNext={() => onNext({ fav_foods: favFoods, diet, meals_per_day: meals, nutrition_habits: favFoods })}
      nextDisabled={false}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {FOODS.map(f => (
            <ChipSelect key={f} label={f} selected={favFoods.includes(f)} onClick={() => toggleFood(f)} />
          ))}
        </div>

        <div className="space-y-3">
          <QuestionLabel>Any dietary restrictions?</QuestionLabel>
          <div className="flex flex-wrap gap-2">
            {DIETS.map(d => (
              <ChipSelect key={d.id} label={d.label} selected={diet === d.id} onClick={() => setDiet(diet === d.id ? null : d.id)} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <QuestionLabel>Meals a day</QuestionLabel>
          <SegmentRow options={MEALS} value={meals} onChange={setMeals} />
        </div>
      </div>
    </OnboardingLayout>
  );
}
