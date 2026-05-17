import React, { useState } from 'react';
import { Search, Plus, Minus, Loader2, UtensilsCrossed } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'Protein', 'Carbs', 'Fats', 'Vegetables', 'Dairy', 'Fruits'];

const CATEGORY_EMOJI = {
  Protein:    '🥩',
  Carbs:      '🌾',
  Fats:       '🥑',
  Vegetables: '🥦',
  Fruits:     '🍎',
  Dairy:      '🥛',
  Other:      '🍽️',
};

function scale(val, qty) {
  return Math.round((parseFloat(val) || 0) * qty * 10) / 10;
}

function FoodImage({ name, category }) {
  const [failed, setFailed] = useState(false);
  const emoji = CATEGORY_EMOJI[category] || '🍽️';

  if (failed) {
    return (
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">
        {emoji}
      </div>
    );
  }

  return (
    <img
      src={`https://source.unsplash.com/48x48/?${encodeURIComponent(name)},food`}
      alt={name}
      className="w-12 h-12 rounded-xl object-cover shrink-0 bg-secondary"
      onError={() => setFailed(true)}
    />
  );
}

function QtyStepper({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={() => onChange(Math.max(0.5, value - 0.5))}
        className="w-6 h-6 rounded-full bg-secondary hover:bg-border flex items-center justify-center transition-colors"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        onClick={() => onChange(value + 0.5)}
        className="w-6 h-6 rounded-full bg-secondary hover:bg-border flex items-center justify-center transition-colors"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function FoodSearchModal({ open, onOpenChange, mealName, onAddFood }) {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [qty, setQty]           = useState({});
  const [adding, setAdding]     = useState(null);

  const { data: allFoods = [], isLoading } = useQuery({
    queryKey: ['food-items-all'],
    queryFn:  () => base44.entities.FoodItem.list(),
    staleTime: 60_000,
  });

  const filtered = allFoods.filter(f => {
    const matchSearch = !search.trim() ||
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.brand?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || f.category === category;
    return matchSearch && matchCat;
  });

  function getQty(id) { return qty[id] ?? 1; }
  function setItemQty(id, val) { setQty(q => ({ ...q, [id]: val })); }

  async function handleAdd(food) {
    setAdding(food.id);
    const q = getQty(food.id);
    onAddFood({
      food_id:      food.id,
      name:         food.name,
      calories:     scale(food.calories, q),
      protein:      scale(food.protein,  q),
      carbs:        scale(food.carbs,    q),
      fats:         scale(food.fats,     q),
      qty:          { [food.id]: q },
      serving_unit: food.serving_unit ?? 'g',
      serving_size: food.serving_size,
    });
    setAdding(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0">

        {/* ── Header ── */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <DialogTitle className="text-base font-bold">
            Add Food{mealName ? <span className="text-muted-foreground font-normal"> → {mealName}</span> : ''}
          </DialogTitle>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search by name or brand..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 mt-2 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
                  category === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : allFoods.length === 0 ? (
            /* Empty library */
            <div className="flex flex-col items-center gap-3 py-14 px-6 text-center">
              <UtensilsCrossed className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">No foods in your library yet</p>
              <p className="text-xs text-muted-foreground">Go to Food Library to add foods first.</p>
              <Button asChild size="sm" variant="outline" className="mt-1">
                <Link to="/food-library" onClick={() => onOpenChange(false)}>
                  Go to Food Library
                </Link>
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-12">No foods match your search.</p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map(food => {
                const q = getQty(food.id);
                return (
                  <li key={food.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors">

                    {/* Image */}
                    <FoodImage name={food.name} category={food.category} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate leading-snug">{food.name}</p>
                      {food.brand && (
                        <p className="text-[10px] text-muted-foreground truncate">{food.brand}</p>
                      )}
                      {/* Macro chips */}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700">
                          {scale(food.calories, q)} kcal
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                          P {scale(food.protein, q)}g
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700">
                          C {scale(food.carbs, q)}g
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-red-100 text-red-700">
                          F {scale(food.fats, q)}g
                        </span>
                        {food.serving_size && (
                          <span className="text-[10px] text-muted-foreground self-center">
                            per {food.serving_size}{food.serving_unit ?? 'g'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stepper + Add */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <QtyStepper value={q} onChange={v => setItemQty(food.id, v)} />
                      <Button
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1"
                        disabled={adding === food.id}
                        onClick={() => handleAdd(food)}
                      >
                        {adding === food.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <><Plus className="w-3 h-3" /> Add</>
                        }
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}