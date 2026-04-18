import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';

const MEAL_TEMPLATES = [
  { meal_name: 'Breakfast', time: '7:00 AM', foods: [{ food_name: 'Oats', portion: '1 cup', calories: 300, protein: 10, carbs: 54, fats: 5, swap_options: ['Greek yogurt bowl', 'Protein pancakes'] }] },
  { meal_name: 'Lunch', time: '12:30 PM', foods: [{ food_name: 'Chicken & Rice', portion: '200g + 1 cup', calories: 450, protein: 40, carbs: 45, fats: 8, swap_options: ['Tuna wrap', 'Turkey bowl'] }] },
  { meal_name: 'Dinner', time: '7:00 PM', foods: [{ food_name: 'Salmon & Veggies', portion: '180g + 2 cups', calories: 400, protein: 38, carbs: 20, fats: 18, swap_options: ['Steak & salad', 'Tofu stir fry'] }] },
  { meal_name: 'Pre-Workout', time: '3:00 PM', foods: [{ food_name: 'Banana + Protein Bar', portion: '1 each', calories: 280, protein: 20, carbs: 38, fats: 6, swap_options: ['Rice cake + PB', 'Fruit smoothie'] }] },
  { meal_name: 'Post-Workout', time: '6:00 PM', foods: [{ food_name: 'Protein Shake', portion: '1 scoop', calories: 150, protein: 25, carbs: 8, fats: 2, swap_options: ['Cottage cheese', 'Greek yogurt'] }] },
];

const HABIT_TEMPLATES = [
  'Eat a palm-sized portion of protein with every meal',
  'Fill half your plate with vegetables at lunch and dinner',
  'Drink 2–3L of water throughout the day',
  'Avoid processed snacks after 8pm',
  'Eat slowly and stop when 80% full',
];

const defaultForm = { title: '', description: '', tracking_mode: 'macros', calories: '', protein_g: '', carbs_g: '', fats_g: '', notes: '', meals: [] };

export default function NutritionForm({ open, onOpenChange, onSubmit, plan }) {
  const [form, setForm] = useState(defaultForm);
  const [expandedMeal, setExpandedMeal] = useState(null);

  useEffect(() => {
    if (plan) {
      setForm({ ...defaultForm, ...plan, calories: plan.calories || '', protein_g: plan.protein_g || '', carbs_g: plan.carbs_g || '', fats_g: plan.fats_g || '' });
    } else {
      setForm(defaultForm);
    }
  }, [plan, open]);

  const addMealTemplate = (template) => {
    setForm(f => ({ ...f, meals: [...(f.meals || []), { ...template }] }));
  };

  const addBlankMeal = () => {
    setForm(f => ({ ...f, meals: [...(f.meals || []), { meal_name: 'New Meal', time: '', habit_description: '', foods: [] }] }));
  };

  const removeMeal = (idx) => {
    setForm(f => ({ ...f, meals: f.meals.filter((_, i) => i !== idx) }));
  };

  const updateMeal = (idx, field, value) => {
    setForm(f => ({ ...f, meals: f.meals.map((m, i) => i !== idx ? m : { ...m, [field]: value }) }));
  };

  const addFood = (mIdx) => {
    setForm(f => ({
      ...f,
      meals: f.meals.map((m, i) => i !== mIdx ? m : {
        ...m, foods: [...(m.foods || []), { food_name: '', portion: '', calories: 0, protein: 0, carbs: 0, fats: 0, swap_options: [] }]
      })
    }));
  };

  const updateFood = (mIdx, fIdx, field, value) => {
    setForm(f => ({
      ...f,
      meals: f.meals.map((m, i) => i !== mIdx ? m : {
        ...m,
        foods: m.foods.map((food, fi) => fi !== fIdx ? food : { ...food, [field]: value })
      })
    }));
  };

  const removeFood = (mIdx, fIdx) => {
    setForm(f => ({
      ...f,
      meals: f.meals.map((m, i) => i !== mIdx ? m : { ...m, foods: m.foods.filter((_, fi) => fi !== fIdx) })
    }));
  };

  const addSwap = (mIdx, fIdx, swap) => {
    if (!swap.trim()) return;
    setForm(f => ({
      ...f,
      meals: f.meals.map((m, i) => i !== mIdx ? m : {
        ...m,
        foods: m.foods.map((food, fi) => fi !== fIdx ? food : { ...food, swap_options: [...(food.swap_options || []), swap] })
      })
    }));
  };

  const removeSwap = (mIdx, fIdx, sIdx) => {
    setForm(f => ({
      ...f,
      meals: f.meals.map((m, i) => i !== mIdx ? m : {
        ...m,
        foods: m.foods.map((food, fi) => fi !== fIdx ? food : { ...food, swap_options: food.swap_options.filter((_, si) => si !== sIdx) })
      })
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      calories: Number(form.calories) || 0,
      protein_g: Number(form.protein_g) || 0,
      carbs_g: Number(form.carbs_g) || 0,
      fats_g: Number(form.fats_g) || 0,
    });
    onOpenChange(false);
  };

  const isHabits = form.tracking_mode === 'habits';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{plan ? 'Edit Nutrition Plan' : 'Create Nutrition Plan'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Plan Name *</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="e.g., Lean Bulk Phase 1" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
            </div>
          </div>

          {/* Tracking mode toggle */}
          <div className="flex items-center gap-4 p-4 bg-secondary/40 rounded-xl">
            <div className="flex-1">
              <p className="font-medium text-sm">Non-Tracking (Habit) Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isHabits ? 'Client follows simple habits instead of counting macros' : 'Client tracks calories and macros precisely'}
              </p>
            </div>
            <Switch
              checked={isHabits}
              onCheckedChange={v => setForm({...form, tracking_mode: v ? 'habits' : 'macros'})}
            />
          </div>

          {/* Macro targets (only in macro mode) */}
          {!isHabits && (
            <div>
              <Label className="mb-2 block">Daily Targets</Label>
              <div className="grid grid-cols-4 gap-3">
                <div><Label className="text-xs">Calories</Label><Input type="number" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} /></div>
                <div><Label className="text-xs">Protein (g)</Label><Input type="number" value={form.protein_g} onChange={e => setForm({...form, protein_g: e.target.value})} /></div>
                <div><Label className="text-xs">Carbs (g)</Label><Input type="number" value={form.carbs_g} onChange={e => setForm({...form, carbs_g: e.target.value})} /></div>
                <div><Label className="text-xs">Fats (g)</Label><Input type="number" value={form.fats_g} onChange={e => setForm({...form, fats_g: e.target.value})} /></div>
              </div>
            </div>
          )}

          {/* Meals */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-sm">{isHabits ? 'Habit Guidelines' : 'Meals'}</h3>
              <div className="flex gap-2">
                {isHabits ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const habits = HABIT_TEMPLATES.map((h, i) => ({ meal_name: `Habit ${i + 1}`, habit_description: h, foods: [] }));
                    setForm(f => ({ ...f, meals: [...(f.meals || []), ...habits] }));
                  }}>
                    <Plus className="w-3 h-3 mr-1" /> Add All Habits
                  </Button>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {MEAL_TEMPLATES.map(t => (
                      <Button key={t.meal_name} type="button" variant="outline" size="sm" className="text-xs h-7"
                        onClick={() => addMealTemplate(t)}>
                        + {t.meal_name}
                      </Button>
                    ))}
                  </div>
                )}
                <Button type="button" variant="outline" size="sm" onClick={addBlankMeal}>
                  <Plus className="w-3 h-3 mr-1" /> Custom
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {(form.meals || []).map((meal, mIdx) => (
                <div key={mIdx} className="border border-border rounded-xl overflow-hidden bg-card">
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => setExpandedMeal(expandedMeal === mIdx ? null : mIdx)}
                  >
                    <div className="flex-1 flex items-center gap-3">
                      <Input
                        value={meal.meal_name}
                        onChange={e => { e.stopPropagation(); updateMeal(mIdx, 'meal_name', e.target.value); }}
                        onClick={e => e.stopPropagation()}
                        className="font-medium h-7 max-w-[160px] text-sm"
                      />
                      {!isHabits && (
                        <Input
                          value={meal.time || ''}
                          onChange={e => { e.stopPropagation(); updateMeal(mIdx, 'time', e.target.value); }}
                          onClick={e => e.stopPropagation()}
                          placeholder="Time"
                          className="h-7 max-w-[100px] text-xs text-muted-foreground"
                        />
                      )}
                      {!isHabits && <span className="text-xs text-muted-foreground">{meal.foods?.length || 0} foods</span>}
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                      onClick={e => { e.stopPropagation(); removeMeal(mIdx); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    {expandedMeal === mIdx ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  {expandedMeal === mIdx && (
                    <div className="p-3 border-t border-border space-y-3">
                      {isHabits ? (
                        <Textarea
                          value={meal.habit_description || ''}
                          onChange={e => updateMeal(mIdx, 'habit_description', e.target.value)}
                          placeholder="Describe the habit..."
                          rows={2}
                          className="text-sm"
                        />
                      ) : (
                        <>
                          {(meal.foods || []).map((food, fIdx) => (
                            <div key={fIdx} className="p-3 bg-secondary/30 rounded-lg space-y-2">
                              <div className="grid grid-cols-12 gap-2 items-center">
                                <Input className="col-span-4 h-8 text-xs" placeholder="Food name" value={food.food_name} onChange={e => updateFood(mIdx, fIdx, 'food_name', e.target.value)} />
                                <Input className="col-span-3 h-8 text-xs" placeholder="Portion" value={food.portion} onChange={e => updateFood(mIdx, fIdx, 'portion', e.target.value)} />
                                <Input className="col-span-1 h-8 text-xs" type="number" placeholder="Cal" value={food.calories || ''} onChange={e => updateFood(mIdx, fIdx, 'calories', Number(e.target.value))} />
                                <Input className="col-span-1 h-8 text-xs" type="number" placeholder="P" value={food.protein || ''} onChange={e => updateFood(mIdx, fIdx, 'protein', Number(e.target.value))} />
                                <Input className="col-span-1 h-8 text-xs" type="number" placeholder="C" value={food.carbs || ''} onChange={e => updateFood(mIdx, fIdx, 'carbs', Number(e.target.value))} />
                                <Button type="button" variant="ghost" size="icon" className="col-span-1 h-8 w-8 text-destructive" onClick={() => removeFood(mIdx, fIdx)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              {/* Food swaps */}
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="text-[10px] text-muted-foreground font-medium">Swaps:</span>
                                {(food.swap_options || []).map((s, sIdx) => (
                                  <Badge key={sIdx} variant="secondary" className="text-[10px] gap-1 pr-1">
                                    {s}
                                    <button type="button" onClick={() => removeSwap(mIdx, fIdx, sIdx)}><X className="w-2.5 h-2.5" /></button>
                                  </Badge>
                                ))}
                                <SwapInput onAdd={(s) => addSwap(mIdx, fIdx, s)} />
                              </div>
                            </div>
                          ))}
                          <Button type="button" variant="ghost" size="sm" className="text-primary text-xs" onClick={() => addFood(mIdx)}>
                            <Plus className="w-3 h-3 mr-1" /> Add Food
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{plan ? 'Update Plan' : 'Create Plan'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SwapInput({ onAdd }) {
  const [val, setVal] = useState('');
  return (
    <div className="flex gap-1">
      <Input
        className="h-6 text-[10px] w-28"
        placeholder="+ add swap"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(val); setVal(''); } }}
      />
    </div>
  );
}