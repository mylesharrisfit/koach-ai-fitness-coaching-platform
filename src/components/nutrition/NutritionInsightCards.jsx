import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, AlertTriangle, TrendingUp, Bell, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

function isOlderThan48h(dateStr) {
  if (!dateStr) return true;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff > 48 * 60 * 60 * 1000;
}

function InsightSkeleton() {
  return (
    <div className="h-28 bg-secondary/60 rounded-2xl animate-pulse" />
  );
}

function InsightCard({ icon: Icon, label, sublabel, count, bg, border, iconColor, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07 }}
      className={cn('flex items-start gap-4 p-4 rounded-2xl border', bg, border)}
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconColor, 'bg-white/70')}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-foreground leading-none">{count}</p>
        <p className="text-xs font-bold text-foreground/80 mt-1">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</p>
      </div>
    </motion.div>
  );
}

export default function NutritionInsightCards() {
  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['nutrition-plans-insights'],
    queryFn: () => base44.entities.NutritionPlan.list(),
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients-insights'],
    queryFn: () => base44.entities.Client.list(),
  });

  const isLoading = loadingPlans || loadingClients;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0,1,2,3].map(i => <InsightSkeleton key={i} />)}
      </div>
    );
  }

  // Build a map of plan by id for quick lookup
  const planById = Object.fromEntries(plans.map(p => [p.id, p]));

  // For each client, get their assigned plan
  const clientPlans = clients
    .map(c => ({ client: c, plan: planById[c.assigned_nutrition_id] }))
    .filter(cp => cp.plan);

  const underProtein = clientPlans.filter(({ plan }) => (plan.protein_g ?? 0) < 150).length;
  const lowAdherence = clientPlans.filter(({ plan }) => (plan.adherence_rate ?? 0) < 70).length;
  const readyForIncrease = clientPlans.filter(({ plan }) =>
    plan.consistent_weeks >= 2 || (plan.consistent_weeks == null && (plan.adherence_rate ?? 0) >= 85)
  ).length;
  const missedCheckins = clientPlans.filter(({ plan }) => isOlderThan48h(plan.last_checkin)).length;

  const allGood = underProtein === 0 && lowAdherence === 0 && readyForIncrease === 0 && missedCheckins === 0;

  if (allGood) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl"
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        <p className="text-sm font-semibold text-emerald-700">All clients on track 🎉</p>
      </motion.div>
    );
  }

  const INSIGHTS = [
    {
      label: 'Under protein target',
      sublabel: 'Missing daily protein goals',
      count: underProtein,
      icon: TrendingDown,
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      iconColor: 'text-rose-500',
    },
    {
      label: 'Low adherence',
      sublabel: 'Below 70% meal compliance',
      count: lowAdherence,
      icon: AlertTriangle,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconColor: 'text-amber-500',
    },
    {
      label: 'Ready for calorie increase',
      sublabel: 'Consistent surplus weeks',
      count: readyForIncrease,
      icon: TrendingUp,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Missed meal check-ins',
      sublabel: 'No log in 48+ hours',
      count: missedCheckins,
      icon: Bell,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconColor: 'text-blue-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {INSIGHTS.map((insight, i) => (
        <InsightCard key={insight.label} {...insight} index={i} />
      ))}
    </div>
  );
}