import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const RESTRICTIONS = [
  { id: 'dairy_free', label: '🥛 Dairy-Free' },
  { id: 'gluten_free', label: '🌾 Gluten-Free' },
  { id: 'nut_allergy', label: '🥜 Nut Allergy' },
  { id: 'shellfish', label: '🦐 Shellfish Allergy' },
  { id: 'vegetarian', label: '🥦 Vegetarian' },
  { id: 'vegan', label: '🌱 Vegan' },
  { id: 'halal', label: '☪️ Halal' },
  { id: 'kosher', label: '✡️ Kosher' },
  { id: 'none', label: '✅ No Restrictions' },
];

const LIKED_FOODS = [
  { id: 'chicken', label: '🍗 Chicken' },
  { id: 'steak', label: '🥩 Steak' },
  { id: 'rice', label: '🍚 Rice' },
  { id: 'potatoes', label: '🥔 Potatoes' },
  { id: 'eggs', label: '🥚 Eggs' },
  { id: 'yogurt', label: '🫙 Greek Yogurt' },
  { id: 'beef', label: '🍖 Ground Beef' },
  { id: 'turkey', label: '🦃 Turkey' },
  { id: 'fruit', label: '🍎 Fruit' },
  { id: 'pasta', label: '🍝 Pasta' },
  { id: 'salmon', label: '🐟 Salmon' },
  { id: 'oats', label: '🌾 Oats' },
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
      headline="Any food allergies or restrictions?"
      subtext="We'll build your meal plan around foods you enjoy and can eat safely."
      onBack={onBack}
      onNext={() => onNext({ food_restrictions: restrictions, food_preferences: liked, food_dislikes: disliked })}
      nextDisabled={restrictions.length === 0}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2.5">
          {RESTRICTIONS.map(r => (
            <ChipSelect key={r.id} label={r.label} selected={restrictions.includes(r.id)} onClick={() => toggleR(r.id)} />
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>Foods you enjoy</p>
          <div className="flex flex-wrap gap-2.5">
            {LIKED_FOODS.map(f => (
              <ChipSelect key={f.id} label={f.label} selected={liked.includes(f.id)} onClick={() => toggleL(f.id)} />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>Foods you dislike</p>
          <input
            type="text"
            value={disliked}
            onChange={e => setDisliked(e.target.value)}
            placeholder="e.g. broccoli, tuna, cottage cheese..."
            className="w-full px-4 py-3.5 rounded-xl text-white text-base focus:outline-none transition-all"
            style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)', color: 'rgb(var(--card))' }}
            onFocus={e => { e.target.style.border = '1px solid rgba(59,130,246,0.45)'; }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.06)'; }}
          />
        </div>
      </div>
    </OnboardingLayout>
  );
}