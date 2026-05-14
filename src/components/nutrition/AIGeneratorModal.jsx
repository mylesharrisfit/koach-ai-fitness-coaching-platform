import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STYLES = ['Balanced', 'High Protein', 'Low Carb', 'Keto', 'Plant-Based', 'Performance', 'Fat Loss', 'Muscle Building'];
const CUISINES = ['Any', 'American', 'Mediterranean', 'Asian', 'Mexican', 'Italian', 'Middle Eastern'];
const DIFFICULTIES = ['Easy', 'Moderate', 'Advanced'];

const FOOD_SCHEMA = { type: 'object', properties: { food_name: { type: 'string' }, portion: { type: 'string' }, calories: { type: 'number' }, protein: { type: 'number' }, carbs: { type: 'number' }, fats: { type: 'number' } } };
const MEAL_SCHEMA = { type: 'object', properties: { meal_name: { type: 'string' }, time: { type: 'string' }, options: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, foods: { type: 'array', items: FOOD_SCHEMA } } } } } };

function MacroBadge({ label, value, unit = 'g', color }) {
  return (
    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${color}`}>{value}{unit} {label}</span>
  );
}

function MealResultCard({ meal, onRemove, onRegen, regenning }) {
  const [open, setOpen] = useState(true);
  const [activeOpt, setActiveOpt] = useState(0);
  const opts = meal.options || [];
  const cur = opts[activeOpt] || {};
  const cals = (cur.foods || []).reduce((s, f) => s + (f.calories || 0), 0);
  const prot = (cur.foods || []).reduce((s, f) => s + (f.protein || 0), 0);
  const carb = (cur.foods || []).reduce((s, f) => s + (f.carbs || 0), 0);
  const fat = (cur.foods || []).reduce((s, f) => s + (f.fats || 0), 0);

  return (
    <div className="border border-[#E7EAF3] rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/20 transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{meal.meal_name}</span>
            <span className="text-xs text-muted-foreground">{meal.time}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <MacroBadge label="kcal" value={cals} unit="" color="bg-orange-50 text-orange-600" />
            <MacroBadge label="P" value={prot} color="bg-red-50 text-red-600" />
            <MacroBadge label="C" value={carb} color="bg-amber-50 text-amber-600" />
            <MacroBadge label="F" value={fat} color="bg-blue-50 text-blue-600" />
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={onRegen} disabled={regenning} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
            {regenning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onRemove} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {open && (
        <div className="border-t border-[#E7EAF3]">
          {opts.length > 1 && (
            <div className="flex gap-1.5 px-4 pt-3 pb-1">
              {opts.map((o, i) => (
                <button key={i} onClick={() => setActiveOpt(i)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border', i === activeOpt ? 'bg-primary text-white border-primary' : 'bg-secondary border-[#E7EAF3] text-muted-foreground hover:border-primary/30')}>
                  {o.label || `Option ${i + 1}`}
                </button>
              ))}
            </div>
          )}
          <div className="divide-y divide-[#F1F4FA]">
            {(cur.foods || []).map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{f.food_name}</p>
                  <p className="text-[11px] text-muted-foreground">{f.portion}</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] flex-shrink-0">
                  <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-bold">{f.calories}</span>
                  <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">{f.protein}P</span>
                  <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">{f.carbs}C</span>
                  <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">{f.fats}F</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIGeneratorModal({ open, onOpenChange, onApply }) {
  const [step, setStep] = useState('config'); // config | results
  const [generating, setGenerating] = useState(false);
  const [meals, setMeals] = useState([]);
  const [regenIdx, setRegenIdx] = useState(null);
  const [params, setParams] = useState({
    calories: '', protein_g: '', carbs_g: '', fats_g: '',
    meal_count: 4, options_count: 2,
    style: 'Balanced', cuisine: 'Any', difficulty: 'Easy',
    high_carb_day: false, notes: '',
  });

  const p = (k, v) => setParams(prev => ({ ...prev, [k]: v }));

  const totalCals = meals.reduce((s, m) => s + (m.options?.[0]?.foods || []).reduce((fs, f) => fs + (f.calories || 0), 0), 0);
  const totalP = meals.reduce((s, m) => s + (m.options?.[0]?.foods || []).reduce((fs, f) => fs + (f.protein || 0), 0), 0);

  const generate = async () => {
    if (!params.calories || !params.protein_g) { toast.error('Set calories and protein targets first'); return; }
    setGenerating(true);
    const mealNames = ['Breakfast', 'Lunch', 'Dinner', 'Pre-Workout', 'Post-Workout', 'Snack'].slice(0, params.meal_count);
    const prompt = `You are an elite sports dietitian. Generate a premium ${params.meal_count}-meal nutrition plan with ${params.options_count} distinct OPTIONS per meal.

Daily targets: ${params.calories} kcal, Protein: ${params.protein_g}g, Carbs: ${params.carbs_g || 'balanced'}g, Fats: ${params.fats_g || 'balanced'}g
Style: ${params.style} | Cuisine: ${params.cuisine} | Difficulty: ${params.difficulty}
${params.high_carb_day ? 'This is a HIGH CARB training day — increase carbs by 25%.' : ''}
${params.notes ? `Coach notes: ${params.notes}` : ''}

Meals: ${mealNames.join(', ')}

Rules:
- Each meal has exactly ${params.options_count} options (different food choices with similar macro totals within 5%).
- Each option has 2–4 food items with accurate individual macros.
- Give each option a short descriptive label (e.g., "High Protein", "Quick & Easy", "Plant-Based").
- All meals combined should hit daily targets.
- Make food choices realistic, appealing, and macro-accurate.

Return JSON with a "meals" array.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: { type: 'object', properties: { meals: { type: 'array', items: MEAL_SCHEMA } } },
    });

    const generated = (result?.meals || []).map(m => ({ ...m, tags: [] }));
    setMeals(generated);
    setGenerating(false);
    setStep('results');
    toast.success('Meal plan generated!');
  };

  const regenMeal = async (idx) => {
    setRegenIdx(idx);
    const meal = meals[idx];
    const prompt = `Regenerate the "${meal.meal_name}" meal with ${params.options_count} distinct options.
Daily targets: ${params.calories}kcal, ${params.protein_g}g protein. This meal = ~1/${meals.length} of daily totals.
Style: ${params.style}, Cuisine: ${params.cuisine}
Return a single meal JSON object with meal_name, time, and options array.`;
    const result = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: MEAL_SCHEMA });
    if (result?.meal_name) setMeals(ms => ms.map((m, i) => i === idx ? { ...result, tags: [] } : m));
    setRegenIdx(null);
  };

  const removeMeal = (idx) => setMeals(ms => ms.filter((_, i) => i !== idx));

  const handleApply = () => {
    onApply({
      meals: meals.map(m => ({
        meal_name: m.meal_name,
        time: m.time,
        tags: m.tags || [],
        foods: (m.options?.[0]?.foods || []),
        options: m.options,
      })),
    });
    onOpenChange(false);
    setStep('config');
    setMeals([]);
  };

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) { setStep('config'); setMeals([]); } }}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E7EAF3] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-heading text-base">AI Meal Plan Generator</DialogTitle>
              <p className="text-xs text-muted-foreground">Build a full nutrition plan in seconds</p>
            </div>
          </div>
          {/* Step tabs */}
          <div className="flex gap-1 mt-4 bg-secondary/50 rounded-xl p-1 w-fit">
            {['config', 'results'].map(s => (
              <button key={s} onClick={() => s === 'results' && meals.length > 0 && setStep(s)}
                className={cn('px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize', step === s ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground')}>
                {s === 'config' ? '① Configure' : `② Results${meals.length > 0 ? ` (${meals.length})` : ''}`}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {step === 'config' && (
            <div className="p-6 space-y-6">
              {/* Macro targets */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Daily Macro Targets</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Calories', key: 'calories', placeholder: '2000', unit: 'kcal' },
                    { label: 'Protein', key: 'protein_g', placeholder: '180', unit: 'g' },
                    { label: 'Carbs', key: 'carbs_g', placeholder: '200', unit: 'g' },
                    { label: 'Fats', key: 'fats_g', placeholder: '65', unit: 'g' },
                  ].map(({ label, key, placeholder, unit }) => (
                    <div key={key}>
                      <Label className="text-xs text-muted-foreground">{label} ({unit})</Label>
                      <Input type="number" placeholder={placeholder} value={params[key]}
                        onChange={e => p(key, e.target.value)} className="mt-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Meal config */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Number of Meals</Label>
                  <div className="flex gap-2 mt-1">
                    {[3, 4, 5, 6].map(n => (
                      <button key={n} onClick={() => p('meal_count', n)}
                        className={cn('flex-1 py-2 rounded-xl text-sm font-bold border transition-all', params.meal_count === n ? 'bg-primary text-white border-primary' : 'border-[#E7EAF3] text-muted-foreground hover:border-primary/30')}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Options per Meal</Label>
                  <div className="flex gap-2 mt-1">
                    {[1, 2, 3].map(n => (
                      <button key={n} onClick={() => p('options_count', n)}
                        className={cn('flex-1 py-2 rounded-xl text-sm font-bold border transition-all', params.options_count === n ? 'bg-primary text-white border-primary' : 'border-[#E7EAF3] text-muted-foreground hover:border-primary/30')}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Style & cuisine */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Plan Style</Label>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map(s => (
                      <button key={s} onClick={() => p('style', s)}
                        className={cn('px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all', params.style === s ? 'bg-primary text-white border-primary shadow-sm' : 'border-[#E7EAF3] text-muted-foreground hover:border-primary/30')}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Cuisine Preference</Label>
                  <div className="flex flex-wrap gap-2">
                    {CUISINES.map(c => (
                      <button key={c} onClick={() => p('cuisine', c)}
                        className={cn('px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all', params.cuisine === c ? 'bg-primary text-white border-primary' : 'border-[#E7EAF3] text-muted-foreground hover:border-primary/30')}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Prep Difficulty</Label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map(d => (
                      <button key={d} onClick={() => p('difficulty', d)}
                        className={cn('flex-1 py-2 rounded-xl text-xs font-semibold border transition-all', params.difficulty === d ? 'bg-primary text-white border-primary' : 'border-[#E7EAF3] text-muted-foreground hover:border-primary/30')}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* High carb toggle */}
              <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">High Carb / Training Day</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Increases carb allocation for performance days</p>
                </div>
                <button onClick={() => p('high_carb_day', !params.high_carb_day)}
                  className={cn('w-12 h-6 rounded-full transition-all relative', params.high_carb_day ? 'bg-amber-500' : 'bg-gray-200')}>
                  <div className={cn('w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all', params.high_carb_day ? 'left-6' : 'left-0.5')} />
                </button>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs text-muted-foreground">Additional Notes (optional)</Label>
                <textarea value={params.notes} onChange={e => p('notes', e.target.value)}
                  placeholder="e.g. client avoids dairy, prefers quick meals, budget-friendly..."
                  rows={2}
                  className="w-full mt-1 px-4 py-3 rounded-xl border border-[#E7EAF3] text-sm resize-none focus:outline-none focus:border-primary/40 transition-colors" />
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="p-6 space-y-4">
              {/* Totals banner */}
              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-2xl border border-[#E7EAF3] flex-wrap">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-foreground">{totalCals} kcal</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground">Protein</p>
                  <p className="text-base font-bold text-red-500">{totalP}g</p>
                </div>
                <div className="ml-auto">
                  <Button variant="outline" size="sm" onClick={generate} disabled={generating} className="gap-2">
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate All
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {meals.map((meal, i) => (
                  <MealResultCard
                    key={i}
                    meal={meal}
                    onRemove={() => removeMeal(i)}
                    onRegen={() => regenMeal(i)}
                    regenning={regenIdx === i}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E7EAF3] flex-shrink-0 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {step === 'config' ? (
            <Button onClick={generate} disabled={generating || !params.calories || !params.protein_g} className="gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Generating…' : 'Generate Plan'}
            </Button>
          ) : (
            <Button onClick={handleApply} disabled={meals.length === 0} className="gap-2">
              Apply to Plan
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}