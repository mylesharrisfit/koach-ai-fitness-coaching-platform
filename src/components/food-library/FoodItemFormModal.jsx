import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Protein', 'Carbs', 'Fats', 'Vegetables', 'Dairy', 'Fruits', 'Other'];
const UNITS = ['g', 'ml', 'oz', 'cup', 'tbsp', 'tsp', 'piece'];

function defaultForm(food) {
  return {
    name:         food?.name         ?? '',
    brand:        food?.brand        ?? '',
    serving_size: food?.serving_size ?? '',
    serving_unit: food?.serving_unit ?? 'g',
    calories:     food?.calories     ?? '',
    protein:      food?.protein      ?? '',
    carbs:        food?.carbs        ?? '',
    fats:         food?.fats         ?? '',
    fiber:        food?.fiber        ?? '',
    sugar:        food?.sugar        ?? '',
    category:     food?.category     ?? 'Protein',
  };
}

function MacroBar({ protein, carbs, fats }) {
  const p = parseFloat(protein) || 0;
  const c = parseFloat(carbs)   || 0;
  const f = parseFloat(fats)    || 0;
  const totalCal = p * 4 + c * 4 + f * 9;
  if (totalCal === 0) return null;

  const pPct = Math.round((p * 4 / totalCal) * 100);
  const cPct = Math.round((c * 4 / totalCal) * 100);
  const fPct = Math.max(100 - pPct - cPct, 0);

  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
        <div className="bg-primary rounded-full transition-all duration-300" style={{ width: `${pPct}%` }} />
        <div className="bg-warning rounded-full transition-all duration-300" style={{ width: `${cPct}%` }} />
        <div className="bg-destructive rounded-full transition-all duration-300" style={{ width: `${fPct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] font-semibold">
        <span className="text-primary">P {pPct}%</span>
        <span className="text-warning">C {cPct}%</span>
        <span className="text-destructive">F {fPct}%</span>
      </div>
    </div>
  );
}

export default function FoodItemFormModal({ open, onOpenChange, food, onSubmit }) {
  const [form, setForm] = useState(() => defaultForm(food));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(defaultForm(food));
  }, [open, food]);

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSubmit({
      ...form,
      serving_size: form.serving_size ? Number(form.serving_size) : undefined,
      calories:     form.calories     ? Number(form.calories)     : undefined,
      protein:      form.protein      ? Number(form.protein)      : undefined,
      carbs:        form.carbs        ? Number(form.carbs)        : undefined,
      fats:         form.fats         ? Number(form.fats)         : undefined,
      fiber:        form.fiber        ? Number(form.fiber)        : undefined,
      sugar:        form.sugar        ? Number(form.sugar)        : undefined,
    });
    setSaving(false);
  }

  const labelClass = 'text-xs font-semibold text-foreground block mb-1';
  const isEdit = !!food;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Food' : 'Add Food'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Name & Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={labelClass}>Name *</Label>
              <Input placeholder="e.g. Chicken Breast" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <Label className={labelClass}>Brand <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input placeholder="e.g. Myprotein" value={form.brand} onChange={e => set('brand', e.target.value)} />
            </div>
          </div>

          {/* Serving */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={labelClass}>Serving Size</Label>
              <Input type="number" placeholder="100" value={form.serving_size} onChange={e => set('serving_size', e.target.value)} />
            </div>
            <div>
              <Label className={labelClass}>Unit</Label>
              <select
                value={form.serving_unit}
                onChange={e => set('serving_unit', e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <Label className={labelClass}>Category</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => set('category', cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                    form.category === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Main macros */}
          <div>
            <Label className={labelClass}>Macros per serving</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { field: 'calories', label: 'Calories', unit: 'kcal', color: 'text-orange-600' },
                { field: 'protein',  label: 'Protein',  unit: 'g',    color: 'text-primary' },
                { field: 'carbs',    label: 'Carbs',    unit: 'g',    color: 'text-warning' },
                { field: 'fats',     label: 'Fats',     unit: 'g',    color: 'text-destructive' },
              ].map(({ field, label, unit, color }) => (
                <div key={field} className="text-center">
                  <p className={cn('text-[10px] font-semibold mb-1', color)}>{label}<br /><span className="text-muted-foreground font-normal">{unit}</span></p>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form[field]}
                    onChange={e => set(field, e.target.value)}
                    className="text-center text-sm"
                  />
                </div>
              ))}
            </div>
            <MacroBar protein={form.protein} carbs={form.carbs} fats={form.fats} />
          </div>

          {/* Optional macros */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={labelClass}>Fiber <span className="font-normal text-muted-foreground">(g, optional)</span></Label>
              <Input type="number" placeholder="0" value={form.fiber} onChange={e => set('fiber', e.target.value)} />
            </div>
            <div>
              <Label className={labelClass}>Sugar <span className="font-normal text-muted-foreground">(g, optional)</span></Label>
              <Input type="number" placeholder="0" value={form.sugar} onChange={e => set('sugar', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="gap-2 min-w-[100px]">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : isEdit ? 'Update Food' : 'Add Food'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}