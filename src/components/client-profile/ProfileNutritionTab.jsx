import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Apple, UtensilsCrossed, TrendingUp, Clock, CheckCircle2,
  AlertCircle, Plus, ChevronRight, Flame, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { format, subDays, startOfDay, parseISO, isToday } from 'date-fns';

// ── Helpers ───────────────────────────────────────────────────────────────────
function MacroPill({ label, value, unit = 'g', colorClass }) {
  return (
    <div className={cn('flex flex-col items-center px-3 py-2 rounded-xl text-center flex-1', colorClass)}>
      <span className="text-sm font-bold tabular-nums leading-tight">{value ?? '—'}{unit}</span>
      <span className="text-[10px] opacity-75 mt-0.5">{label}</span>
    </div>
  );
}

function ProgressBar({ value, max, colorClass = 'bg-primary' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[#F0F2F8] rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="text-[10px] font-semibold text-[#6B7280] tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

// ── Assign Plan Modal ─────────────────────────────────────────────────────────
function AssignPlanModal({ clientId, plans, currentPlanId, onClose }) {
  const [selected, setSelected] = useState(currentPlanId || null);
  const qc = useQueryClient();

  const assign = useMutation({
    mutationFn: async () => {
      // Remove client from old plan
      if (currentPlanId && currentPlanId !== selected) {
        const old = plans.find(p => p.id === currentPlanId);
        if (old) {
          await base44.entities.NutritionPlan.update(currentPlanId, {
            assigned_clients: (old.assigned_clients || []).filter(id => id !== clientId),
          });
        }
      }
      // Add client to new plan
      if (selected) {
        const plan = plans.find(p => p.id === selected);
        const existing = plan?.assigned_clients || [];
        if (!existing.includes(clientId)) {
          await base44.entities.NutritionPlan.update(selected, {
            assigned_clients: [...existing, clientId],
          });
        }
      }
      // Update client record
      await base44.entities.Client.update(clientId, { assigned_nutrition_id: selected });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutrition-plans'] });
      qc.invalidateQueries({ queryKey: ['client', clientId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-[#1F2A44] mb-1">
          {currentPlanId ? 'Change Nutrition Plan' : 'Assign Nutrition Plan'}
        </h3>
        <p className="text-xs text-[#9CA3AF] mb-4">Select a plan to assign to this client</p>
        <div className="max-h-64 overflow-y-auto space-y-1.5 mb-4">
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
                  : 'border-[#E7EAF3] hover:border-primary/30 hover:bg-[#F8F9FC]'
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
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            disabled={!selected || assign.isPending}
            onClick={() => assign.mutate()}
          >
            {assign.isPending ? 'Saving...' : 'Assign Plan'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Section 1 — Assigned Plan ─────────────────────────────────────────────────
function AssignedPlanSection({ client, allPlans }) {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const assigned = allPlans.find(p =>
    (p.assigned_clients || []).includes(client.id) || p.id === client.assigned_nutrition_id
  );

  if (!assigned) {
    return (
      <div className="bg-white rounded-2xl border border-[#E7EAF3] p-5 flex flex-col items-center text-center">
        <div className="w-11 h-11 rounded-full bg-[#F6F7FB] flex items-center justify-center mb-3">
          <Apple className="w-5 h-5 text-[#9CA3AF]" />
        </div>
        <p className="text-sm font-semibold text-[#1F2A44]">No nutrition plan assigned</p>
        <p className="text-xs text-[#9CA3AF] mt-1 mb-4">Assign an existing plan or create a new one</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowModal(true)} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> Assign Plan
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/nutrition?client=${client.id}`)}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Create New Plan
          </Button>
        </div>
        {showModal && (
          <AssignPlanModal
            clientId={client.id}
            plans={allPlans}
            currentPlanId={null}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    );
  }

  const isHabits = assigned.tracking_mode === 'habits';

  return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{assigned.emoji || '🥗'}</span>
          <div>
            <p className="text-sm font-bold text-[#1F2A44]">{assigned.title}</p>
            {assigned.description && (
              <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-1">{assigned.description}</p>
            )}
          </div>
        </div>
        <span className={cn(
          'text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0',
          isHabits ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
        )}>
          {isHabits ? 'Habit Mode' : 'Macro Tracking'}
        </span>
      </div>

      {/* Macro targets */}
      {!isHabits && assigned.calories > 0 && (
        <div className="flex gap-1.5">
          <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-[#F6F7FB] text-center flex-1">
            <span className="text-base font-bold text-[#1F2A44] tabular-nums">{assigned.calories}</span>
            <span className="text-[10px] text-[#9CA3AF] mt-0.5">kcal/day</span>
          </div>
          {assigned.protein_g > 0 && <MacroPill label="Protein" value={assigned.protein_g} colorClass="bg-blue-50 text-blue-700" />}
          {assigned.carbs_g   > 0 && <MacroPill label="Carbs"   value={assigned.carbs_g}   colorClass="bg-amber-50 text-amber-700" />}
          {assigned.fats_g    > 0 && <MacroPill label="Fats"    value={assigned.fats_g}    colorClass="bg-rose-50 text-rose-600" />}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1.5 h-8"
          onClick={() => navigate(`/nutrition`)}
        >
          View Plan <ChevronRight className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs gap-1.5 h-8 text-[#6B7280]"
          onClick={() => setShowModal(true)}
        >
          Change Plan
        </Button>
      </div>

      {showModal && (
        <AssignPlanModal
          clientId={client.id}
          plans={allPlans}
          currentPlanId={assigned.id}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ── Section 2 — Today's Food Log ──────────────────────────────────────────────
function TodayFoodLogSection({ client, assignedPlan }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['food-log', client.id, today],
    queryFn: () => base44.entities.FoodLog.filter({ client_id: client.id, logged_date: today }),
  });

  const realLogs = logs.filter(l => l.food_name);

  // Group by meal_name
  const grouped = useMemo(() => {
    const map = {};
    realLogs.forEach(log => {
      const key = log.meal_name || 'Other';
      if (!map[key]) map[key] = [];
      map[key].push(log);
    });
    return map;
  }, [realLogs]);

  const totalCals = realLogs.reduce((s, l) => s + (l.calories || 0), 0);
  const totalProt = realLogs.reduce((s, l) => s + (l.protein || 0), 0);
  const targetCals = assignedPlan?.calories || 0;
  const targetProt = assignedPlan?.protein_g || 0;

  if (isLoading) return <div className="h-24 bg-white rounded-2xl animate-pulse border border-[#E7EAF3]" />;

  return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">Today's Food Log</h3>
        <span className="text-[10px] text-[#9CA3AF]">{format(new Date(), 'MMM d')}</span>
      </div>

      {realLogs.length === 0 ? (
        <div className="flex flex-col items-center py-5 text-center">
          <UtensilsCrossed className="w-7 h-7 text-[#D1D5DB] mb-2" />
          <p className="text-xs font-medium text-[#9CA3AF]">No food logged today</p>
        </div>
      ) : (
        <>
          {/* Daily totals bar */}
          {targetCals > 0 && (
            <div className="bg-[#F6F7FB] rounded-xl p-3 space-y-2">
              <div>
                <div className="flex justify-between text-[11px] font-semibold mb-1">
                  <span className="text-orange-600">Calories</span>
                  <span className="text-[#6B7280] tabular-nums">{totalCals} / {targetCals} kcal</span>
                </div>
                <ProgressBar value={totalCals} max={targetCals} colorClass="bg-orange-400" />
              </div>
              {targetProt > 0 && (
                <div>
                  <div className="flex justify-between text-[11px] font-semibold mb-1">
                    <span className="text-blue-600">Protein</span>
                    <span className="text-[#6B7280] tabular-nums">{Math.round(totalProt)}g / {targetProt}g</span>
                  </div>
                  <ProgressBar value={totalProt} max={targetProt} colorClass="bg-blue-500" />
                </div>
              )}
            </div>
          )}

          {/* Meals */}
          <div className="space-y-2">
            {Object.entries(grouped).map(([mealName, foods]) => {
              const mealCals = foods.reduce((s, f) => s + (f.calories || 0), 0);
              return (
                <div key={mealName} className="border border-[#F0F2F8] rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-[#F8F9FC]">
                    <span className="text-xs font-semibold text-[#1F2A44]">{mealName}</span>
                    {mealCals > 0 && <span className="text-[10px] font-semibold text-orange-600 tabular-nums">{mealCals} kcal</span>}
                  </div>
                  <div className="px-3 divide-y divide-[#F6F7FB]">
                    {foods.map((food, i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-[#1F2A44]">{food.food_name}</span>
                          {food.serving_quantity && (
                            <span className="text-[10px] text-[#9CA3AF] ml-1.5">{food.serving_quantity}{food.serving_unit || ''}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-semibold shrink-0 ml-2 tabular-nums">
                          {food.protein > 0 && <span className="text-blue-500">{food.protein}P</span>}
                          {food.carbs   > 0 && <span className="text-amber-500">{food.carbs}C</span>}
                          {food.fats    > 0 && <span className="text-rose-400">{food.fats}F</span>}
                          {food.calories > 0 && <span className="text-[#374151]">{food.calories} cal</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Section 3 — Weekly Adherence Grid ────────────────────────────────────────
function WeeklyAdherenceSection({ client, assignedPlan }) {
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { date: d, key: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE'), dayNum: format(d, 'd') };
    });
  }, []);

  const startDate = days[0].key;
  const endDate   = days[6].key;

  const { data: logs = [] } = useQuery({
    queryKey: ['food-log-week', client.id, startDate, endDate],
    queryFn: async () => {
      const all = await base44.entities.FoodLog.filter({ client_id: client.id });
      return all.filter(l => l.logged_date >= startDate && l.logged_date <= endDate && l.food_name);
    },
  });

  const targetCals = assignedPlan?.calories || 0;

  const dayStats = useMemo(() => {
    return days.map(({ key }) => {
      const dayLogs = logs.filter(l => l.logged_date === key);
      if (dayLogs.length === 0) return { status: 'empty' };
      const total = dayLogs.reduce((s, l) => s + (l.calories || 0), 0);
      if (targetCals > 0) {
        const pct = total / targetCals;
        return { status: pct >= 0.8 ? 'hit' : 'miss', calories: total };
      }
      return { status: 'logged', calories: total };
    });
  }, [days, logs, targetCals]);

  const hitDays   = dayStats.filter(d => d.status === 'hit').length;
  const loggedDays = dayStats.filter(d => d.status !== 'empty').length;
  const adherencePct = loggedDays > 0
    ? (targetCals > 0 ? Math.round((hitDays / 7) * 100) : Math.round((loggedDays / 7) * 100))
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">7-Day Adherence</h3>
        <span className={cn(
          'text-xs font-bold tabular-nums',
          adherencePct >= 80 ? 'text-emerald-600' : adherencePct >= 50 ? 'text-amber-500' : 'text-[#9CA3AF]'
        )}>
          {adherencePct}% this week
        </span>
      </div>

      <div className="flex gap-1.5">
        {days.map(({ key, label, dayNum }, i) => {
          const stat = dayStats[i];
          const isToday = key === format(new Date(), 'yyyy-MM-dd');
          const bgColor =
            stat.status === 'hit'    ? 'bg-emerald-400' :
            stat.status === 'logged' ? 'bg-emerald-400' :
            stat.status === 'miss'   ? 'bg-amber-400'   :
                                       'bg-[#E7EAF3]';
          return (
            <div key={key} className="flex-1 flex flex-col items-center gap-1">
              <div className={cn(
                'w-full aspect-square rounded-lg',
                bgColor,
                isToday && 'ring-2 ring-primary ring-offset-1'
              )} title={stat.calories ? `${stat.calories} kcal` : 'Not logged'} />
              <span className="text-[9px] font-medium text-[#9CA3AF]">{label}</span>
              <span className={cn('text-[9px] font-bold', isToday ? 'text-primary' : 'text-[#C4C9D4]')}>{dayNum}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-[#9CA3AF]">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" /> Hit target</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> Missed</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#E7EAF3] inline-block" /> Not logged</span>
      </div>
    </div>
  );
}

// ── Section 4 — Plan History ──────────────────────────────────────────────────
function PlanHistorySection({ client, allPlans }) {
  // Show all plans that have ever been assigned to this client
  const history = allPlans.filter(p =>
    (p.assigned_clients || []).includes(client.id) || p.id === client.assigned_nutrition_id
  );

  if (history.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4 space-y-3">
      <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">Plan History</h3>
      <div className="space-y-2">
        {history.map((plan, i) => (
          <div key={plan.id} className="flex items-center gap-3">
            <div className="flex flex-col items-center shrink-0">
              <div className={cn(
                'w-2.5 h-2.5 rounded-full',
                i === 0 ? 'bg-primary' : 'bg-[#D1D5DB]'
              )} />
              {i < history.length - 1 && <div className="w-px h-8 bg-[#E7EAF3] mt-0.5" />}
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{plan.emoji || '🥗'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1F2A44] truncate">{plan.title}</p>
                  <p className="text-[10px] text-[#9CA3AF]">
                    {plan.tracking_mode === 'habits' ? 'Habit Mode' : 'Macro Tracking'}
                    {plan.calories ? ` · ${plan.calories} kcal` : ''}
                    {plan.updated_date ? ` · Updated ${format(new Date(plan.updated_date), 'MMM d, yyyy')}` : ''}
                  </p>
                </div>
                {i === 0 && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">Active</span>
                )}
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
  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ['nutrition-plans'],
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      <AssignedPlanSection client={client} allPlans={allPlans} />
      <TodayFoodLogSection client={client} assignedPlan={assignedPlan} />
      <WeeklyAdherenceSection client={client} assignedPlan={assignedPlan} />
      <PlanHistorySection client={client} allPlans={allPlans} />
    </motion.div>
  );
}