import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, AlertTriangle, TrendingUp, Bell, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

function buildInsights(plans, clients) {
  const planById = Object.fromEntries(plans.map(p => [p.id, p]));
  const clientsWithPlan = clients.filter(c => c.assigned_nutrition_id);
  const now = Date.now();
  const ms48h = 48 * 60 * 60 * 1000;

  let underProtein = 0;
  let lowAdherence = 0;
  let readyForIncrease = 0;
  let missedCheckins = 0;

  for (const client of clientsWithPlan) {
    const plan = planById[client.assigned_nutrition_id];
    if (!plan) continue;

    if ((plan.protein_g ?? 0) < 150) underProtein++;
    if (plan.adherence_rate != null && plan.adherence_rate < 70) lowAdherence++;
    const isConsistent = plan.consistent_weeks >= 2 || (plan.consistent_weeks == null && plan.adherence_rate >= 85);
    if (isConsistent) readyForIncrease++;
    const lastCheckin = plan.last_checkin ? new Date(plan.last_checkin).getTime() : null;
    if (!lastCheckin || now - lastCheckin > ms48h) missedCheckins++;
  }

  return [
    { key: 'protein',   count: underProtein,     title: 'Under protein target',       label: 'Missing daily protein goals',    icon: TrendingDown, bg: 'bg-rose-50',    border: 'border-rose-100',   iconBg: 'bg-rose-100',   iconColor: 'text-rose-600',   num: 'text-rose-700'   },
    { key: 'adherence', count: lowAdherence,      title: 'Low adherence',              label: 'Below 70% meal compliance',      icon: AlertTriangle, bg: 'bg-amber-50',  border: 'border-amber-100',  iconBg: 'bg-amber-100',  iconColor: 'text-amber-600',  num: 'text-amber-700'  },
    { key: 'increase',  count: readyForIncrease,  title: 'Ready for calorie increase', label: 'Consistent adherence weeks',     icon: TrendingUp,   bg: 'bg-emerald-50', border: 'border-emerald-100',iconBg: 'bg-emerald-100',iconColor: 'text-emerald-600',num: 'text-emerald-700'},
    { key: 'checkin',   count: missedCheckins,    title: 'Missed meal check-ins',      label: 'No log in 48+ hours',            icon: Bell,         bg: 'bg-blue-50',    border: 'border-blue-100',   iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   num: 'text-blue-700'   },
  ];
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 space-y-3 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-secondary" />
      <div className="w-12 h-7 rounded-lg bg-secondary" />
      <div className="space-y-1.5">
        <div className="h-3 w-3/4 rounded bg-secondary" />
        <div className="h-2.5 w-1/2 rounded bg-secondary" />
      </div>
    </div>
  );
}

export default function NutritionInsightCards() {
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['nutrition-plans-insights'],
    queryFn: () => base44.entities.NutritionPlan.list(),
  });
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-insights'],
    queryFn: () => base44.entities.Client.list(),
  });

  const loading = plansLoading || clientsLoading;

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const insights = buildInsights(plans, clients);
  const allClear = insights.every(i => i.count === 0);

  if (allClear) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-4 flex items-center gap-3"
      >
        <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-emerald-800">All clients on track 🎉</p>
          <p className="text-xs text-emerald-600 mt-0.5">No nutrition alerts at this time</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {insights.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.06 }}
            className={cn('rounded-2xl border p-5 flex flex-col gap-3', item.bg, item.border)}
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', item.iconBg)}>
              <Icon className={cn('w-4.5 h-4.5', item.iconColor)} />
            </div>
            <div>
              <div className={cn('text-2xl font-heading font-bold leading-none', item.num)}>{item.count}</div>
              <div className="text-sm font-semibold text-foreground mt-1">{item.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}