import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Star, Plus, Utensils, ChevronDown, ChevronUp, Trash2, Edit, CheckCircle2, BookOpen, Pill } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import FoodSearchResults from '@/components/nutrition/FoodSearchResults';
import CustomFoodForm from '@/components/nutrition/CustomFoodForm';
import ApprovedFoodsSection from '@/components/food-library/ApprovedFoodsSection';
import MealTemplatesSection from '@/components/food-library/MealTemplatesSection';
import SupplementsSection from '@/components/food-library/SupplementsSection';

const TABS = [
  { id: 'approved',   icon: CheckCircle2, label: 'Approved Foods' },
  { id: 'all',        icon: Search,       label: 'All Foods' },
  { id: 'custom',     icon: Utensils,     label: 'Custom Foods' },
  { id: 'templates',  icon: BookOpen,     label: 'Meal Templates' },
  { id: 'supplements',icon: Pill,         label: 'Supplements' },
];

function MacroPill({ label, value, color }) {
  return (
    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', color)}>
      {label}: {value ?? '—'}
    </span>
  );
}

function FoodCard({ food, onEdit, onDelete, onToggleFav, onToggleApproved }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={cn(
      'bg-white border rounded-xl overflow-hidden',
      food.coach_approved ? 'border-green-200' : 'border-border'
    )}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onToggleFav} className="shrink-0" title="Favorite">
          <Star className={cn('w-4 h-4 transition-colors', food.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground hover:text-amber-400')} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{food.name}</p>
            {food.coach_approved && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            <MacroPill label="Cal" value={food.calories} color="bg-orange-50 text-orange-600" />
            <MacroPill label="P" value={food.protein_g ? `${food.protein_g}g` : null} color="bg-blue-50 text-blue-600" />
            <MacroPill label="C" value={food.carbs_g ? `${food.carbs_g}g` : null} color="bg-amber-50 text-amber-600" />
            <MacroPill label="F" value={food.fats_g ? `${food.fats_g}g` : null} color="bg-rose-50 text-rose-600" />
            {food.serving_size && <span className="text-[10px] text-muted-foreground">per {food.serving_size}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleApproved}
            title={food.coach_approved ? 'Remove approval' : 'Approve for clients'}
            className={cn('p-1.5 rounded-lg border transition-all',
              food.coach_approved
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'text-muted-foreground border-border hover:text-green-600 hover:bg-green-50'
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
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
        <div className="border-t border-border px-4 py-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground bg-secondary/20">
          {food.fiber_g != null && <span>Fiber: <strong className="text-foreground">{food.fiber_g}g</strong></span>}
          {food.sugar_g != null && <span>Sugar: <strong className="text-foreground">{food.sugar_g}g</strong></span>}
          {food.sodium_mg != null && <span>Sodium: <strong className="text-foreground">{food.sodium_mg}mg</strong></span>}
          {food.micronutrients?.vitamin_c_mg > 0 && <span>Vit C: <strong className="text-foreground">{food.micronutrients.vitamin_c_mg}mg</strong></span>}
          {food.micronutrients?.iron_mg > 0 && <span>Iron: <strong className="text-foreground">{food.micronutrients.iron_mg}mg</strong></span>}
          {food.micronutrients?.calcium_mg > 0 && <span>Calcium: <strong className="text-foreground">{food.micronutrients.calcium_mg}mg</strong></span>}
          {food.approved_category && <span className="col-span-3">Coach Category: <strong className="text-foreground capitalize">{food.approved_category}</strong></span>}
        </div>
      )}
    </div>
  );
}

export default function FoodLibrary() {
  const [tab, setTab] = useState('approved');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const qc = useQueryClient();

  const { data: savedFoods = [], isLoading } = useQuery({
    queryKey: ['food-items'],
    queryFn: () => base44.entities.FoodItem.list('-created_date', 300),
  });

  const customFoods = savedFoods.filter(f => f.source === 'custom');

  const saveMutation = useMutation({
    mutationFn: (food) => base44.entities.FoodItem.create(food),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['food-items'] }); toast.success('Food saved!'); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FoodItem.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['food-items'] }); toast.success('Updated!'); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FoodItem.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['food-items'] }); toast.success('Removed'); },
  });

  const handleSaveFromSearch = (food) => {
    const exists = savedFoods.find(f => f.usda_fdc_id === food.usda_fdc_id);
    if (exists) {
      updateMutation.mutate({ id: exists.id, data: { ...exists, is_favorite: !exists.is_favorite } });
    } else {
      saveMutation.mutate({ ...food, is_favorite: true });
    }
  };

  const isSaved = (food) => savedFoods.find(f => f.usda_fdc_id === food.usda_fdc_id && f.is_favorite);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">Food Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage approved foods, meal templates, and supplements</p>
        </div>
        {tab === 'custom' && (
          <Button onClick={() => { setEditingFood(null); setShowCustomForm(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Custom Food
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 border border-border rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 flex-shrink-0 py-2 px-3 rounded-lg text-sm font-semibold transition-all',
              tab === t.id ? 'bg-white shadow-sm text-foreground border border-border' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className={cn('w-3.5 h-3.5', tab === t.id && t.id === 'approved' ? 'text-green-500' : '')} />
            {t.label}
            {t.id === 'approved' && savedFoods.filter(f => f.coach_approved).length > 0 && (
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {savedFoods.filter(f => f.coach_approved).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'approved' && (
        <ApprovedFoodsSection foods={savedFoods} />
      )}

      {tab === 'all' && (
        <FoodSearchResults
          onSave={handleSaveFromSearch}
          isSaved={isSaved}
        />
      )}

      {tab === 'custom' && (
        <div>
          {customFoods.length === 0 ? (
            <div className="text-center py-20">
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
                  onToggleApproved={() => updateMutation.mutate({ id: food.id, data: { coach_approved: !food.coach_approved, coach_hidden: false } })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'templates' && <MealTemplatesSection />}
      {tab === 'supplements' && <SupplementsSection />}

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