import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Salad, MoreHorizontal, Edit, Trash2, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageHeader from '../components/shared/PageHeader';

export default function Nutrition() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', calories: '', protein_g: '', carbs_g: '', fats_g: '', notes: '' });
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['nutrition'],
    queryFn: () => base44.entities.NutritionPlan.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.NutritionPlan.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['nutrition'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NutritionPlan.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['nutrition'] }); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NutritionPlan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nutrition'] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', calories: '', protein_g: '', carbs_g: '', fats_g: '', notes: '' });
    setShowForm(true);
  };

  const openEdit = (plan) => {
    setEditing(plan);
    setForm({ title: plan.title, description: plan.description || '', calories: plan.calories || '', protein_g: plan.protein_g || '', carbs_g: plan.carbs_g || '', fats_g: plan.fats_g || '', notes: plan.notes || '' });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, calories: Number(form.calories) || 0, protein_g: Number(form.protein_g) || 0, carbs_g: Number(form.carbs_g) || 0, fats_g: Number(form.fats_g) || 0 };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Nutrition Plans" subtitle={`${plans.length} plans`}
        actions={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Create Plan</Button>}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-card rounded-2xl border animate-pulse" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16">
          <Salad className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No nutrition plans yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="bg-card rounded-2xl border border-border hover:border-accent/30 hover:shadow-lg transition-all group overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-accent to-chart-2" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-heading font-semibold">{plan.title}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(plan)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(plan.id)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {plan.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{plan.description}</p>}
                
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 rounded-lg bg-chart-5/10">
                    <Flame className="w-4 h-4 text-chart-5 mx-auto" />
                    <p className="text-xs font-bold mt-1">{plan.calories || 0}</p>
                    <p className="text-[10px] text-muted-foreground">cal</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-destructive/10">
                    <Beef className="w-4 h-4 text-destructive mx-auto" />
                    <p className="text-xs font-bold mt-1">{plan.protein_g || 0}g</p>
                    <p className="text-[10px] text-muted-foreground">protein</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-chart-4/10">
                    <Wheat className="w-4 h-4 text-chart-4 mx-auto" />
                    <p className="text-xs font-bold mt-1">{plan.carbs_g || 0}g</p>
                    <p className="text-[10px] text-muted-foreground">carbs</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-primary/10">
                    <Droplets className="w-4 h-4 text-primary mx-auto" />
                    <p className="text-xs font-bold mt-1">{plan.fats_g || 0}g</p>
                    <p className="text-[10px] text-muted-foreground">fats</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? 'Edit Nutrition Plan' : 'Create Nutrition Plan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Plan Name *</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Calories</Label><Input type="number" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} /></div>
              <div><Label>Protein (g)</Label><Input type="number" value={form.protein_g} onChange={e => setForm({...form, protein_g: e.target.value})} /></div>
              <div><Label>Carbs (g)</Label><Input type="number" value={form.carbs_g} onChange={e => setForm({...form, carbs_g: e.target.value})} /></div>
              <div><Label>Fats (g)</Label><Input type="number" value={form.fats_g} onChange={e => setForm({...form, fats_g: e.target.value})} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Update' : 'Create Plan'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}