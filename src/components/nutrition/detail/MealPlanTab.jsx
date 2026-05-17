import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const SWAP_SUGGESTIONS = {
  chicken: ['Turkey breast (same macros)', 'Tilapia fillet', 'Egg whites (3 large)'],
  rice: ['Sweet potato (150g)', 'Oats (80g dry)', 'Quinoa (cooked 150g)'],
  almonds: ['Walnuts (same weight)', 'Avocado (50g)', 'Peanut butter (1 tbsp)'],
  beef: ['Lean ground turkey', 'Bison patty', 'Tofu (firm, 200g)'],
  salmon: ['Mackerel', 'Sardines', 'Tilapia + omega-3 supplement'],
};

function getSwaps(foodName) {
  const lower = (foodName || '').toLowerCase();
  for (const [key, swaps] of Object.entries(SWAP_SUGGESTIONS)) {
    if (lower.includes(key)) return swaps;
  }
  return ['Similar whole food option', 'Ask coach for alternatives'];
}

function FoodRow({ food }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0 group/food">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{food.food_name || 'Food item'}</p>
          {food.portion && <p className="text-[11px] text-muted-foreground">{food.portion}</p>}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-shrink-0">
          {food.calories && <span className="font-semibold text-foreground">{food.calories} kcal</span>}
          {food.protein && <span className="text-blue-500 font-medium">{food.protein}p</span>}
          {food.carbs && <span className="text-orange-500 font-medium">{food.carbs}c</span>}
          {food.fats && <span className="text-yellow-600 font-medium">{food.fats}f</span>}
        </div>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <button className="ml-2 p-1 rounded-lg hover:bg-secondary text-muted-foreground opacity-0 group-hover/food:opacity-100 transition-opacity flex-shrink-0" title="Swap options">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="end">
          <p className="text-xs font-bold text-foreground mb-2">Swap Suggestions</p>
          <div className="space-y-1.5">
            {getSwaps(food.food_name).map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                {s}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function MealTotals({ foods }) {
  const totals = foods.reduce((acc, f) => ({
    calories: acc.calories + (f.calories || 0),
    protein: acc.protein + (f.protein || 0),
    carbs: acc.carbs + (f.carbs || 0),
    fats: acc.fats + (f.fats || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  if (!totals.calories && !totals.protein) return null;

  return (
    <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-[#E7EAF3]">
      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Meal total:</span>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="font-bold text-foreground">{totals.calories} kcal</span>
        <span className="text-blue-500 font-semibold">{totals.protein}g P</span>
        <span className="text-orange-500 font-semibold">{totals.carbs}g C</span>
        <span className="text-yellow-600 font-semibold">{totals.fats}g F</span>
      </div>
    </div>
  );
}

function MealCard({ meal, index }) {
  const [expanded, setExpanded] = useState(true);
  const foods = meal.foods || [];
  const timeLabel = meal.time ? ` | ${meal.time}` : '';

  return (
    <div className="bg-white border border-[#E7EAF3] rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">{meal.meal_name || `Meal ${index + 1}`}<span className="text-muted-foreground font-normal">{timeLabel}</span></p>
            {!expanded && foods.length > 0 && (
              <p className="text-[11px] text-muted-foreground">{foods.length} food{foods.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          {meal.habit_description ? (
            <p className="text-sm text-muted-foreground py-2">{meal.habit_description}</p>
          ) : foods.length > 0 ? (
            <>
              {foods.map((f, i) => <FoodRow key={i} food={f} />)}
              <MealTotals foods={foods} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-2 italic">No foods added yet.</p>
          )}
          <button className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Food
          </button>
        </div>
      )}
    </div>
  );
}

function DailyTotalBar({ meals, targets }) {
  const totals = (meals || []).flatMap(m => m.foods || []).reduce((acc, f) => ({
    calories: acc.calories + (f.calories || 0),
    protein: acc.protein + (f.protein || 0),
    carbs: acc.carbs + (f.carbs || 0),
    fats: acc.fats + (f.fats || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  if (!targets.calories) return null;

  function StatusBar({ label, current, target, color }) {
    const pct = target ? Math.min((current / target) * 100, 100) : 0;
    const diff = target ? Math.abs(current - target) / target : 0;
    const barColor = diff < 0.05 ? '#22C55E' : diff < 0.15 ? '#F59E0B' : '#EF4444';
    return (
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="font-semibold" style={{ color }}>{label}</span>
          <span className="text-muted-foreground">{current}/{target}{label === 'Kcal' ? '' : 'g'}</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
        </div>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-[#E7EAF3] px-4 py-3 mt-4 rounded-b-xl">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Daily totals vs target</p>
      <div className="flex gap-3">
        <StatusBar label="Kcal" current={totals.calories} target={targets.calories} color="#6B7280" />
        <StatusBar label="Protein" current={totals.protein} target={targets.protein} color="#3B82F6" />
        <StatusBar label="Carbs" current={totals.carbs} target={targets.carbs} color="#F97316" />
        <StatusBar label="Fats" current={totals.fats} target={targets.fats} color="#CA8A04" />
      </div>
    </div>
  );
}

export default function MealPlanTab({ plan }) {
  const meals = plan.meals || [];
  const targets = { calories: plan.calories, protein: plan.protein_g, carbs: plan.carbs_g, fats: plan.fats_g };

  return (
    <div className="space-y-3 pb-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{meals.length} meal{meals.length !== 1 ? 's' : ''} configured</p>
      </div>
      {meals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm font-medium">No meals configured yet</p>
          <p className="text-xs mt-1">Edit this plan to add meals and foods</p>
        </div>
      ) : (
        meals.map((meal, i) => <MealCard key={i} meal={meal} index={i} />)
      )}
      <DailyTotalBar meals={meals} targets={targets} />
    </div>
  );
}