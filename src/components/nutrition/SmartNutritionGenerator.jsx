import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, RefreshCw, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MEAL_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Pre-Workout', 'Post-Workout', 'Snack'];
const MEAL_TIMES = {
  Breakfast: '7:00 AM',
  Lunch: '12:30 PM',
  Dinner: '7:00 PM',
  'Pre-Workout': '4:00 PM',
  'Post-Workout': '6:30 PM',
  Snack: '3:00 PM',
};

function distributeToMeals(count) {
  const order = ['Breakfast', 'Lunch', 'Dinner', 'Pre-Workout', 'Post-Workout', 'Snack'];
  return order.slice(0, count);
}

function MacroBar({ cal, p, c, f }) {
  const total = p * 4 + c * 4 + f * 9 || 1;
  return (
    <div className="flex gap-1 h-1.5 rounded-full overflow-hidden mt-1">
      <div className="bg-red-400 rounded-full" style={{ width: `${(p * 4 / total) * 100}%` }} />
      <div className="bg-amber-400 rounded-full" style={{ width: `${(c * 4 / total) * 100}%` }} />
      <div className="bg-blue-400 rounded-full" style={{ width: `${(f * 9 / total) * 100}%` }} />
    </div>
  );
}

function MealCard({ meal, mIdx, onUpdate, onRemove, onRegenerateMeal }) {
  const [expanded, setExpanded] = useState(true);
  const [regenLoading, setRegenLoading] = useState(false);

  const totalCals = (meal.foods || []).reduce((s, f) => s + (f.calories || 0), 0);
  const totalP = (meal.foods || []).reduce((s, f) => s + (f.protein || 0), 0);
  const totalC = (meal.foods || []).reduce((s, f) => s + (f.carbs || 0), 0);
  const totalF = (meal.foods || []).reduce((s, f) => s + (f.fats || 0), 0);

  const handleRegen = async () => {
    setRegenLoading(true);
    await onRegenerateMeal(mIdx);
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
            <Input
              value={meal.meal_name}
              onChange={e => { e.stopPropagation(); onUpdate(mIdx, 'meal_name', e.target.value); }}
              onClick={e => e.stopPropagation()}
              className="font-semibold h-7 text-sm max-w-[140px] border-transparent bg-transparent px-0 hover:border-border focus:border-border hover:px-2 focus:px-2 transition-all"
            />
            <span className="text-xs text-muted-foreground">{meal.time}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground">{totalCals} cal</span>
            <span className="text-red-500">{totalP}g P</span>
            <span className="text-amber-500">{totalC}g C</span>
            <span className="text-blue-500">{totalF}g F</span>
          </div>
          <MacroBar cal={totalCals} p={totalP} c={totalC} f={totalF} />
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

      {/* Foods */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {(meal.foods || []).map((food, fIdx) => (
            <FoodRow key={fIdx} food={food} mIdx={mIdx} fIdx={fIdx} onUpdate={onUpdate} onRemoveFood={(mi, fi) => {
              const newFoods = meal.foods.filter((_, i) => i !== fi);
              onUpdate(mi, 'foods', newFoods);
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function FoodRow({ food, mIdx, fIdx, onUpdate, onRemoveFood }) {
  const updateField = (field, val) => {
    const updatedFood = { ...food, [field]: val };
    onUpdate(mIdx, `foods.${fIdx}`, updatedFood);
  };

  const removeSwap = (sIdx) => {
    const swaps = (food.swap_options || []).filter((_, i) => i !== sIdx);
    updateField('swap_options', swaps);
  };

  const addSwap = (swap) => {
    if (!swap.trim()) return;
    updateField('swap_options', [...(food.swap_options || []), swap]);
  };

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <Input
            value={food.food_name}
            onChange={e => updateField('food_name', e.target.value)}
            className="font-medium text-sm h-7 border-transparent bg-transparent px-0 hover:border-border focus:border-border hover:px-2 focus:px-2 transition-all"
            placeholder="Food name"
          />
          <span className="text-[11px] text-muted-foreground">{food.portion}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-medium">{food.calories}cal</span>
          <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">{food.protein}P</span>
          <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">{food.carbs}C</span>
          <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">{food.fats}F</span>
        </div>
        <button onClick={() => onRemoveFood(mIdx, fIdx)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-destructive transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Swap options */}
      {(food.swap_options || []).length > 0 && (
        <div className="flex flex-wrap gap-1 items-center pl-0">
          <span className="text-[10px] text-muted-foreground">Swaps:</span>
          {(food.swap_options || []).map((s, sIdx) => (
            <span key={sIdx} className="inline-flex items-center gap-1 text-[10px] bg-secondary border border-border px-2 py-0.5 rounded-full">
              {s}
              <button onClick={() => removeSwap(sIdx)} className="hover:text-destructive">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <SwapInput onAdd={addSwap} />
        </div>
      )}
    </div>
  );
}

function SwapInput({ onAdd }) {
  const [val, setVal] = useState('');
  return (
    <Input
      className="h-5 text-[10px] w-24 px-1.5"
      placeholder="+ swap"
      value={val}
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); onAdd(val); setVal(''); }
      }}
    />
  );
}

export default function SmartNutritionGenerator({ initialMeals, targets, onMealsChange }) {
  const [generating, setGenerating] = useState(false);
  const [params, setParams] = useState({
    calories: targets?.calories || '',
    protein_g: targets?.protein_g || '',
    carbs_g: targets?.carbs_g || '',
    fats_g: targets?.fats_g || '',
    meal_count: 4,
  });
  const [meals, setMeals] = useState(initialMeals || []);
  const hasGenerated = meals.length > 0;

  const updateMealsUp = (updated) => {
    setMeals(updated);
    onMealsChange(updated);
  };

  const generateMeals = async () => {
    if (!params.calories || !params.protein_g) {
      toast.error('Set calories and protein first');
      return;
    }
    setGenerating(true);
    const mealNames = distributeToMeals(Number(params.meal_count));
    const prompt = `You are a professional sports dietitian. Generate a ${params.meal_count}-meal nutrition plan with these daily targets:
- Calories: ${params.calories} kcal
- Protein: ${params.protein_g}g
- Carbs: ${params.carbs_g || 'balanced'}g  
- Fats: ${params.fats_g || 'balanced'}g

Meal categories to use (in order): ${mealNames.join(', ')}

For each meal, provide 2-3 food options. Each food item should have realistic macros that add up correctly to hit the daily targets when all meals are combined.

Return a JSON array of meals. Each meal: { meal_name, time, foods: [{ food_name, portion, calories, protein, carbs, fats, swap_options: [2 swap food alternatives] }] }

Make portions realistic, practical, and use whole foods. Swap options should be similar calorie/macro foods.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          meals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                meal_name: { type: 'string' },
                time: { type: 'string' },
                foods: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      food_name: { type: 'string' },
                      portion: { type: 'string' },
                      calories: { type: 'number' },
                      protein: { type: 'number' },
                      carbs: { type: 'number' },
                      fats: { type: 'number' },
                      swap_options: { type: 'array', items: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const generated = result?.meals || [];
    updateMealsUp(generated);
    setGenerating(false);
    toast.success('Meal plan generated!');
  };

  const regenerateMeal = async (mIdx) => {
    const meal = meals[mIdx];
    const prompt = `Regenerate only the "${meal.meal_name}" meal for a nutrition plan with these daily targets: ${params.calories}kcal, ${params.protein_g}g protein, ${params.carbs_g || 'balanced'}g carbs, ${params.fats_g || 'balanced'}g fats. 
The meal should contribute roughly 1/${meals.length} of the daily totals.
Return JSON: { meal_name, time, foods: [{ food_name, portion, calories, protein, carbs, fats, swap_options: [2 alternatives] }] }`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          meal_name: { type: 'string' },
          time: { type: 'string' },
          foods: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                food_name: { type: 'string' },
                portion: { type: 'string' },
                calories: { type: 'number' },
                protein: { type: 'number' },
                carbs: { type: 'number' },
                fats: { type: 'number' },
                swap_options: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    });

    const updated = meals.map((m, i) => i === mIdx ? result : m);
    updateMealsUp(updated);
  };

  const handleMealUpdate = (mIdx, field, value) => {
    if (field.startsWith('foods.')) {
      const fIdx = Number(field.split('.')[1]);
      const updated = meals.map((m, i) => {
        if (i !== mIdx) return m;
        return { ...m, foods: m.foods.map((f, fi) => fi === fIdx ? value : f) };
      });
      updateMealsUp(updated);
    } else {
      const updated = meals.map((m, i) => i !== mIdx ? m : { ...m, [field]: value });
      updateMealsUp(updated);
    }
  };

  const removeMeal = (mIdx) => {
    updateMealsUp(meals.filter((_, i) => i !== mIdx));
  };

  const totalCals = meals.reduce((s, m) => s + (m.foods || []).reduce((fs, f) => fs + (f.calories || 0), 0), 0);
  const totalP = meals.reduce((s, m) => s + (m.foods || []).reduce((fs, f) => fs + (f.protein || 0), 0), 0);
  const totalC = meals.reduce((s, m) => s + (m.foods || []).reduce((fs, f) => fs + (f.carbs || 0), 0), 0);
  const totalF = meals.reduce((s, m) => s + (m.foods || []).reduce((fs, f) => fs + (f.fats || 0), 0), 0);

  return (
    <div className="space-y-4">
      {/* Generator panel */}
      <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Auto-Generate Meal Plan</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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
            <select
              value={params.meal_count}
              onChange={e => setParams(p => ({ ...p, meal_count: Number(e.target.value) }))}
              className="h-8 w-full rounded-md border border-input bg-white px-2 text-sm"
            >
              {[3, 4, 5, 6].map(n => <option key={n} value={n}>{n} meals</option>)}
            </select>
          </div>
        </div>

        <Button onClick={generateMeals} disabled={generating} className="gap-2 w-full sm:w-auto">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? 'Generating…' : hasGenerated ? 'Regenerate All' : 'Generate Meal Plan'}
        </Button>
      </div>

      {/* Totals bar */}
      {hasGenerated && (
        <div className="flex items-center gap-4 px-1 text-xs">
          <span className="text-muted-foreground">Plan totals:</span>
          <span className="font-semibold text-foreground">{totalCals} kcal</span>
          {params.calories && (
            <span className={cn('font-medium', Math.abs(totalCals - Number(params.calories)) < 50 ? 'text-emerald-600' : 'text-amber-500')}>
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
              onUpdate={handleMealUpdate}
              onRemove={removeMeal}
              onRegenerateMeal={regenerateMeal}
            />
          ))}
        </div>
      )}
    </div>
  );
}