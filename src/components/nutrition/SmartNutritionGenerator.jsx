import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function distributeToMeals(count) {
  const order = ['Breakfast', 'Lunch', 'Dinner', 'Pre-Workout', 'Post-Workout', 'Snack'];
  return order.slice(0, count);
}

function MacroBar({ p, c, f }) {
  const total = p * 4 + c * 4 + f * 9 || 1;
  return (
    <div className="flex h-1 rounded-full overflow-hidden bg-secondary mt-1.5">
      <div className="bg-red-400" style={{ width: `${(p * 4 / total) * 100}%` }} />
      <div className="bg-amber-400" style={{ width: `${(c * 4 / total) * 100}%` }} />
      <div className="bg-blue-400" style={{ width: `${(f * 9 / total) * 100}%` }} />
    </div>
  );
}

// A single meal option tab — shows its food list
function OptionFoods({ foods }) {
  return (
    <div className="divide-y divide-border">
      {(foods || []).map((food, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{food.food_name}</p>
            <p className="text-[11px] text-muted-foreground">{food.portion}</p>
          </div>
          <div className="flex items-center gap-1 text-[11px] shrink-0">
            <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-medium">{food.calories}cal</span>
            <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">{food.protein}P</span>
            <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">{food.carbs}C</span>
            <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">{food.fats}F</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// One meal card — with option tabs
function MealCard({ meal, mIdx, onRemove, onRegenerateMeal }) {
  const [expanded, setExpanded] = useState(true);
  const [activeOption, setActiveOption] = useState(0);
  const [regenLoading, setRegenLoading] = useState(false);

  const options = meal.options || [];
  const current = options[activeOption] || {};
  const totalCals = (current.foods || []).reduce((s, f) => s + (f.calories || 0), 0);
  const totalP = (current.foods || []).reduce((s, f) => s + (f.protein || 0), 0);
  const totalC = (current.foods || []).reduce((s, f) => s + (f.carbs || 0), 0);
  const totalF = (current.foods || []).reduce((s, f) => s + (f.fats || 0), 0);

  const handleRegen = async () => {
    setRegenLoading(true);
    await onRegenerateMeal(mIdx);
    setActiveOption(0);
    setRegenLoading(false);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">{meal.meal_name}</span>
            <span className="text-xs text-muted-foreground">{meal.time}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] mt-0.5">
            <span className="font-medium text-foreground">{totalCals} cal</span>
            <span className="text-red-500">{totalP}g P</span>
            <span className="text-amber-500">{totalC}g C</span>
            <span className="text-blue-500">{totalF}g F</span>
          </div>
          <MacroBar p={totalP} c={totalC} f={totalF} />
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={handleRegen}
            disabled={regenLoading}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
            title="Regenerate this meal"
          >
            {regenLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onRemove(mIdx)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Options + Foods */}
      {expanded && (
        <div className="border-t border-border">
          {/* Option tabs */}
          <div className="flex items-center gap-1 px-4 pt-3 pb-0">
            {options.map((opt, oIdx) => {
              const optCals = (opt.foods || []).reduce((s, f) => s + (f.calories || 0), 0);
              const optP = (opt.foods || []).reduce((s, f) => s + (f.protein || 0), 0);
              const isActive = oIdx === activeOption;
              return (
                <button
                  key={oIdx}
                  onClick={() => setActiveOption(oIdx)}
                  className={cn(
                    'flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-all flex-1',
                    isActive
                      ? 'bg-primary/5 border-primary/30 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/20 hover:bg-secondary/50'
                  )}
                >
                  <span className={cn('text-[11px] font-semibold', isActive ? 'text-primary' : 'text-muted-foreground')}>
                    Option {oIdx + 1}
                  </span>
                  <span className="text-[11px] font-medium text-foreground">{optCals} cal · {optP}g P</span>
                  <span className="text-[10px] text-muted-foreground truncate w-full">{opt.label || opt.foods?.[0]?.food_name || ''}</span>
                </button>
              );
            })}
          </div>

          {/* Active option foods */}
          <div className="mt-3">
            <OptionFoods foods={current.foods} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Schema ──────────────────────────────────────────────
const FOOD_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    food_name: { type: 'string' },
    portion: { type: 'string' },
    calories: { type: 'number' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fats: { type: 'number' },
  },
};

const OPTION_SCHEMA = {
  type: 'object',
  properties: {
    label: { type: 'string' },
    foods: { type: 'array', items: FOOD_ITEM_SCHEMA },
  },
};

const MEAL_SCHEMA = {
  type: 'object',
  properties: {
    meal_name: { type: 'string' },
    time: { type: 'string' },
    options: { type: 'array', items: OPTION_SCHEMA },
  },
};

export default function SmartNutritionGenerator({ initialMeals, targets, onMealsChange }) {
  const [generating, setGenerating] = useState(false);
  const [params, setParams] = useState({
    calories: targets?.calories || '',
    protein_g: targets?.protein_g || '',
    carbs_g: targets?.carbs_g || '',
    fats_g: targets?.fats_g || '',
    meal_count: 4,
    options_count: 2,
  });
  const [meals, setMeals] = useState(initialMeals || []);
  const hasGenerated = meals.length > 0;

  const syncUp = (updated) => {
    setMeals(updated);
    // Flatten to first option's foods for entity compatibility
    onMealsChange(updated.map(m => ({
      meal_name: m.meal_name,
      time: m.time,
      foods: (m.options?.[0]?.foods || []),
      options: m.options,
    })));
  };

  const generateMeals = async () => {
    if (!params.calories || !params.protein_g) {
      toast.error('Set calories and protein first');
      return;
    }
    setGenerating(true);
    const mealNames = distributeToMeals(Number(params.meal_count));
    const prompt = `You are a professional sports dietitian. Generate a ${params.meal_count}-meal nutrition plan with ${params.options_count} distinct OPTIONS per meal.

Daily targets:
- Calories: ${params.calories} kcal
- Protein: ${params.protein_g}g
- Carbs: ${params.carbs_g || 'balanced'}g
- Fats: ${params.fats_g || 'balanced'}g

Meals: ${mealNames.join(', ')}

Rules:
- Each meal has exactly ${params.options_count} options. Options are DIFFERENT meal choices (e.g., Option 1 = eggs & oats, Option 2 = yogurt & fruit).
- All options for the same meal must have similar calorie/macro totals (within 5% of each other).
- Each option has 2-4 food items with accurate individual macros.
- Give each option a short label (e.g., "High Protein", "Plant-Based", "Quick & Easy").
- All meals combined should hit the daily targets.

Return JSON with a "meals" array.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          meals: { type: 'array', items: MEAL_SCHEMA },
        },
      },
    });

    const generated = result?.meals || [];
    syncUp(generated);
    setGenerating(false);
    toast.success('Meal plan generated!');
  };

  const regenerateMeal = async (mIdx) => {
    const meal = meals[mIdx];
    const prompt = `Regenerate the "${meal.meal_name}" meal with ${params.options_count} distinct options.
Daily targets: ${params.calories}kcal, ${params.protein_g}g protein, ${params.carbs_g || 'balanced'}g carbs, ${params.fats_g || 'balanced'}g fats.
This meal = roughly 1/${meals.length} of daily totals.
Each option should have similar calories/macros. Give each option a short label.
Return a single meal JSON object.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: MEAL_SCHEMA,
    });

    if (result?.meal_name) {
      syncUp(meals.map((m, i) => i === mIdx ? result : m));
    }
  };

  const removeMeal = (mIdx) => syncUp(meals.filter((_, i) => i !== mIdx));

  // Totals from first option of each meal
  const totalCals = meals.reduce((s, m) => s + (m.options?.[0]?.foods || m.foods || []).reduce((fs, f) => fs + (f.calories || 0), 0), 0);
  const totalP = meals.reduce((s, m) => s + (m.options?.[0]?.foods || m.foods || []).reduce((fs, f) => fs + (f.protein || 0), 0), 0);
  const totalC = meals.reduce((s, m) => s + (m.options?.[0]?.foods || m.foods || []).reduce((fs, f) => fs + (f.carbs || 0), 0), 0);
  const totalF = meals.reduce((s, m) => s + (m.options?.[0]?.foods || m.foods || []).reduce((fs, f) => fs + (f.fats || 0), 0), 0);

  return (
    <div className="space-y-4">
      {/* Generator panel */}
      <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Auto-Generate Meal Plan</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <div>
            <Label className="text-[11px]">Calories</Label>
            <Input type="number" placeholder="2000" value={params.calories}
              onChange={e => setParams(p => ({ ...p, calories: e.target.value }))} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-[11px]">Protein (g)</Label>
            <Input type="number" placeholder="180" value={params.protein_g}
              onChange={e => setParams(p => ({ ...p, protein_g: e.target.value }))} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-[11px]">Carbs (g)</Label>
            <Input type="number" placeholder="200" value={params.carbs_g}
              onChange={e => setParams(p => ({ ...p, carbs_g: e.target.value }))} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-[11px]">Fats (g)</Label>
            <Input type="number" placeholder="60" value={params.fats_g}
              onChange={e => setParams(p => ({ ...p, fats_g: e.target.value }))} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-[11px]">Meals</Label>
            <select value={params.meal_count} onChange={e => setParams(p => ({ ...p, meal_count: Number(e.target.value) }))}
              className="h-8 w-full rounded-md border border-input bg-white px-2 text-sm">
              {[3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[11px]">Options / meal</Label>
            <select value={params.options_count} onChange={e => setParams(p => ({ ...p, options_count: Number(e.target.value) }))}
              className="h-8 w-full rounded-md border border-input bg-white px-2 text-sm">
              {[2, 3].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <Button onClick={generateMeals} disabled={generating} className="gap-2 w-full sm:w-auto">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? 'Generating…' : hasGenerated ? 'Regenerate All' : 'Generate Meal Plan'}
        </Button>
      </div>

      {/* Totals */}
      {hasGenerated && (
        <div className="flex flex-wrap items-center gap-3 px-1 text-xs">
          <span className="text-muted-foreground">Plan totals (Option 1):</span>
          <span className="font-semibold text-foreground">{totalCals} kcal</span>
          {params.calories && (
            <span className={cn('font-medium', Math.abs(totalCals - Number(params.calories)) < 80 ? 'text-emerald-600' : 'text-amber-500')}>
              {totalCals > Number(params.calories) ? '+' : ''}{totalCals - Number(params.calories)} vs target
            </span>
          )}
          <span className="text-red-500">{totalP}g P</span>
          <span className="text-amber-500">{totalC}g C</span>
          <span className="text-blue-500">{totalF}g F</span>
        </div>
      )}

      {/* Meal cards */}
      {hasGenerated && (
        <div className="space-y-3">
          {meals.map((meal, mIdx) => (
            <MealCard
              key={mIdx}
              meal={meal}
              mIdx={mIdx}
              onRemove={removeMeal}
              onRegenerateMeal={regenerateMeal}
            />
          ))}
        </div>
      )}
    </div>
  );
}