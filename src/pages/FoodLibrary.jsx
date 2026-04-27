import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Star, Plus, Loader2, Utensils, ChevronDown, ChevronUp, Trash2, Edit, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import FoodSearchResults from '@/components/nutrition/FoodSearchResults';
import CustomFoodForm from '@/components/nutrition/CustomFoodForm';
import ApprovedFoodsTab from '@/components/nutrition/ApprovedFoodsTab';

const TABS = [
  { id: 'search', label: '🔍 Search Foods' },
  { id: 'approved', label: '✅ Approved Foods' },
  { id: 'favorites', label: '⭐ My Favorites' },
  { id: 'custom', label: '🧑‍🍳 Custom Foods' },
];

export default function FoodLibrary() {
  const [tab, setTab] = useState('search');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const queryClient = useQueryClient();

  const { data: savedFoods = [], isLoading: loadingSaved } = useQuery({
    queryKey: ['food-items'],
    queryFn: () => base44.entities.FoodItem.list('-created_date', 200),
  });

  const favorites = savedFoods.filter(f => f.is_favorite);
  const customFoods = savedFoods.filter(f => f.source === 'custom');

  const saveMutation = useMutation({
    mutationFn: (food) => base44.entities.FoodItem.create(food),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['food-items'] }); toast.success('Food saved to favorites!'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FoodItem.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['food-items'] }); toast.success('Food updated!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FoodItem.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['food-items'] }); toast.success('Food removed'); },
  });

  const handleSaveFromSearch = (food) => {
    // Check if already saved by USDA id
    const exists = savedFoods.find(f => f.usda_fdc_id === food.usda_fdc_id);
    if (exists) {
      // Toggle favorite
      updateMutation.mutate({ id: exists.id, data: { ...exists, is_favorite: !exists.is_favorite } });
      return;
    }
    saveMutation.mutate({ ...food, is_favorite: true });
  };

  const isSaved = (food) => savedFoods.find(f => f.usda_fdc_id === food.usda_fdc_id && f.is_favorite);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">Food Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Search millions of foods, save favorites, build custom entries</p>
        </div>
        <Button onClick={() => { setEditingFood(null); setShowCustomForm(true); }} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Custom Food
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 border border-border rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all',
              tab === t.id ? 'bg-white shadow-sm text-foreground border border-border' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Approved Foods tab */}
      {tab === 'approved' && (
        <ApprovedFoodsTab foods={savedFoods} />
      )}

      {/* Search tab */}
      {tab === 'search' && (
        <FoodSearchResults
          onSave={handleSaveFromSearch}
          isSaved={isSaved}
        />
      )}

      {/* Favorites tab */}
      {tab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div className="text-center py-16">
              <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-foreground">No favorites yet</p>
              <p className="text-sm text-muted-foreground mt-1">Search for foods and star them to save here</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setTab('search')}>Search Foods</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {favorites.map(food => (
                <FoodCard
                  key={food.id}
                  food={food}
                  onEdit={() => { setEditingFood(food); setShowCustomForm(true); }}
                  onDelete={() => deleteMutation.mutate(food.id)}
                  onToggleFav={() => updateMutation.mutate({ id: food.id, data: { ...food, is_favorite: !food.is_favorite } })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom foods tab */}
      {tab === 'custom' && (
        <div>
          {customFoods.length === 0 ? (
            <div className="text-center py-16">
              <Utensils className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-foreground">No custom foods yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create foods that aren't in the database</p>
              <Button size="sm" className="mt-4" onClick={() => { setEditingFood(null); setShowCustomForm(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Create Custom Food
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {customFoods.map(food => (
                <FoodCard
                  key={food.id}
                  food={food}
                  onEdit={() => { setEditingFood(food); setShowCustomForm(true); }}
                  onDelete={() => deleteMutation.mutate(food.id)}
                  onToggleFav={() => updateMutation.mutate({ id: food.id, data: { ...food, is_favorite: !food.is_favorite } })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom food form */}
      <CustomFoodForm
        open={showCustomForm}
        onOpenChange={setShowCustomForm}
        food={editingFood}
        onSubmit={(data) => {
          if (editingFood) {
            updateMutation.mutate({ id: editingFood.id, data });
          } else {
            saveMutation.mutate({ ...data, source: 'custom' });
          }
          setShowCustomForm(false);
        }}
      />
    </div>
  );
}

function MacroPill({ label, value, color }) {
  return (
    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', color)}>
      {label}: {value ?? '—'}
    </span>
  );
}

function FoodCard({ food, onEdit, onDelete, onToggleFav }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onToggleFav} className="shrink-0">
          <Star className={cn('w-4 h-4 transition-colors', food.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground hover:text-amber-400')} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{food.name}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            <MacroPill label="Cal" value={food.calories} color="bg-orange-50 text-orange-600" />
            <MacroPill label="P" value={food.protein_g ? `${food.protein_g}g` : null} color="bg-blue-50 text-blue-600" />
            <MacroPill label="C" value={food.carbs_g ? `${food.carbs_g}g` : null} color="bg-amber-50 text-amber-600" />
            <MacroPill label="F" value={food.fats_g ? `${food.fats_g}g` : null} color="bg-rose-50 text-rose-600" />
            {food.serving_size && <span className="text-[10px] text-muted-foreground">per {food.serving_size}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-secondary transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 text-muted-foreground rounded-lg hover:bg-secondary transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border px-4 py-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          {food.fiber_g != null && <span>Fiber: <strong className="text-foreground">{food.fiber_g}g</strong></span>}
          {food.sugar_g != null && <span>Sugar: <strong className="text-foreground">{food.sugar_g}g</strong></span>}
          {food.sodium_mg != null && <span>Sodium: <strong className="text-foreground">{food.sodium_mg}mg</strong></span>}
          {food.micronutrients?.vitamin_c_mg != null && food.micronutrients.vitamin_c_mg > 0 && <span>Vitamin C: <strong className="text-foreground">{food.micronutrients.vitamin_c_mg}mg</strong></span>}
          {food.micronutrients?.iron_mg != null && food.micronutrients.iron_mg > 0 && <span>Iron: <strong className="text-foreground">{food.micronutrients.iron_mg}mg</strong></span>}
          {food.micronutrients?.calcium_mg != null && food.micronutrients.calcium_mg > 0 && <span>Calcium: <strong className="text-foreground">{food.micronutrients.calcium_mg}mg</strong></span>}
          {food.category && <span className="col-span-3 text-muted-foreground">Category: {food.category}</span>}
        </div>
      )}
    </div>
  );
}