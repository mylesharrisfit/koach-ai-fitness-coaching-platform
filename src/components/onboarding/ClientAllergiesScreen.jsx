import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect, QuestionLabel, onboardingFieldCls } from './SelectionCard';

const RESTRICTIONS = [
  { id: 'dairy_free', label: 'Dairy-free' },
  { id: 'gluten_free', label: 'Gluten-free' },
  { id: 'nut_allergy', label: 'Nut allergy' },
  { id: 'shellfish', label: 'Shellfish allergy' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
  { id: 'none', label: 'None' },
];

const LIKED_FOODS = [
  { id: 'chicken', label: 'Chicken' },
  { id: 'steak', label: 'Steak' },
  { id: 'rice', label: 'Rice' },
  { id: 'potatoes', label: 'Potatoes' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'yogurt', label: 'Greek yogurt' },
  { id: 'beef', label: 'Ground beef' },
  { id: 'turkey', label: 'Turkey' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'pasta', label: 'Pasta' },
  { id: 'salmon', label: 'Salmon' },
  { id: 'oats', label: 'Oats' },
];

export default function ClientAllergiesScreen({ onNext, onBack, data }) {
  const [restrictions, setRestrictions] = useState(data.food_restrictions || []);
  const [liked, setLiked] = useState(data.food_preferences || []);
  const [disliked, setDisliked] = useState(data.food_dislikes || '');

  const toggleR = (id) => {
    if (id === 'none') { setRestrictions(['none']); return; }
    setRestrictions(s => {
      const without_none = s.filter(x => x !== 'none');
      return without_none.includes(id) ? without_none.filter(x => x !== id) : [...without_none, id];
    });
  };
  const toggleL = (id) => setLiked(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Nutrition"
      headline="Any allergies or food rules?"
      subtext="Your meal plan only uses food you can eat and actually like."
      onBack={onBack}
      onNext={() => onNext({ food_restrictions: restrictions, food_preferences: liked, food_dislikes: disliked })}
      nextDisabled={restrictions.length === 0}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {RESTRICTIONS.map(r => (
            <ChipSelect key={r.id} label={r.label} selected={restrictions.includes(r.id)} onClick={() => toggleR(r.id)} />
          ))}
        </div>
        <div className="space-y-3">
          <QuestionLabel>Foods you enjoy</QuestionLabel>
          <div className="flex flex-wrap gap-2">
            {LIKED_FOODS.map(f => (
              <ChipSelect key={f.id} label={f.label} selected={liked.includes(f.id)} onClick={() => toggleL(f.id)} />
            ))}
          </div>
        </div>
        <label className="block space-y-2">
          <QuestionLabel>Foods you won't eat</QuestionLabel>
          <input
            type="text"
            value={disliked}
            onChange={e => setDisliked(e.target.value)}
            placeholder="Broccoli, tuna, cottage cheese"
            className={`${onboardingFieldCls} h-12`}
          />
        </label>
      </div>
    </OnboardingLayout>
  );
}
