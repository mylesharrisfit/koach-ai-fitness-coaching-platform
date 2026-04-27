import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import FoodSearchResults from './FoodSearchResults';

export default function FoodPickerModal({ open, onOpenChange, onSelect }) {
  const [tab, setTab] = useState('search');

  const { data: savedFoods = [] } = useQuery({
    queryKey: ['food-items'],
    queryFn: () => base44.entities.FoodItem.list('-created_date', 200),
    enabled: open,
  });

  const favorites = savedFoods.filter(f => f.is_favorite || f.source === 'custom');

  const handleSelect = (food) => {
    // Map food item fields to the meal food format
    onSelect({
      food_name: food.name,
      portion: food.serving_size || '100g',
      calories: food.calories || 0,
      protein: food.protein_g || 0,
      carbs: food.carbs_g || 0,
      fats: food.fats_g || 0,
      swap_options: [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Food</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary/40 rounded-lg p-1 shrink-0">
          <button
            onClick={() => setTab('search')}
            className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all',
              tab === 'search' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Search className="w-3.5 h-3.5" /> USDA Search
          </button>
          <button
            onClick={() => setTab('favorites')}
            className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all',
              tab === 'favorites' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Star className="w-3.5 h-3.5" /> Saved ({favorites.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'search' && (
            <FoodSearchResults selectMode onSelect={handleSelect} isSaved={() => false} onSave={() => {}} />
          )}

          {tab === 'favorites' && (
            <div className="space-y-2">
              {favorites.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No saved foods yet</p>
                  <p className="text-xs mt-1">Search and star foods in the Food Library</p>
                </div>
              ) : favorites.map((food, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(food)}
                  className="w-full text-left bg-white border border-border rounded-xl px-4 py-3 hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center gap-2">
                    {food.is_favorite && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{food.name}</p>
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {food.calories > 0 && <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">Cal: {food.calories}</span>}
                        {food.protein_g > 0 && <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">P: {food.protein_g}g</span>}
                        {food.carbs_g > 0 && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">C: {food.carbs_g}g</span>}
                        {food.fats_g > 0 && <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">F: {food.fats_g}g</span>}
                        {food.serving_size && <span className="text-[10px] text-muted-foreground">per {food.serving_size}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}