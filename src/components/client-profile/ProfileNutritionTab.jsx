import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Apple, Utensils, Clock, TrendingUp, CheckCircle2,
  XCircle, Minus, Plus, ChevronRight, BarChart3, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, subDays, isToday, parseISO } from 'date-fns';

// ── Helpers ───────────────────────────────────────────────────────────────────
function pct(val, max) {
  if (!max || !val) return 0;
  return Math.min(100, Math.round((val / max) * 100));
}

function MacroChip({ label, value, unit = 'g', color }) {
  return (
    <div className={cn('flex flex-col items-center px-3 py-2 rounded-xl text-center flex-1', color)}>
      <span className="text-sm font-bold tabular-nums leading-tight">{value ?? '—'}{unit === 'kcal' ? '' : unit}</span>
      <span className="text-[10px] opacity-70 mt-0.5">{label}{unit === 'kcal' ? ' kcal' : ''}</span>
    </div>
  );
}

function ProgressBar({ value, max, color = 'bg-primary' }) {
  const p = pct(value, max);
  return (
    <div className="h-1.5 bg-[#F0F2F8] rounded-full overflow-hidden">
      <motion.div
        className={cn('h-full rounded-full', color)}
        initial={{ width: 0 }}
        animate={{ width: `${p}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── Section 1: Assign Plan Modal ──────────────────────────────────────────────
function AssignPlanModal({ open, onClose, plans, clientId, onAssigned }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);

  const assign = async () => {
    if (!selected) return;
    const plan = plans.find(p => p.id === selected);
    const existing = plan.assigned_clients || [];
    if (!existing.includes(clientId)) {
      await base44.entities.NutritionPlan.update(selected, {
        assigned_clients: [...existing, clientId],
      });
    }
    qc.invalidateQueries({ queryKey: ['nutrition-plans-all'] });
    onAssigned();
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[#E7EAF3] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1F2A44]">Assign Nutrition Plan</h3>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#374151] text-lg leading-none">×</button>
        </div>
        <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-2">
          {plans.length === 0 && (
            <p className="text-xs text-[#9CA3AF] text-center py-6">No plans available. Create one first.</p>
          )}
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                selected === plan.id
                  ? 'border-primary bg-primary/5'
                  : 'border-[#E7EAF3] hover:border-primary/30'
              )}
            >
              <span className="text-xl">{plan.emoji || '🥗'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1F2A44] truncate">{plan.title}</p>
                <p className="text-[10px] text-[#9CA3AF]">
                  {plan.tracking_mode === 'habits' ? 'Habit Mode' : 'Macro Tracking'}
                  {plan.calories ? ` · ${plan.calories} kcal` : ''}
                </p>
              </div>
              {selected === plan.id && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-[#E7EAF3] flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 text-xs h-9">Cancel</Button>
          <Button onClick={assign} disabled={!selected} className="flex-1 text-xs h-9">Assign Plan</Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Section 1: Assigned Plan Card ─────────────────────────────────────────────
function AssignedPlanSection({ client, plans, allPlans, onOpenAssign }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Find plan assigned to this client (by assigned_clients array OR by client.assigned_nutrition_id)
  const assigned = plans.find(p =>
    (p.assigned_clients || []).includes(client.id) || p.id === client.assigned_nutrition_id
  );

  const unassign = async () => {
    if (!assigned) return;
    await base44.entities.NutritionPlan.update(assigned.id, {
      assigned_clients: (assigned.assigned_clients || []).filter(id => id !== client.id),
    });
    qc.invalidateQueries({ queryKey: ['nutrition-plans-all'] });
  };

  if (!assigned) return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] p-6 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-[#F6F7FB] flex items-center justify-center">
        <Apple className="w-5 h-5 text-[#9CA3AF]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#374151]">No nutrition plan assigned yet</p>
        <p className="text-xs text-[#9CA3AF] mt-0.5">Assign an existing plan or create a new one</p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        <Button size="sm" onClick={onOpenAssign} className="gap-1.5 h-8 text-xs">
          <Plus className="w-3 h-3" /> Assign Plan
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-8 text-xs border-[#E7EAF3]"
          onClick={() => navigate(`/nutrition?client=${client.id}`)}
        >
          <Plus className="w-3 h-3" /> Create New Plan
        </Button>
      </div>
    </div>
  );

  const isHabits = assigned.tracking_mode === 'habits';
  const adherencePct = 72; // placeholder — would come from food log analysis

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#E7EAF3] p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{assigned.emoji || '🥗'}</span>
          <div>
            <p className="text-sm font-bold text-[#1F2A44] leading-tight">{assigned.title}</p>
            {assigned.description && (
              <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-1">{assigned.description}</p>
            )}
          </div>
        </div>
        <span className={cn(
          'text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0',
          isHabits
            ? 'bg-purple-50 text-purple-600 border-purple-100'
            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
        )}>
          {isHabits ? 'Habit Mode' : 'Macro Tracking'}
        </span>
      </div>

      {!isHabits && assigned.calories > 0 && (
        <div className="flex gap-2">
          <MacroChip label="Calories" value={assigned.calories} unit="kcal" color="bg-[#FFF7ED] text-orange-700" />
          {assigned.protein_g > 0 && <MacroChip label="Protein" value={assigned.protein_g} color="bg-blue-50 text-blue-700" />}
          {assigned.carbs_g   > 0 && <MacroChip label="Carbs"   value={assigned.carbs_g}   color="bg-amber-50 text-amber-700" />}
          {assigned.fats_g    > 0 && <MacroChip label="Fats"    value={assigned.fats_g}     color="bg-rose-50 text-rose-600" />}
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#6B7280] font-medium">Weekly Adherence</span>
          <span className="font-bold text-[#374151]">{adherencePct}%</span>
        </div>
        <ProgressBar value={adherencePct} max={100} color={adherencePct >= 80 ? 'bg-emerald-400' : adherencePct >= 60 ? 'bg-amber-400' : 'bg-red-400'} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-8 border-[#E7EAF3] gap-1"
          onClick={() => navigate('/nutrition')}
        >
          View Plan <ChevronRight className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-8 border-[#E7EAF3]"
          onClick={onOpenAssign}
        >
          Change Plan
        </Button>
      </div>
    </motion.div>
  );
}

// ── Section 2: Today's Food Log ───────────────────────────────────────────────
function TodayFoodLog({ client, assignedPlan }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['food-log', client.id, today],
    queryFn: () => base44.entities.FoodLog.filter({ client_id: client.id, logged_date: today }),
  });

  const grouped = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      const key = log.meal_name || 'Other';
      if (!map[key]) map[key] = [];
      map[key].push(log);
    });
    return map;
  }, [logs]);

  const totalCals = logs.reduce((s, l) => s + (l.calories || 0), 0);
  const totalProtein = logs.reduce((s, l) => s + (l.protein || 0), 0);
  const targetCals = assignedPlan?.calories || 0;
  const targetProtein = assignedPlan?.protein_g || 0;

  if (isLoading) return <div className="h-24 bg-white rounded-2xl animate-pulse border border-[#E7EAF3]" />;

  return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#F0F2F8] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Utensils className="w-3.5 h-3.5 text-[#9CA3AF]" />
          <span className="text-xs font-bold text-[#374151] uppercase tracking-wide">Today's Food Log</span>
        </div>
        <span className="text-[11px] text-[#9CA3AF]">{format(new Date(), 'MMM d')}</span>
      </div>

      {/* Daily totals bar */}
      {logs.length > 0 && (
        <div className="px-4 py-3 bg-[#F8F9FC] border-b border-[#F0F2F8] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6B7280]">Calories</span>
            <span className="font-semibold text-[#374151] tabular-nums">
              {totalCals}{targetCals > 0 ? ` / ${targetCals}` : ''} kcal
            </span>
          </div>
          {targetCals > 0 && <ProgressBar value={totalCals} max={targetCals} color="bg-orange-400" />}
          {targetProtein > 0 && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B7280]">Protein</span>
                <span className="font-semibold text-blue-600 tabular-nums">{totalProtein} / {targetProtein}g</span>
              </div>
              <ProgressBar value={totalProtein} max={targetProtein} color="bg-blue-400" />
            </>
          )}
        </div>
      )}

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <Utensils className="w-8 h-8 text-[#D1D5DB]" />
          <p className="text-sm text-[#9CA3AF]">No food logged today</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F0F2F8]">
          {Object.entries(grouped).map(([mealName, items]) => {
            const mealCals = items.reduce((s, i) => s + (i.calories || 0), 0);
            return (
              <div key={mealName}>
                <div className="flex items-center justify-between px-4 py-2 bg-[#FAFBFD]">
                  <span className="text-xs font-semibold text-[#374151]">{mealName}</span>
                  {mealCals > 0 && <span className="text-[11px] font-semibold text-orange-600 tabular-nums">{mealCals} kcal</span>}
                </div>
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2 last:pb-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-[#1F2A44] font-medium">{item.food_name}</span>
                      {item.serving_quantity && (
                        <span className="text-[11px] text-[#9CA3AF] ml-1.5">
                          {item.serving_quantity}{item.serving_unit || ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-medium shrink-0 ml-2">
                      {item.protein > 0  && <span className="text-blue-500">{item.protein}P</span>}
                      {item.carbs > 0    && <span className="text-amber-500">{item.carbs}C</span>}
                      {item.fats > 0     && <span className="text-rose-400">{item.fats}F</span>}
                      {item.calories > 0 && <span className="text-[#374151] font-semibold">{item.calories}</span>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Section 3: Weekly Adherence Grid ─────────────────────────────────────────
function WeeklyAdherenceGrid({ client, assignedPlan }) {
  const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
  const startDate = format(days[0], 'yyyy-MM-dd');
  const endDate = format(days[6], 'yyyy-MM-dd');

  const { data: logs = [] } = useQuery({
    queryKey: ['food-log-week', client.id, startDate, endDate],
    queryFn: () => base44.entities.FoodLog.filter({ client_id: client.id }),
    select: (data) => data.filter(l => l.logged_date >= startDate && l.logged_date <= endDate),
  });

  const targetCals = assignedPlan?.calories || 0;

  const dayStatuses = useMemo(() => {
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayLogs = logs.filter(l => l.logged_date === dateStr);
      if (dayLogs.length === 0) return 'none';
      if (!targetCals) return 'logged';
      const consumed = dayLogs.reduce((s, l) => s + (l.calories || 0), 0);
      return consumed / targetCals >= 0.8 ? 'hit' : 'missed';
    });
  }, [logs, days, targetCals]);

  const hitCount = dayStatuses.filter(s => s === 'hit').length;
  const loggedCount = dayStatuses.filter(s => s !== 'none').length;
  const adherencePct = loggedCount > 0
    ? Math.round((hitCount / 7) * 100)
    : 0;

  const squareColor = {
    hit:    'bg-emerald-400',
    missed: 'bg-amber-300',
    logged: 'bg-blue-300',
    none:   'bg-[#E7EAF3]',
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-[#9CA3AF]" />
          <span className="text-xs font-bold text-[#374151] uppercase tracking-wide">7-Day Adherence</span>
        </div>
        <span className={cn(
          'text-xs font-bold tabular-nums',
          adherencePct >= 80 ? 'text-emerald-600' : adherencePct >= 50 ? 'text-amber-500' : 'text-[#9CA3AF]'
        )}>
          {loggedCount > 0 ? `${adherencePct}%` : '—'}
        </span>
      </div>

      <div className="flex gap-2 justify-between">
        {days.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'w-full aspect-square rounded-lg',
                squareColor[dayStatuses[i]],
                isToday(day) && 'ring-2 ring-primary ring-offset-1'
              )}
            />
            <span className="text-[9px] text-[#9CA3AF] font-medium">{format(day, 'EEE')}</span>
            <span className="text-[8px] text-[#C4C9D4]">{format(day, 'd')}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-[#9CA3AF] flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" /> Hit target</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-300 inline-block" /> Logged, missed</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#E7EAF3] inline-block" /> Nothing logged</span>
      </div>
    </div>
  );
}

// ── Section 4: Plan History ───────────────────────────────────────────────────
function PlanHistory({ client, allPlans }) {
  // Plans that were previously assigned but no longer are (or all plans mentioning client)
  const history = allPlans.filter(p =>
    p.id !== client.assigned_nutrition_id &&
    (p.assigned_clients || []).includes(client.id)
  );

  if (history.length === 0) return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
        <span className="text-xs font-bold text-[#374151] uppercase tracking-wide">Plan History</span>
      </div>
      <p className="text-xs text-[#9CA3AF] text-center py-4">No previous plans on record</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
        <span className="text-xs font-bold text-[#374151] uppercase tracking-wide">Plan History</span>
      </div>
      <div className="space-y-3">
        {history.map((plan, i) => (
          <div key={plan.id} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-[#D1D5DB]" />
              {i < history.length - 1 && <div className="w-px h-8 bg-[#E7EAF3] mt-1" />}
            </div>
            <div className="flex-1 pb-3 border-b border-[#F0F2F8] last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{plan.emoji || '🥗'}</span>
                <div>
                  <p className="text-xs font-semibold text-[#374151]">{plan.title}</p>
                  <p className="text-[10px] text-[#9CA3AF]">
                    {plan.tracking_mode === 'habits' ? 'Habit Mode' : 'Macro Tracking'}
                    {plan.calories ? ` · ${plan.calories} kcal` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProfileNutritionTab({ client }) {
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ['nutrition-plans-all'],
    queryFn: () => base44.entities.NutritionPlan.list(),
  });

  const assignedPlan = allPlans.find(p =>
    (p.assigned_clients || []).includes(client.id) || p.id === client.assigned_nutrition_id
  );

  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-[#E7EAF3]" />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Section 1 — Assigned Plan */}
      <AssignedPlanSection
        client={client}
        plans={allPlans}
        allPlans={allPlans}
        onOpenAssign={() => setAssignModalOpen(true)}
      />

      {/* Section 2 — Today's Food Log */}
      <TodayFoodLog client={client} assignedPlan={assignedPlan} />

      {/* Section 3 — Weekly Adherence */}
      <WeeklyAdherenceGrid client={client} assignedPlan={assignedPlan} />

      {/* Section 4 — Plan History */}
      <PlanHistory client={client} allPlans={allPlans} />

      {/* Assign Plan Modal */}
      <AnimatePresence>
        {assignModalOpen && (
          <AssignPlanModal
            open={assignModalOpen}
            onClose={() => setAssignModalOpen(false)}
            plans={allPlans}
            clientId={client.id}
            onAssigned={() => qc.invalidateQueries({ queryKey: ['nutrition-plans-all'] })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}