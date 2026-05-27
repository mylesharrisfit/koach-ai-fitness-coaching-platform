import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import MacroRing from '@/components/portal/nutrition/MacroRing';
import MealCard from '@/components/portal/nutrition/MealCard';
import FoodDetailModal from '@/components/portal/nutrition/FoodDetailModal';
import FoodSearchSheet from '@/components/portal/nutrition/FoodSearchSheet';
import WaterTracker from '@/components/portal/nutrition/WaterTracker';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MEALS = [
  { id: 'breakfast', name: 'Breakfast', time: '7:00 AM', target: 400 },
  { id: 'lunch', name: 'Lunch', time: '12:30 PM', target: 600 },
  { id: 'dinner', name: 'Dinner', time: '6:30 PM', target: 700 },
  { id: 'snacks', name: 'Snacks', time: 'Anytime', target: 300 },
];

const DEMO_NUTRITION = {
  breakfast: [
    { name: 'Oatmeal', portion: '50g dry', calories: 190, protein: 5, carbs: 35, fats: 4 },
  ],
  lunch: [],
  dinner: [],
  snacks: [],
};

export default function PortalNutrition({ user }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [loggedFoods, setLoggedFoods] = useState(DEMO_NUTRITION);
  const [waterIntake, setWaterIntake] = useState(5);

  // Nutrition target
  const DAILY_TARGET = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fats: 65,
  };

  // Calculate totals
  const calcTotals = () => {
    const all = Object.values(loggedFoods).flat();
    return {
      calories: all.reduce((s, f) => s + (f.calories || 0), 0),
      protein: all.reduce((s, f) => s + (f.protein || 0), 0),
      carbs: all.reduce((s, f) => s + (f.carbs || 0), 0),
      fats: all.reduce((s, f) => s + (f.fats || 0), 0),
    };
  };

  const totals = calcTotals();

  const handleAddFood = (food, serving = 1, unit = 'serving') => {
    const newFood = {
      ...food,
      serving: `${serving} ${unit}`,
      calories: Math.round(food.calories * serving),
      protein: (food.protein * serving).toFixed(1),
      carbs: (food.carbs * serving).toFixed(1),
      fats: (food.fats * serving).toFixed(1),
    };

    setLoggedFoods(prev => ({
      ...prev,
      [selectedMeal]: [...(prev[selectedMeal] || []), newFood],
    }));

    setShowFoodSearch(false);
    setSelectedFood(null);
  };

  const handleDateChange = (days) => {
    setSelectedDate(d => new Date(d.getTime() + days * 24 * 60 * 60 * 1000));
  };

  return (
    <div className="pb-32 bg-gradient-to-b from-white to-slate-50 min-h-screen">

      {/* Header */}
      <div className="bg-white px-4 flex items-center justify-between"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: 12, boxShadow: '0 1px 0 #F1F5F9' }}>
        <h1 className="text-slate-900 font-black text-[28px]">Nutrition</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => handleDateChange(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#F1F5F9' }}>
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <p className="text-slate-600 text-xs font-bold min-w-[90px] text-center">
            {format(selectedDate, 'MMM d')}
          </p>
          <button onClick={() => handleDateChange(1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#F1F5F9' }}>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Macro ring */}
      <MacroRing
        consumed={totals.calories}
        target={DAILY_TARGET.calories}
        breakdown={{
          protein: { remaining: Math.max(0, DAILY_TARGET.protein - totals.protein) },
          carbs: { remaining: Math.max(0, DAILY_TARGET.carbs - totals.carbs) },
          fats: { remaining: Math.max(0, DAILY_TARGET.fats - totals.fats) },
          water: { remaining: Math.max(0, 8 - waterIntake) },
        }} />

      {/* Meals */}
      <div className="space-y-2">
        {MEALS.map(meal => (
          <MealCard
            key={meal.id}
            meal={meal}
            loggedFoods={loggedFoods[meal.id] || []}
            mealTarget={meal.target}
            onAddFood={() => { setSelectedMeal(meal.id); setShowFoodSearch(true); }}
            onUsePlan={() => {}}
            onSwapFood={() => {}} />
        ))}
      </div>

      {/* Water tracker */}
      <WaterTracker
        glasses={waterIntake}
        goal={8}
        onUpdate={setWaterIntake} />

      {/* Nutrition insight */}
      <div className="mx-4 mb-5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
        <p className="text-blue-700 text-sm leading-relaxed">
          ✨ <strong>You're 40g short on protein</strong> — try adding a Greek yogurt (100g = 10g protein) 🥛
        </p>
      </div>

      {/* Food detail modal */}
      <AnimatePresence>
        {selectedFood && (
          <FoodDetailModal
            food={selectedFood}
            mealName={MEALS.find(m => m.id === selectedMeal)?.name}
            isOpen={!!selectedFood}
            onClose={() => setSelectedFood(null)}
            onAddToMeal={handleAddFood} />
        )}
      </AnimatePresence>

      {/* Food search sheet */}
      <AnimatePresence>
        {showFoodSearch && (
          <FoodSearchSheet
            isOpen={showFoodSearch}
            onClose={() => setShowFoodSearch(false)}
            onSelectFood={setSelectedFood}
            mealName={MEALS.find(m => m.id === selectedMeal)?.name} />
        )}
      </AnimatePresence>
    </div>
  );
}