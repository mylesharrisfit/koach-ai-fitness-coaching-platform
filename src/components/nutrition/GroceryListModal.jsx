import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, RotateCcw } from 'lucide-react';

const CATEGORIES = [
  { key: 'proteins', label: '🥩 Proteins', color: 'text-destructive bg-destructive/10 border-destructive' },
  { key: 'produce', label: '🥦 Produce', color: 'text-success bg-success/10 border-success' },
  { key: 'grains', label: '🌾 Grains & Carbs', color: 'text-warning bg-warning/10 border-warning' },
  { key: 'dairy', label: '🧀 Dairy', color: 'text-warning bg-warning/10 border-warning' },
  { key: 'fats', label: '🥑 Fats & Oils', color: 'text-primary bg-accent border-accent' },
  { key: 'condiments', label: '🫙 Condiments', color: 'text-ai bg-ai/10 border-ai' },
  { key: 'other', label: '📦 Other', color: 'text-muted-foreground bg-muted border-border' },
];

const PROTEIN_KEYWORDS = ['chicken', 'beef', 'steak', 'salmon', 'tuna', 'shrimp', 'turkey', 'pork', 'fish', 'egg', 'protein', 'whey', 'casein', 'tofu', 'tempeh', 'tilapia', 'cod', 'ground'];
const PRODUCE_KEYWORDS = ['broccoli', 'spinach', 'kale', 'lettuce', 'tomato', 'pepper', 'onion', 'garlic', 'zucchini', 'asparagus', 'carrot', 'celery', 'cucumber', 'avocado', 'banana', 'apple', 'berry', 'blueberry', 'strawberry', 'orange', 'lemon', 'mushroom', 'cabbage', 'cauliflower', 'sweet potato', 'potato'];
const GRAIN_KEYWORDS = ['rice', 'oat', 'pasta', 'bread', 'tortilla', 'quinoa', 'barley', 'cereal', 'granola', 'wrap', 'bagel', 'flour', 'corn'];
const DAIRY_KEYWORDS = ['milk', 'yogurt', 'cheese', 'cottage', 'cream', 'butter', 'ghee', 'dairy'];
const FAT_KEYWORDS = ['oil', 'olive', 'coconut', 'almond', 'peanut', 'cashew', 'walnut', 'nut', 'seed', 'flax', 'chia', 'avocado oil'];
const CONDIMENT_KEYWORDS = ['sauce', 'ketchup', 'mustard', 'mayo', 'dressing', 'vinegar', 'soy', 'hot sauce', 'sriracha', 'seasoning', 'spice', 'salt', 'pepper', 'cumin', 'paprika', 'herbs'];

function categorize(foodName) {
  const lower = foodName.toLowerCase();
  if (PROTEIN_KEYWORDS.some(k => lower.includes(k))) return 'proteins';
  if (PRODUCE_KEYWORDS.some(k => lower.includes(k))) return 'produce';
  if (GRAIN_KEYWORDS.some(k => lower.includes(k))) return 'grains';
  if (DAIRY_KEYWORDS.some(k => lower.includes(k))) return 'dairy';
  if (FAT_KEYWORDS.some(k => lower.includes(k))) return 'fats';
  if (CONDIMENT_KEYWORDS.some(k => lower.includes(k))) return 'condiments';
  return 'other';
}

function buildGroceryList(meals) {
  const map = {};
  (meals || []).forEach(meal => {
    (meal.foods || []).forEach(food => {
      if (!food.food_name) return;
      const key = food.food_name.toLowerCase().trim();
      const cat = categorize(key);
      if (!map[cat]) map[cat] = {};
      if (!map[cat][key]) map[cat][key] = { name: food.food_name, portions: [] };
      if (food.portion) map[cat][key].portions.push(food.portion);
    });
  });
  // Convert to arrays
  const result = {};
  Object.entries(map).forEach(([cat, items]) => {
    result[cat] = Object.values(items).map(item => ({
      name: item.name,
      detail: [...new Set(item.portions)].join(', '),
    }));
  });
  return result;
}

export default function GroceryListModal({ open, onOpenChange, plan }) {
  const groceries = buildGroceryList(plan?.meals);
  const [checked, setChecked] = useState({});

  const toggle = (cat, i) => setChecked(prev => ({ ...prev, [`${cat}-${i}`]: !prev[`${cat}-${i}`] }));
  const totalItems = Object.values(groceries).reduce((s, arr) => s + arr.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
              <ShoppingCart className="w-4.5 h-4.5 text-success" />
            </div>
            <div>
              <DialogTitle className="font-heading font-bold text-base">Grocery List</DialogTitle>
              <p className="text-xs text-muted-foreground">{checkedCount}/{totalItems} items checked</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto gap-1.5 text-xs text-muted-foreground"
              onClick={() => setChecked({})}
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
          </div>
          {/* Progress */}
          <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-success transition-all"
              style={{ width: totalItems ? `${(checkedCount / totalItems) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {CATEGORIES.map(cat => {
            const items = groceries[cat.key];
            if (!items?.length) return null;
            const [textColor, bgColor, borderColor] = cat.color.split(' ');
            return (
              <div key={cat.key}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${textColor}`}>{cat.label}</p>
                <div className={`rounded-xl border ${bgColor} ${borderColor} overflow-hidden`}>
                  {items.map((item, i) => {
                    const id = `${cat.key}-${i}`;
                    const done = !!checked[id];
                    return (
                      <button
                        key={i}
                        onClick={() => toggle(cat.key, i)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:brightness-[0.97] transition-all text-left border-b last:border-b-0 border-white/60"
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-success border-success' : 'bg-card border-border'}`}>
                          {done && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm flex-1 ${done ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>{item.name}</span>
                        {item.detail && <span className="text-[10px] text-muted-foreground flex-shrink-0">{item.detail}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {totalItems === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No food items found in this plan.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}