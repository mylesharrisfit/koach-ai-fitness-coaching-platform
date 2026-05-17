import React, { useState } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function scale(val, qty) {
  const n = parseFloat(val) || 0;
  return Math.round(n * qty * 10) / 10;
}

export default function FoodSearchModal({ open, onOpenChange, mealName, onAddFood }) {
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState({});          // foodId → quantity
  const [adding, setAdding] = useState(null);  // foodId being added

  const { data: foods = [], isLoading } = useQuery({
    queryKey: ['food-search-modal', search],
    queryFn: () => base44.entities.FoodItem.list(),
    select: (all) =>
      search.trim()
        ? all.filter(f => f.name?.toLowerCase().includes(search.toLowerCase()))
        : all,
  });

  function getQty(id) { return qty[id] ?? 1; }

  async function handleAdd(food) {
    setAdding(food.id);
    const q = getQty(food.id);
    onAddFood({
      food_id:  food.id,
      name:     food.name,
      calories: scale(food.calories, q),
      protein:  scale(food.protein,  q),
      carbs:    scale(food.carbs,    q),
      fats:     scale(food.fats,     q),
      qty,
      serving_unit: food.serving_unit ?? 'g',
      serving_size: food.serving_size,
    });
    setAdding(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <DialogTitle className="text-base font-bold">
            Add Food {mealName ? <span className="text-muted-foreground font-normal">→ {mealName}</span> : ''}
          </DialogTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search foods..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : foods.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">
              {search ? 'No foods found' : 'No foods in library yet'}
            </p>
          ) : (
            <ul className="space-y-1">
              {foods.map(food => (
                <li key={food.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60 transition-colors">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{food.name}</p>
                    <div className="flex gap-2 mt-0.5 text-[10px] font-medium">
                      <span className="text-orange-600">{scale(food.calories, getQty(food.id))} kcal</span>
                      <span className="text-blue-600">P {scale(food.protein, getQty(food.id))}g</span>
                      <span className="text-amber-600">C {scale(food.carbs, getQty(food.id))}g</span>
                      <span className="text-red-500">F {scale(food.fats, getQty(food.id))}g</span>
                      <span className="text-muted-foreground">
                        per {food.serving_size ?? 1}{food.serving_unit ?? 'g'}
                      </span>
                    </div>
                  </div>

                  {/* Qty */}
                  <Input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={getQty(food.id)}
                    onChange={e => setQty(q => ({ ...q, [food.id]: parseFloat(e.target.value) || 1 }))}
                    className="w-16 text-center text-sm h-8"
                  />

                  {/* Add */}
                  <Button
                    size="sm"
                    className="h-8 px-3 gap-1 text-xs"
                    disabled={adding === food.id}
                    onClick={() => handleAdd(food)}
                  >
                    {adding === food.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <><Plus className="w-3.5 h-3.5" /> Add</>
                    }
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}