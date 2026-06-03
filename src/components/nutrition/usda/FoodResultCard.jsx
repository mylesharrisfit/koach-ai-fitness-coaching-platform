import React, { useState } from 'react';
import { Plus, BookmarkPlus, Loader2, ChevronDown, ShieldCheck } from 'lucide-react';
import { scaleMacros, gramsFromServing } from '@/lib/nutritionUtils';

const UNITS = ['g', 'oz', 'cup', 'tbsp', 'tsp', 'piece', 'serving'];

// Derive a clean source tag from food data
function getSourceTag(food) {
  if (food.source === 'custom') return { label: 'My Food', style: 'bg-blue-100 text-blue-700' };
  if (food.brand)               return { label: food.brand, style: 'bg-gray-100 text-gray-600' };
  if (food.category)            return { label: food.category, style: 'bg-gray-100 text-gray-600' };
  return { label: 'Generic', style: 'bg-gray-100 text-gray-500' };
}

export default function FoodResultCard({ food, onAdd, onSave, onTap }) {
  const [qty, setQty]           = useState(100);
  const [unit, setUnit]         = useState('g');
  const [saving, setSaving]     = useState(false);
  const [showServing, setShowServing] = useState(false);

  const grams = gramsFromServing(qty, unit);
  const m     = scaleMacros(food, grams);
  const sourceTag = getSourceTag(food);

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
    <div className="px-4 py-3.5 hover:bg-secondary/30 transition-colors border-b border-border last:border-0">

      {/* ── Main row ── */}
      <div className="flex items-start gap-3">

        {/* Left: food info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onTap && onTap(food)}>

          {/* Full food name — never truncated to one word */}
          <p className="text-sm font-bold text-foreground leading-snug">
            {food.name}
          </p>

          {/* Source + category row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sourceTag.style}`}>
              {sourceTag.label}
            </span>
            {food.category && food.brand && (
              <span className="text-[10px] text-muted-foreground">{food.category}</span>
            )}
            {food.source !== 'custom' && (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold">
                <ShieldCheck className="w-3 h-3" />USDA Verified
              </span>
            )}
          </div>

          {/* Macros per 100g */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] text-muted-foreground font-medium mr-0.5">per 100g:</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">🔥 {food.calories}cal</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50   text-blue-600">💪 {food.protein}g</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50  text-amber-600">🌾 {food.carbs}g</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50  text-green-700">🥑 {food.fats}g</span>
          </div>

          {/* Typical serving hint */}
          {food.serving_size && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Typical serving: {food.serving_size}
            </p>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button onClick={handleAdd}
            className="flex items-center gap-1 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
          <button onClick={handleSave} disabled={saving}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground"
            title="Save to My Foods">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Serving adjuster ── */}
      <button
        onClick={() => setShowServing(v => !v)}
        className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown className={`w-3 h-3 transition-transform ${showServing ? 'rotate-180' : ''}`} />
        Adjust serving — currently {qty}{unit} = {m.calories}cal
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
            value={unit} onChange={e => { setUnit(e.target.value); setQty(unit === 'g' ? 100 : 1); }}
            className="h-8 px-2 text-xs border border-input rounded-lg bg-background">
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <span className="text-xs font-semibold text-foreground">{m.calories} cal</span>
          <span className="text-[10px] text-muted-foreground">P{m.protein} C{m.carbs} F{m.fats}</span>
        </div>
      )}
    </div>
  );
}