import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, ChevronUp, ChevronDown, Loader2, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const EMOJIS = ['🥗', '🔥', '💪', '🥦', '🍗', '⚡', '🏆', '🌿'];

function defaultForm(plan, initialMeals) {
  return {
    title: plan?.title ?? '',
    description: plan?.description ?? '',
    emoji: plan?.emoji ?? '🥗',
    tracking_mode: plan?.tracking_mode ?? 'macros',
    is_template: plan?.is_template ?? false,
    calories: plan?.calories ?? '',
    protein: plan?.protein_g ?? '',
    carbs: plan?.carbs_g ?? '',
    fats: plan?.fats_g ?? '',
    meals: plan?.meals?.length
      ? plan.meals.map(m => ({ name: m.meal_name ?? '', calories: m.calories ?? '', notes: m.habit_description ?? '' }))
      : (initialMeals ?? []),
    assigned_clients: plan?.assigned_clients ?? [],
  };
}

// ─── Macro Ratio Bar ─────────────────────────────────────────────────────────
function MacroRatioBar({ protein, carbs, fats }) {
  const p = parseFloat(protein) || 0;
  const c = parseFloat(carbs) || 0;
  const f = parseFloat(fats) || 0;
  const totalCal = p * 4 + c * 4 + f * 9;
  if (totalCal === 0) return null;

  const pPct = Math.round((p * 4 / totalCal) * 100);
  const cPct = Math.round((c * 4 / totalCal) * 100);
  const fPct = 100 - pPct - cPct;

  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        <div className="bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${pPct}%` }} />
        <div className="bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${cPct}%` }} />
        <div className="bg-red-400 rounded-full transition-all duration-300" style={{ width: `${Math.max(fPct, 0)}%` }} />
      </div>
      <div className="flex justify-between text-[10px] font-semibold">
        <span className="text-blue-500">Protein {pPct}%</span>
        <span className="text-amber-500">Carbs {cPct}%</span>
        <span className="text-red-500">Fats {Math.max(fPct, 0)}%</span>
      </div>
    </div>
  );
}

// ─── Client Picker ────────────────────────────────────────────────────────────
function ClientPicker({ selected, onChange }) {
  const [search, setSearch] = useState('');
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-picker'],
    queryFn: () => base44.entities.Client.list(),
  });

  const filtered = clients.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
  const selectedClients = clients.filter(c => selected.includes(c.id));
  const overflow = selectedClients.length > 6 ? selectedClients.length - 6 : 0;

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {selectedClients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedClients.slice(0, 6).map(c => (
            <span key={c.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
              {c.name}
              <button onClick={() => toggle(c.id)} className="opacity-60 hover:opacity-100 text-xs leading-none">×</button>
            </span>
          ))}
          {overflow > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-semibold">+{overflow} more</span>
          )}
        </div>
      )}

      {/* Search */}
      <Input
        placeholder="Search clients..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="text-sm"
      />

      {/* List */}
      <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1">
        {filtered.map(c => (
          <label key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(c.id)}
              onChange={() => toggle(c.id)}
              className="rounded border-input accent-primary"
            />
            <span className="text-sm font-medium text-foreground">{c.name}</span>
            {c.lifecycle_status && (
              <span className="ml-auto text-[10px] text-muted-foreground capitalize">{c.lifecycle_status}</span>
            )}
          </label>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No clients found</p>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NutritionForm({ open, onOpenChange, onSubmit, plan, initialMeals }) {
  const isEdit = !!plan;
  const [form, setForm] = useState(() => defaultForm(plan, initialMeals));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(defaultForm(plan, initialMeals));
  }, [open, plan]);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  // Meals
  function addMeal() {
    setForm(f => ({ ...f, meals: [...f.meals, { name: '', calories: '', notes: '' }] }));
  }
  function updateMeal(i, field, val) {
    setForm(f => {
      const meals = [...f.meals];
      meals[i] = { ...meals[i], [field]: val };
      return { ...f, meals };
    });
  }
  function removeMeal(i) {
    setForm(f => ({ ...f, meals: f.meals.filter((_, idx) => idx !== i) }));
  }
  function moveMeal(i, dir) {
    setForm(f => {
      const meals = [...f.meals];
      const j = i + dir;
      if (j < 0 || j >= meals.length) return f;
      [meals[i], meals[j]] = [meals[j], meals[i]];
      return { ...f, meals };
    });
  }

  async function handleSubmit() {
    if (!form.title.trim()) return;
    setSaving(true);
    await onSubmit({
      title: form.title,
      description: form.description,
      emoji: form.emoji,
      tracking_mode: form.tracking_mode,
      is_template: form.is_template,
      calories: form.calories ? Number(form.calories) : undefined,
      protein_g: form.protein ? Number(form.protein) : undefined,
      carbs_g: form.carbs ? Number(form.carbs) : undefined,
      fats_g: form.fats ? Number(form.fats) : undefined,
      meals: form.meals.map(m => ({ meal_name: m.name, calories: m.calories ? Number(m.calories) : undefined, habit_description: m.notes })),
      assigned_clients: form.assigned_clients,
    });
    setSaving(false);
    onOpenChange(false);
  }

  const sectionClass = "space-y-4 pb-6 border-b border-border";
  const labelClass = "text-xs font-semibold text-foreground block mb-1.5";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-6 py-5 border-b border-border flex-shrink-0">
          <SheetTitle className="font-heading font-bold text-lg">
            {isEdit ? 'Edit Plan' : 'New Plan'}
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* SECTION 1 — Basics */}
          <div className={sectionClass}>
            <h3 className="text-sm font-bold text-foreground">Plan Basics</h3>

            <div>
              <label className={labelClass}>Plan Title *</label>
              <Input
                placeholder="e.g. Fat Loss Phase 1"
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Brief description of this plan..."
                rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            <div>
              <label className={labelClass}>Emoji</label>
              <div className="flex gap-2 flex-wrap">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => set('emoji', e)}
                    className={cn(
                      'w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all',
                      form.emoji === e ? 'border-primary bg-accent/60 shadow-sm' : 'border-border bg-white hover:border-primary/40'
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Tracking Mode</label>
              <div className="flex rounded-lg border border-input overflow-hidden w-fit text-sm font-semibold">
                {[{ id: 'macros', label: 'Macro Tracking' }, { id: 'habits', label: 'Habit Mode' }].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => set('tracking_mode', opt.id)}
                    className={cn(
                      'px-4 py-2 transition-colors',
                      form.tracking_mode === opt.id ? 'bg-primary text-white' : 'bg-white text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_template}
                onChange={e => set('is_template', e.target.checked)}
                className="rounded border-input accent-primary"
              />
              <span className="text-sm font-medium text-foreground">Save as reusable template</span>
            </label>
          </div>

          {/* SECTION 2 — Macros */}
          {form.tracking_mode === 'macros' && (
            <div className={sectionClass}>
              <h3 className="text-sm font-bold text-foreground">Macro Targets</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { field: 'calories', label: 'Calories', unit: 'kcal' },
                  { field: 'protein',  label: 'Protein',  unit: 'g' },
                  { field: 'carbs',    label: 'Carbs',    unit: 'g' },
                  { field: 'fats',     label: 'Fats',     unit: 'g' },
                ].map(({ field, label, unit }) => (
                  <div key={field}>
                    <label className={labelClass}>{label} <span className="font-normal text-muted-foreground">({unit})</span></label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={form[field]}
                      onChange={e => set(field, e.target.value)}
                      className="text-center"
                    />
                  </div>
                ))}
              </div>
              <MacroRatioBar protein={form.protein} carbs={form.carbs} fats={form.fats} />
            </div>
          )}

          {/* SECTION 3 — Meals */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Meal Structure</h3>
              <Button size="sm" variant="outline" onClick={addMeal} className="gap-1.5 h-8 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Meal
              </Button>
            </div>

            <AnimatePresence initial={false}>
              {form.meals.map((meal, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveMeal(i, -1)} disabled={i === 0} className="p-0.5 hover:text-primary disabled:opacity-30">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveMeal(i, 1)} disabled={i === form.meals.length - 1} className="p-0.5 hover:text-primary disabled:opacity-30">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <Input
                        placeholder="Meal name (e.g. Breakfast)"
                        value={meal.name}
                        onChange={e => updateMeal(i, 'name', e.target.value)}
                        className="flex-1 text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="kcal"
                        value={meal.calories}
                        onChange={e => updateMeal(i, 'calories', e.target.value)}
                        className="w-20 text-sm text-center"
                      />
                      <button onClick={() => removeMeal(i)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={meal.notes}
                      onChange={e => updateMeal(i, 'notes', e.target.value)}
                      placeholder="Food suggestions or instructions..."
                      rows={2}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {form.meals.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No meals added yet. Click "+ Add Meal" to start.</p>
            )}
          </div>

          {/* SECTION 4 — Assign Clients */}
          <div className="space-y-4 pb-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">Assign to Clients</h3>
              <span className="text-xs text-muted-foreground">(optional)</span>
            </div>
            <ClientPicker
              selected={form.assigned_clients}
              onChange={val => set('assigned_clients', val)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border px-6 py-4 flex items-center justify-end gap-3 bg-background">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.title.trim()} className="gap-2 min-w-[110px]">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Plan'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}