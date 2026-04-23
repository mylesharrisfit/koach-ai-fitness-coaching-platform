import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Apple, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Macro pill ───────────────────────────────────────────
function MacroPill({ label, value, unit = 'g', color }) {
  return (
    <div className={cn('flex flex-col items-center px-4 py-2.5 rounded-xl', color)}>
      <span className="text-base font-bold tabular-nums leading-tight">{value}{unit}</span>
      <span className="text-[11px] opacity-70 mt-0.5">{label}</span>
    </div>
  );
}

// ── Food row ─────────────────────────────────────────────
function FoodRow({ food }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#F6F7FB] last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-sm text-[#1F2A44] font-medium">{food.food_name}</span>
        {food.portion && <span className="text-xs text-[#9CA3AF] ml-1.5">{food.portion}</span>}
      </div>
      <div className="flex items-center gap-2.5 text-xs text-[#9CA3AF] tabular-nums shrink-0 ml-2">
        {food.protein > 0 && <span className="text-blue-500 font-medium">{food.protein}P</span>}
        {food.carbs > 0  && <span className="text-amber-500 font-medium">{food.carbs}C</span>}
        {food.fats > 0   && <span className="text-rose-400 font-medium">{food.fats}F</span>}
        {food.calories > 0 && <span className="text-[#374151] font-semibold">{food.calories} cal</span>}
      </div>
    </div>
  );
}

// ── Meal Card ─────────────────────────────────────────────
function MealCard({ meal }) {
  // Support both legacy (foods array) and new (options array) structure
  const hasOptions = meal.options && meal.options.length > 1;
  const [selectedOption, setSelectedOption] = useState(0);

  const activeFoods = hasOptions
    ? (meal.options[selectedOption]?.foods || [])
    : (meal.foods || []);

  const mealCals = activeFoods.reduce((s, f) => s + (f.calories || 0), 0);
  const mealP   = activeFoods.reduce((s, f) => s + (f.protein || 0), 0);

  return (
    <div className="border border-[#F0F2F8] rounded-xl overflow-hidden">
      {/* Meal header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F8F9FC]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#1F2A44]">{meal.meal_name}</span>
          {meal.time && (
            <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
              <Clock className="w-3 h-3" />{meal.time}
            </span>
          )}
        </div>
        {(mealCals > 0 || mealP > 0) && (
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF] tabular-nums">
            {mealP > 0  && <span className="text-blue-500 font-medium">{mealP}g P</span>}
            {mealCals > 0 && <span className="font-semibold text-[#374151]">{mealCals} cal</span>}
          </div>
        )}
      </div>

      {/* Option switcher */}
      {hasOptions && (
        <div className="flex items-center gap-1 px-4 pt-2.5">
          {meal.options.map((opt, oIdx) => (
            <button
              key={oIdx}
              onClick={() => setSelectedOption(oIdx)}
              className={cn(
                'text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all',
                selectedOption === oIdx
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-white text-[#9CA3AF] border-[#E7EAF3] hover:border-primary/20 hover:text-[#374151]'
              )}
            >
              {opt.label || `Option ${oIdx + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Foods */}
      <div className="px-4 pb-1 pt-2">
        {activeFoods.length > 0
          ? activeFoods.map((f, fi) => <FoodRow key={fi} food={f} />)
          : <p className="text-xs text-[#9CA3AF] py-2">No foods listed</p>
        }
      </div>
    </div>
  );
}

// ── Supplement row ────────────────────────────────────────
const TIMING_COLOR = {
  'Morning':      'bg-amber-50 text-amber-700',
  'Pre-Workout':  'bg-blue-50 text-blue-600',
  'Post-Workout': 'bg-emerald-50 text-emerald-700',
  'With Meals':   'bg-purple-50 text-purple-600',
  'Night':        'bg-slate-100 text-slate-600',
};
const CAT_DOT = { supplement: 'bg-blue-400', vitamin: 'bg-amber-400', mineral: 'bg-emerald-400' };

function SupplementRow({ item }) {
  const timingClass = TIMING_COLOR[item.timing] || 'bg-secondary text-muted-foreground';
  const dotClass = CAT_DOT[item.category] || 'bg-muted';
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#F6F7FB] last:border-0">
      <div className={cn('w-2 h-2 rounded-full shrink-0', dotClass)} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-[#1F2A44]">{item.name}</span>
        {item.dosage && <span className="text-xs text-[#9CA3AF] ml-1.5">{item.dosage}</span>}
        {item.purpose && <p className="text-[11px] text-[#9CA3AF] mt-0.5">{item.purpose}</p>}
      </div>
      {item.timing && (
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0', timingClass)}>
          {item.timing}
        </span>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export default function ProfileNutritionTab({ client }) {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['nutrition-plans'],
    queryFn: () => base44.entities.NutritionPlan.list(),
  });

  const assigned = plans.find(p => p.id === client.assigned_nutrition_id);

  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-[#F0F2F8]" />)}
    </div>
  );

  if (!assigned) return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] flex flex-col items-center justify-center py-14 text-center px-6">
      <div className="w-12 h-12 rounded-full bg-[#F6F7FB] flex items-center justify-center mb-3">
        <Apple className="w-5 h-5 text-[#9CA3AF]" />
      </div>
      <p className="text-sm font-semibold text-[#374151]">No nutrition plan assigned</p>
      <p className="text-xs text-[#9CA3AF] mt-1">Assign a plan from the Nutrition page</p>
    </div>
  );

  const isHabits = assigned.tracking_mode === 'habits';
  const supplements = assigned.supplements || [];

  return (
    <div className="space-y-4">
      {/* ── Plan header + macros ── */}
      <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h4 className="text-base font-bold text-[#1F2A44] leading-tight">{assigned.title}</h4>
            {assigned.description && <p className="text-xs text-[#6B7280] mt-0.5">{assigned.description}</p>}
          </div>
          <span className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0',
            isHabits ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          )}>
            {isHabits ? 'Habit Mode' : 'Macro Tracking'}
          </span>
        </div>

        {!isHabits && assigned.calories > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-[#F6F7FB] flex-1 text-center">
              <span className="text-xl font-bold tabular-nums text-[#1F2A44]">{assigned.calories}</span>
              <span className="text-[11px] text-[#9CA3AF] mt-0.5">kcal / day</span>
            </div>
            {assigned.protein_g > 0 && <MacroPill label="Protein" value={assigned.protein_g} color="bg-blue-50 text-blue-700" />}
            {assigned.carbs_g   > 0 && <MacroPill label="Carbs"   value={assigned.carbs_g}   color="bg-amber-50 text-amber-700" />}
            {assigned.fats_g    > 0 && <MacroPill label="Fats"    value={assigned.fats_g}    color="bg-rose-50 text-rose-600" />}
          </div>
        )}
      </div>

      {/* ── Meals ── */}
      {assigned.meals?.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide px-1">
            {isHabits ? 'Habit Guidelines' : `Meals · ${assigned.meals.length}`}
          </h3>
          {assigned.meals.map((meal, i) => (
            isHabits ? (
              <div key={i} className="bg-white border border-[#F0F2F8] rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-[#1F2A44] mb-1">{meal.meal_name}</p>
                {meal.habit_description && <p className="text-sm text-[#6B7280] leading-relaxed">{meal.habit_description}</p>}
              </div>
            ) : (
              <MealCard key={i} meal={meal} />
            )
          ))}
        </div>
      )}

      {/* ── Supplements ── */}
      {supplements.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
          <h3 className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">💊 Supplements & Vitamins</h3>
          {supplements.map((item, i) => <SupplementRow key={i} item={item} />)}
        </div>
      )}
    </div>
  );
}