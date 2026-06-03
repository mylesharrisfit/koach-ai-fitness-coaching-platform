import React, { useState } from 'react';
import { Plus, BookmarkPlus, Loader2, ChevronDown } from 'lucide-react';
import { scaleMacros, gramsFromServing } from '@/lib/nutritionUtils';

const UNITS = ['g', 'oz', 'cup', 'tbsp', 'tsp', 'piece', 'serving'];

function MacroChip({ emoji, value, unit = 'g', color }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: color + '18', color }}>
      {emoji} {value}{unit}
    </span>
  );
}

export default function FoodResultCard({ food, onAdd, onSave, onTap }) {
  const [qty, setQty] = useState(100);
  const [unit, setUnit] = useState('g');
  const [saving, setSaving] = useState(false);
  const [showServing, setShowServing] = useState(false);

  const grams = gramsFromServing(qty, unit);
  const m = scaleMacros(food, grams);

  const handleAdd = (e) => {
    e.stopPropagation();
    onAdd({ ...food, ...m, serving_quantity: qty, serving_unit: unit });
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    setSaving(true);
    await onSave(food);
    setSaving(false);
  };

  return (
    <div className="px-4 py-3 hover:bg-secondary/30 transition-colors border-b border-border last:border-0">
      {/* Top row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onTap(food)}>
          <p className="text-sm font-bold text-foreground leading-snug">{food.name}</p>
          {(food.category || food.brand) && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {[food.category, food.brand].filter(Boolean).join(' · ')}
            </p>
          )}
          {/* Macro chips */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            <MacroChip emoji="🔥" value={m.calories} unit="cal" color="#EA580C" />
            <MacroChip emoji="💪" value={m.protein} color="#2563EB" />
            <MacroChip emoji="🌾" value={m.carbs} color="#D97706" />
            <MacroChip emoji="🥑" value={m.fats} color="#16A34A" />
          </div>
        </div>
        {/* Actions */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button onClick={handleAdd}
            className="flex items-center gap-1 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
          <button onClick={handleSave} disabled={saving}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Serving adjuster toggle */}
      <button
        onClick={() => setShowServing(v => !v)}
        className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown className={`w-3 h-3 transition-transform ${showServing ? 'rotate-180' : ''}`} />
        Adjust serving ({qty}{unit})
      </button>

      {showServing && (
        <div className="flex items-center gap-2 mt-2 pl-1">
          <input
            type="number" min={1} step={unit === 'g' ? 10 : 0.5}
            value={qty}
            onChange={e => setQty(Math.max(0.1, Number(e.target.value)))}
            className="w-20 h-8 text-sm text-center border border-input rounded-lg bg-background"
          />
          <select
            value={unit} onChange={e => setUnit(e.target.value)}
            className="h-8 px-2 text-xs border border-input rounded-lg bg-background">
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">= {m.calories} cal</span>
        </div>
      )}
    </div>
  );
}