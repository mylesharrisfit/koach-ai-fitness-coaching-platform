import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, EyeOff, Eye, ChevronDown, ChevronUp, Edit2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import CustomFoodForm from '@/components/nutrition/CustomFoodForm';

const CATEGORIES = [
  { id: 'proteins',     label: '🥩 Proteins',     color: 'bg-blue-50 border-blue-200' },
  { id: 'carbs',        label: '🍞 Carbs',         color: 'bg-amber-50 border-amber-200' },
  { id: 'fats',         label: '🥑 Fats',          color: 'bg-rose-50 border-rose-200' },
  { id: 'fruits',       label: '🍎 Fruits',        color: 'bg-green-50 border-green-200' },
  { id: 'vegetables',   label: '🥦 Vegetables',    color: 'bg-emerald-50 border-emerald-200' },
  { id: 'dairy',        label: '🥛 Dairy',         color: 'bg-sky-50 border-sky-200' },
  { id: 'supplements',  label: '💊 Supplements',   color: 'bg-purple-50 border-purple-200' },
];

function MacroPill({ label, value, color }) {
  if (!value) return null;
  return <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', color)}>{label}: {value}</span>;
}

function FoodRow({ food }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  const update = useMutation({
    mutationFn: (data) => base44.entities.FoodItem.update(food.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food-items'] }),
  });

  const toggleApproved = () => {
    update.mutate({ coach_approved: !food.coach_approved, coach_hidden: false });
    toast.success(food.coach_approved ? 'Removed from approved list' : '✅ Food approved!');
  };
  const toggleHidden = () => {
    update.mutate({ coach_hidden: !food.coach_hidden, coach_approved: false });
    toast.success(food.coach_hidden ? 'Food is now visible' : 'Food hidden from clients');
  };
  const setCategory = (cat) => {
    update.mutate({ approved_category: cat, coach_approved: true, coach_hidden: false });
  };

  return (
    <>
      <div className={cn(
        'bg-white border rounded-xl overflow-hidden',
        food.coach_approved ? 'border-green-200' : food.coach_hidden ? 'border-border opacity-50' : 'border-border'
      )}>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="shrink-0 w-4">
            {food.coach_approved
              ? <CheckCircle2 className="w-4 h-4 text-green-500" />
              : food.coach_hidden
                ? <EyeOff className="w-4 h-4 text-muted-foreground" />
                : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{food.name}</p>
            <div className="flex gap-1 mt-0.5 flex-wrap">
              <MacroPill label="Cal" value={food.calories} color="bg-orange-50 text-orange-600" />
              <MacroPill label="P" value={food.protein_g ? `${food.protein_g}g` : null} color="bg-blue-50 text-blue-600" />
              <MacroPill label="C" value={food.carbs_g ? `${food.carbs_g}g` : null} color="bg-amber-50 text-amber-600" />
              <MacroPill label="F" value={food.fats_g ? `${food.fats_g}g` : null} color="bg-rose-50 text-rose-600" />
              {food.serving_size && <span className="text-[10px] text-muted-foreground">per {food.serving_size}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={toggleApproved} title="Toggle approved"
              className={cn('p-1.5 rounded-lg border transition-all',
                food.coach_approved
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'text-muted-foreground border-border hover:text-green-600 hover:bg-green-50')}>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={toggleHidden} title="Toggle hidden"
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-all">
              {food.coach_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-border px-3 py-2.5 bg-secondary/20">
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Coach Category</p>
            <Select value={food.approved_category || ''} onValueChange={setCategory}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Assign category…" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <CustomFoodForm
        open={editing}
        onOpenChange={setEditing}
        food={food}
        onSubmit={(data) => { update.mutate(data); setEditing(false); }}
      />
    </>
  );
}

export default function ApprovedFoodsSection({ foods }) {
  const approvedFoods = foods.filter(f => f.coach_approved && !f.coach_hidden);
  const hiddenFoods   = foods.filter(f => f.coach_hidden);
  const unapproved    = foods.filter(f => !f.coach_approved && !f.coach_hidden);

  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = approvedFoods.filter(f => f.approved_category === cat.id);
    return acc;
  }, {});
  const uncategorized = approvedFoods.filter(f => !f.approved_category);

  if (foods.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-semibold text-foreground">No foods saved yet</p>
        <p className="text-sm mt-1">Search the "All Foods" tab and save foods here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Approved', count: approvedFoods.length, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Pending Review', count: unapproved.length, color: 'bg-secondary border-border text-foreground' },
          { label: 'Hidden', count: hiddenFoods.length, color: 'bg-secondary border-border text-muted-foreground' },
        ].map(s => (
          <div key={s.label} className={cn('border rounded-xl p-3 text-center', s.color)}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Approved by category */}
      {approvedFoods.length > 0 && (
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Approved Foods
          </h3>
          {CATEGORIES.map(cat => {
            const items = byCategory[cat.id];
            if (!items.length) return null;
            return (
              <div key={cat.id}>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat.label}</p>
                <div className="space-y-1.5">{items.map(f => <FoodRow key={f.id} food={f} />)}</div>
              </div>
            );
          })}
          {uncategorized.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">📦 Uncategorized</p>
              <div className="space-y-1.5">{uncategorized.map(f => <FoodRow key={f.id} food={f} />)}</div>
            </div>
          )}
        </div>
      )}

      {/* Not reviewed */}
      {unapproved.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Not Yet Reviewed ({unapproved.length})</h3>
          <div className="space-y-1.5">{unapproved.map(f => <FoodRow key={f.id} food={f} />)}</div>
        </div>
      )}

      {/* Hidden */}
      {hiddenFoods.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
            <EyeOff className="w-3.5 h-3.5" /> Hidden from Clients ({hiddenFoods.length})
          </h3>
          <div className="space-y-1.5">{hiddenFoods.map(f => <FoodRow key={f.id} food={f} />)}</div>
        </div>
      )}
    </div>
  );
}