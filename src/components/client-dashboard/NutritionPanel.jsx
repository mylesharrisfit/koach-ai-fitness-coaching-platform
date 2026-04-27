import React, { useState } from 'react';
import { Salad, Droplets, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

function Stepper({ value, min = 0, max, onInc, onDec, color }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onDec}
        disabled={value <= min}
        className="w-8 h-8 rounded-xl bg-secondary/60 hover:bg-secondary disabled:opacity-30 flex items-center justify-center transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <div className="flex-1 text-center">
        <span className={cn('font-heading font-bold text-xl tabular-nums', color)}>{value}</span>
        {max && <span className="text-xs text-muted-foreground">/{max}</span>}
      </div>
      <button
        onClick={onInc}
        disabled={max && value >= max}
        className="w-8 h-8 rounded-xl bg-secondary/60 hover:bg-secondary disabled:opacity-30 flex items-center justify-center transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function NutritionPanel({ plan, mealsLogged, waterGlasses, onMealsChange, onWaterChange }) {
  const [expanded, setExpanded] = useState(false);

  const mealGoal = plan?.meals?.length || 4;
  const waterGoal = 8;
  const mealPct = Math.min(100, ((mealsLogged || 0) / mealGoal) * 100);
  const waterPct = Math.min(100, ((waterGlasses || 0) / waterGoal) * 100);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Salad className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nutrition</p>
            <p className="font-heading font-bold text-base text-foreground">
              {plan?.title || 'Your Nutrition Plan'}
            </p>
          </div>
          {plan?.calories && (
            <div className="text-right shrink-0">
              <p className="font-bold text-sm text-foreground">{plan.calories}</p>
              <p className="text-[10px] text-muted-foreground">kcal / day</p>
            </div>
          )}
        </div>

        {/* Macros */}
        {plan && (plan.protein_g || plan.carbs_g || plan.fats_g) && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Protein', val: plan.protein_g, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Carbs', val: plan.carbs_g, color: 'text-amber-500', bg: 'bg-amber-50' },
              { label: 'Fats', val: plan.fats_g, color: 'text-rose-500', bg: 'bg-rose-50' },
            ].map(m => m.val ? (
              <div key={m.label} className={cn('rounded-xl px-3 py-2 text-center', m.bg)}>
                <p className={cn('font-bold text-sm', m.color)}>{m.val}g</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ) : null)}
          </div>
        )}

        {/* Meals logged */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-foreground">Meals logged</span>
            <span className="text-xs text-muted-foreground">{mealsLogged}/{mealGoal}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${mealPct}%` }} />
          </div>
          <Stepper
            value={mealsLogged || 0} min={0} max={mealGoal}
            onInc={() => onMealsChange((mealsLogged || 0) + 1)}
            onDec={() => onMealsChange(Math.max(0, (mealsLogged || 0) - 1))}
            color="text-emerald-600"
          />
        </div>

        {/* Water */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-xs font-medium text-foreground">Water</span>
            </div>
            <span className="text-xs text-muted-foreground">{waterGlasses}/{waterGoal} glasses</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
            <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${waterPct}%` }} />
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: waterGoal }, (_, i) => (
              <button
                key={i}
                onClick={() => onWaterChange(i < waterGlasses ? i : i + 1)}
                className={cn(
                  'flex-1 h-7 rounded-lg transition-all text-[10px] font-medium',
                  i < (waterGlasses || 0)
                    ? 'bg-cyan-500 text-white'
                    : 'bg-secondary text-muted-foreground hover:bg-cyan-100'
                )}
              >
                💧
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meal list */}
      {plan?.meals?.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between px-5 py-3 border-t border-border/60 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
          >
            <span>View meal plan ({plan.meals.length} meals)</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {expanded && (
            <div className="border-t border-border/60 divide-y divide-border/40">
              {plan.meals.map((meal, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{meal.meal_name || `Meal ${i + 1}`}</p>
                    {meal.time && <span className="text-xs text-muted-foreground">{meal.time}</span>}
                  </div>
                  {meal.habit_description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{meal.habit_description}</p>
                  )}
                  {meal.foods?.slice(0, 3).map((f, j) => (
                    <div key={j} className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-foreground">{f.food_name}</span>
                      <span className="text-xs text-muted-foreground">{f.portion}</span>
                    </div>
                  ))}
                  {meal.foods?.length > 3 && (
                    <p className="text-xs text-muted-foreground mt-1">+{meal.foods.length - 3} more foods</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}