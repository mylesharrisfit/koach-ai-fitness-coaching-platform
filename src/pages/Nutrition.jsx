import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Salad, MoreHorizontal, Edit, Trash2, Flame, Beef, Wheat, Droplets, Copy, Leaf, Lock } from 'lucide-react';
import { getLimit } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageHeader from '../components/shared/PageHeader';
import NutritionForm from '../components/nutrition/NutritionForm';
import LimitBanner from '@/components/subscription/LimitBanner';
import { useUpgradeModal } from '@/components/layout/AppLayout';

export default function Nutrition() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();
  const { openUpgradeModal } = useUpgradeModal();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['nutrition'],
    queryFn: () => base44.entities.NutritionPlan.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.NutritionPlan.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nutrition'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NutritionPlan.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nutrition'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NutritionPlan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nutrition'] }),
  });

  const duplicatePlan = (plan) => {
    const { id, created_date, updated_date, created_by, ...rest } = plan;
    createMutation.mutate({ ...rest, title: `${rest.title} (Copy)` });
  };

  const nutritionLimit = getLimit(currentUser, 'max_nutrition_plans');
  const atLimit = nutritionLimit !== -1 && plans.length >= nutritionLimit;

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (plan) => { setEditing(plan); setShowForm(true); };

  const handleSubmit = (data) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Nutrition Plans" subtitle={`${plans.length} plans`}
        actions={
          <Button
            onClick={() => { if (atLimit) { openUpgradeModal('clients'); return; } openCreate(); }}
            variant={atLimit ? 'outline' : 'default'}
            className={atLimit ? 'border-destructive/40 text-destructive hover:bg-destructive/10' : ''}
          >
            {atLimit ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {atLimit ? `Limit Reached (${plans.length}/${nutritionLimit})` : 'Create Plan'}
          </Button>
        }
      />
      <LimitBanner limitKey="max_nutrition_plans" currentCount={plans.length} label="nutrition plans" featureKey="clients" className="mb-6" />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-2xl border border-[#E7EAF3] animate-pulse" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16">
          <Salad className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No nutrition plans yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => {
            const isHabits = plan.tracking_mode === 'habits';
            return (
              <div key={plan.id} className="bg-white rounded-2xl border border-[#E7EAF3] hover:border-primary/20 hover:shadow-md transition-all group overflow-hidden shadow-sm">
                <div className={`h-2 ${isHabits ? 'bg-emerald-400' : 'bg-primary'}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold truncate text-[#1F2A44]">{plan.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {isHabits ? (
                          <Badge variant="outline" className="text-[10px] text-accent border-accent/30 gap-1">
                            <Leaf className="w-2.5 h-2.5" /> Habit Mode
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Macro Tracking</Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(plan)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicatePlan(plan)}><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(plan.id)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {plan.description && <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">{plan.description}</p>}

                  {isHabits ? (
                    <div className="space-y-1.5">
                      {(plan.meals || []).slice(0, 3).map((m, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <Leaf className="w-3 h-3 text-accent mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground line-clamp-1">{m.habit_description || m.meal_name}</span>
                        </div>
                      ))}
                      {(plan.meals || []).length > 3 && (
                        <p className="text-xs text-muted-foreground pl-5">+{plan.meals.length - 3} more habits</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center p-2 rounded-lg bg-orange-50 border border-orange-100">
                        <Flame className="w-4 h-4 text-orange-500 mx-auto" />
                        <p className="text-xs font-bold mt-1 text-[#1F2A44]">{plan.calories || 0}</p>
                        <p className="text-[10px] text-[#6B7280]">cal</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-red-50 border border-red-100">
                        <Beef className="w-4 h-4 text-red-500 mx-auto" />
                        <p className="text-xs font-bold mt-1 text-[#1F2A44]">{plan.protein_g || 0}g</p>
                        <p className="text-[10px] text-[#6B7280]">protein</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-amber-50 border border-amber-100">
                        <Wheat className="w-4 h-4 text-amber-500 mx-auto" />
                        <p className="text-xs font-bold mt-1 text-[#1F2A44]">{plan.carbs_g || 0}g</p>
                        <p className="text-[10px] text-[#6B7280]">carbs</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-[#EEF4FF] border border-blue-100">
                        <Droplets className="w-4 h-4 text-primary mx-auto" />
                        <p className="text-xs font-bold mt-1 text-[#1F2A44]">{plan.fats_g || 0}g</p>
                        <p className="text-[10px] text-[#6B7280]">fats</p>
                      </div>
                    </div>
                  )}

                  {(plan.meals || []).length > 0 && !isHabits && (
                    <p className="text-xs text-[#6B7280] mt-3 border-t border-[#E7EAF3] pt-2">{plan.meals.length} meals configured</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NutritionForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleSubmit}
        plan={editing}
      />
    </div>
  );
}