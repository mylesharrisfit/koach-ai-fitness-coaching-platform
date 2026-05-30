import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Sparkles, BookOpen, Users, Lock, Search, SlidersHorizontal, Salad } from 'lucide-react';
import { toast } from 'sonner';
import { getLimit } from '@/lib/subscription';
import { sendZapierEvent } from '@/lib/zapier';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LimitBanner from '@/components/subscription/LimitBanner';
import { useUpgradeModal } from '@/components/layout/AppLayout';
import NutritionForm from '../components/nutrition/NutritionForm';
import NutritionInsightCards from '../components/nutrition/NutritionInsightCards';
import NutritionPlanCard from '../components/nutrition/NutritionPlanCard';
import AIGeneratorModal from '../components/nutrition/AIGeneratorModal';
import NewPlanLaunchModal from '../components/nutrition/NewPlanLaunchModal';
import { motion } from 'framer-motion';

const FILTER_TABS = ['All', 'Macro Tracking', 'Habit Mode', 'Templates'];

export default function Nutrition() {
  const [showForm, setShowForm] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [pendingMeals, setPendingMeals] = useState(null);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-client'] });
    },
    onError: (err) => {
      console.error('Create plan error:', err);
      toast.error('Failed to save plan: ' + err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NutritionPlan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-client'] });
    },
    onError: (err) => {
      console.error('Update plan error:', err);
      toast.error('Failed to update plan: ' + err.message);
    },
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

  const openCreate = (initialData = {}) => {
    setEditing(null);
    setShowForm(true);
    if (initialData.meals) setPendingMeals(initialData.meals);
  };

  const openEdit = (plan) => {
    console.log('openEdit called with:', plan);
    setEditing(plan);
    setShowForm(true);
  };

  const handleSubmit = async (data) => {
    const result = editing && editing.id
      ? await updateMutation.mutateAsync({ id: editing.id, data })
      : await createMutation.mutateAsync(data);
    setPendingMeals(null);
    setEditing(null);
    toast.success('Plan saved!');
    if (result?.id && !(editing && editing.id)) {
      sendZapierEvent('nutrition_plan.created', {
        plan_id: result.id,
        plan_title: result.title,
        calories: result.calories,
      });
    }
    return result;
  };

  const handleAIApply = (result) => {
    setEditing(null);
    setPendingMeals(result.meals || null);
    setShowAIModal(false);
    setShowForm(true);
  };

  // Filter plans
  const filtered = plans.filter(p => {
    const matchesSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'Macro Tracking' && p.tracking_mode !== 'habits') ||
      (activeTab === 'Habit Mode' && p.tracking_mode === 'habits') ||
      (activeTab === 'Templates' && p.is_template);
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827] rounded-xl p-4 sm:p-5">
        <div>
          <h1 className="text-xl font-heading font-bold text-white tracking-tight">Nutrition System</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>AI-powered nutrition coaching for performance, recovery, and adherence.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
            onClick={() => setShowAIModal(true)}
          >
            <Sparkles className="w-4 h-4" />
            AI Generator
          </button>
          <button
            onClick={() => {
              if (atLimit) { openUpgradeModal('clients'); return; }
              setShowLaunchModal(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: atLimit ? 'rgba(255,255,255,0.1)' : '#fff', color: atLimit ? '#fff' : '#111827' }}
          >
            {atLimit ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {atLimit ? `Limit (${plans.length}/${nutritionLimit})` : '+ New Plan'}
          </button>
        </div>
      </div>

      <LimitBanner limitKey="max_nutrition_plans" currentCount={plans.length} label="nutrition plans" featureKey="clients" />


      {/* ── AI INSIGHT CARDS ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">AI Insights</p>
        </div>
        <NutritionInsightCards />
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Plans', value: plans.length, icon: BookOpen, color: 'text-primary', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Macro Plans', value: plans.filter(p => p.tracking_mode !== 'habits').length, icon: SlidersHorizontal, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Habit Plans', value: plans.filter(p => p.tracking_mode === 'habits').length, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Templates', value: plans.filter(p => p.is_template).length, icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`p-4 rounded-2xl border ${bg} flex items-center gap-3`}>
            <div className="p-2 bg-white/70 rounded-xl">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── PLAN LIBRARY ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-heading font-bold text-foreground">Plan Library</h2>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search plans…"
              className="pl-8 h-9 text-sm w-full sm:w-48"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 bg-secondary/50 rounded-xl p-1 overflow-x-auto scrollbar-hide flex-nowrap w-full sm:w-fit">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab}
              {tab !== 'All' && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  ({tab === 'Macro Tracking' ? plans.filter(p => p.tracking_mode !== 'habits').length
                    : tab === 'Habit Mode' ? plans.filter(p => p.tracking_mode === 'habits').length
                    : plans.filter(p => p.is_template).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Plans grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 bg-white rounded-2xl border border-[#E7EAF3] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 rounded-2xl border-2 border-dashed border-[#E7EAF3]"
          >
            <Salad className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-semibold text-foreground mb-1">
              {search ? `No plans matching "${search}"` : 'No nutrition plans yet'}
            </p>
            <p className="text-sm text-muted-foreground mb-5">
              {search ? 'Try a different search term.' : 'No nutrition plans yet — create your first plan to get started.'}
            </p>
            {!search && (
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" onClick={() => setShowAIModal(true)} className="gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> AI Generator
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((plan, i) => (
              <NutritionPlanCard
                key={plan.id}
                plan={plan}
                index={i}
                onEdit={() => openEdit(plan)}
                onDuplicate={() => duplicatePlan(plan)}
                onDelete={() => deleteMutation.mutate(plan.id)}
                onAssign={() => openEdit(plan)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      <NutritionForm
        open={showForm}
        onOpenChange={(v) => { setShowForm(v); if (!v) setPendingMeals(null); }}
        onSubmit={handleSubmit}
        plan={editing}
        initialMeals={pendingMeals}
      />

      <AIGeneratorModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        onApply={handleAIApply}
      />

      <NewPlanLaunchModal
        open={showLaunchModal}
        onOpenChange={setShowLaunchModal}
        onSelectAI={() => { setShowLaunchModal(false); setShowAIModal(true); }}
        onSelectManual={() => { setShowLaunchModal(false); openCreate(); }}
      />
    </div>
  );
}