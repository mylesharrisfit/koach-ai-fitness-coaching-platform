import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';

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
  { id: '2', label: '2 meals' },
  { id: '3', label: '3 meals' },
  { id: '4', label: '4 meals' },
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
      headline="What foods do you enjoy?"
      subtext="We'll build your plan around foods you actually like to eat."
      onBack={onBack}
      onNext={() => onNext({ fav_foods: favFoods, diet, meals_per_day: meals, nutrition_habits: favFoods })}
      nextDisabled={false}
    >
      <div className="space-y-8">
        {/* Favorite foods */}
        <div className="flex flex-wrap gap-2.5">
          {FOODS.map((f, i) => (
            <motion.button
              key={f}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.03 * i }}
              whileTap={{ scale: 0.93 }}
              onClick={() => toggleFood(f)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: favFoods.includes(f) ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                border: favFoods.includes(f) ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.07)',
                color: favFoods.includes(f) ? 'rgb(var(--card))' : '#7A7A7A',
                boxShadow: favFoods.includes(f) ? '0 0 16px rgba(59,130,246,0.15)' : 'none',
              }}
            >
              {f}
            </motion.button>
          ))}
        </div>

        {/* Dietary restrictions */}
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>Any dietary restrictions?</p>
          <div className="flex flex-wrap gap-2.5">
            {DIETS.map(d => (
              <motion.button key={d.id} whileTap={{ scale: 0.95 }}
                onClick={() => setDiet(diet === d.id ? null : d.id)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: diet === d.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                  border: diet === d.id ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.07)',
                  color: diet === d.id ? 'rgb(var(--card))' : '#7A7A7A',
                }}>{d.label}</motion.button>
            ))}
          </div>
        </div>

        {/* Meals per day */}
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>How many meals per day do you prefer?</p>
          <div className="grid grid-cols-2 gap-2.5">
            {MEALS.map(m => (
              <motion.button key={m.id} whileTap={{ scale: 0.95 }}
                onClick={() => setMeals(m.id)}
                className="py-4 rounded-2xl text-sm font-semibold transition-all"
                style={{
                  background: meals === m.id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
                  border: meals === m.id ? '1.5px solid rgba(59,130,246,0.45)' : '1.5px solid rgba(255,255,255,0.07)',
                  color: meals === m.id ? 'rgb(var(--card))' : '#7A7A7A',
                  boxShadow: meals === m.id ? '0 0 18px rgba(59,130,246,0.12)' : 'none',
                }}>{m.label}</motion.button>
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}