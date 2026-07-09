import React, { useMemo } from 'react';
import { differenceInDays, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { Clock, CheckCircle2, TrendingUp, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

function calcStreak(clientCIs) {
  const sorted = [...clientCIs].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  for (const ci of sorted) {
    const d = differenceInDays(new Date(), parseISO(ci.date));
    if (d <= (streak + 1) * 7 + 3) streak++;
    else break;
  }
  return streak;
}

function StatCard({ label, value, dot, iconBg, iconColor, children }) {
  return (
    <div className={cn('bg-card rounded-xl border p-4 shadow-sm', `border-${dot.split('-')[1]}-100`)}>
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-2 h-2 rounded-full', dot)} />
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
          {children}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default function CheckInStatsRow({ checkIns, clients, latestPerClient }) {
  const stats = useMemo(() => {
    const pending = latestPerClient.filter(ci =>
      !ci.coach_responded && ci.review_status !== 'reviewed'
    ).length;

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const reviewedThisWeek = checkIns.filter(ci =>
      (ci.coach_responded || ci.review_status === 'reviewed') &&
      new Date(ci.updated_date || ci.date) >= weekStart
    ).length;

    const activeClients = clients.filter(c => c.lifecycle_status === 'active' || c.status === 'active');
    const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
    const submitted = new Set(
      checkIns
        .filter(ci => { const d = parseISO(ci.date); return d >= lastWeekStart && d < weekStart; })
        .map(ci => ci.client_id)
    );
    const responseRate = activeClients.length > 0
      ? Math.round((submitted.size / activeClients.length) * 100) : 0;

    const cisByClient = {};
    for (const ci of checkIns) {
      (cisByClient[ci.client_id] = cisByClient[ci.client_id] || []).push(ci);
    }
    const streakLeaders = Object.values(cisByClient).filter(cis => calcStreak(cis) >= 3).length;

    return { pending, reviewedThisWeek, responseRate, streakLeaders };
  }, [checkIns, clients, latestPerClient]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div className="bg-card rounded-xl border border-orange-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="w-2 h-2 rounded-full bg-orange-400" />
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-50">
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Pending Reviews</p>
      </div>

      <div className="bg-card rounded-xl border border-success p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="w-2 h-2 rounded-full bg-success" />
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-success/10">
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{stats.reviewedThisWeek}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Reviewed This Week</p>
      </div>

      <div className="bg-card rounded-xl border border-accent p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{stats.responseRate}%</p>
        <p className="text-xs text-muted-foreground mt-0.5">Avg Response Rate</p>
      </div>

      <div className="bg-card rounded-xl border border-ai p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="w-2 h-2 rounded-full bg-ai" />
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-ai/10">
            <Flame className="w-4 h-4 text-ai" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{stats.streakLeaders}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Streak Leaders</p>
      </div>
    </div>
  );
}