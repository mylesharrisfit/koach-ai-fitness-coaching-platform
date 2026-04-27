import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, EyeOff, Eye, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = [
  { id: 'proteins', label: '🥩 Proteins', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'carbs', label: '🍞 Carbs', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { id: 'fats', label: '🥑 Fats', color: 'bg-rose-50 border-rose-200 text-rose-700' },
  { id: 'fruits', label: '🍎 Fruits', color: 'bg-green-50 border-green-200 text-green-700' },
  { id: 'vegetables', label: '🥦 Vegetables', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { id: 'supplements', label: '💊 Supplements', color: 'bg-purple-50 border-purple-200 text-purple-700' },
];

function ApprovedFoodRow({ food }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.FoodItem.update(food.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['food-items'] }),
  });

  const toggleApproved = () => {
    updateMutation.mutate({ coach_approved: !food.coach_approved, coach_hidden: false });
    toast.success(food.coach_approved ? 'Removed from approved list' : 'Food approved for clients!');
  };

  const toggleHidden = () => {
    updateMutation.mutate({ coach_hidden: !food.coach_hidden, coach_approved: false });
    toast.success(food.coach_hidden ? 'Food is now visible' : 'Food hidden from clients');
  };

  const setCategory = (cat) => {
    updateMutation.mutate({ approved_category: cat, coach_approved: true, coach_hidden: false });
    toast.success('Category updated');
  };

  return (
    <div className={cn(
      'bg-white border rounded-xl overflow-hidden transition-all',
      food.coach_approved ? 'border-green-200' : food.coach_hidden ? 'border-border opacity-60' : 'border-border'
    )}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Status indicator */}
        <div className="shrink-0">
          {food.coach_approved ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : food.coach_hidden ? (
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
          )}
        </div>

        {/* Food info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{food.name}</p>
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {food.calories > 0 && <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">Cal: {food.calories}</span>}
            {food.protein_g > 0 && <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">P: {food.protein_g}g</span>}
            {food.carbs_g > 0 && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">C: {food.carbs_g}g</span>}
            {food.fats_g > 0 && <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">F: {food.fats_g}g</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleApproved}
            title={food.coach_approved ? 'Remove approval' : 'Approve for clients'}
            className={cn(
              'p-1.5 rounded-lg text-xs font-medium transition-all border',
              food.coach_approved
                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                : 'text-muted-foreground border-border hover:text-green-600 hover:border-green-200 hover:bg-green-50'
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleHidden}
            title={food.coach_hidden ? 'Unhide food' : 'Hide from clients'}
            className={cn(
              'p-1.5 rounded-lg transition-all border',
              food.coach_hidden
                ? 'bg-secondary text-foreground border-border'
                : 'text-muted-foreground border-border hover:text-foreground hover:bg-secondary'
            )}
          >
            {food.coach_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-lg">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-3 py-2.5 bg-secondary/20">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Assign category (shown to clients)</p>
          <Select value={food.approved_category || ''} onValueChange={setCategory}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select category…" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export default function ApprovedFoodsTab({ foods }) {
  const [filterCat, setFilterCat] = useState('all');

  const approvedFoods = foods.filter(f => f.coach_approved);
  const hiddenFoods = foods.filter(f => f.coach_hidden);
  const unapproved = foods.filter(f => !f.coach_approved && !f.coach_hidden);

  // Group approved by category
  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = approvedFoods.filter(f => f.approved_category === cat.id);
    return acc;
  }, {});
  const uncategorized = approvedFoods.filter(f => !f.approved_category);

  if (foods.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-semibold text-foreground">No foods saved yet</p>
        <p className="text-sm mt-1">Search for foods and save them, then approve them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-green-700">{approvedFoods.length}</p>
          <p className="text-xs text-green-600 mt-0.5">Approved</p>
        </div>
        <div className="bg-secondary border border-border rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-foreground">{unapproved.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
        </div>
        <div className="bg-secondary border border-border rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-foreground">{hiddenFoods.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Hidden</p>
        </div>
      </div>

      {/* Approved by category */}
      {approvedFoods.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Approved Foods
          </h3>
          <div className="space-y-4">
            {CATEGORIES.map(cat => {
              const items = byCategory[cat.id];
              if (!items.length) return null;
              return (
                <div key={cat.id}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat.label}</p>
                  <div className="space-y-1.5">
                    {items.map(food => <ApprovedFoodRow key={food.id} food={food} />)}
                  </div>
                </div>
              );
            })}
            {uncategorized.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">📦 Uncategorized</p>
                <div className="space-y-1.5">
                  {uncategorized.map(food => <ApprovedFoodRow key={food.id} food={food} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unapproved foods */}
      {unapproved.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Not yet reviewed ({unapproved.length})</h3>
          <div className="space-y-1.5">
            {unapproved.map(food => <ApprovedFoodRow key={food.id} food={food} />)}
          </div>
        </div>
      )}

      {/* Hidden foods */}
      {hiddenFoods.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <EyeOff className="w-3.5 h-3.5" /> Hidden from Clients ({hiddenFoods.length})
          </h3>
          <div className="space-y-1.5">
            {hiddenFoods.map(food => <ApprovedFoodRow key={food.id} food={food} />)}
          </div>
        </div>
      )}
    </div>
  );
}