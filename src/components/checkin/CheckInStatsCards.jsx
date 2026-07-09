import React, { useMemo } from 'react';
import { differenceInDays, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { Clock, CheckCircle2, TrendingUp, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

function getStreak(clientCIs) {
  const sorted = [...clientCIs].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  for (const ci of sorted) {
    const daysAgo = differenceInDays(new Date(), parseISO(ci.date));
    if (daysAgo <= (streak + 1) * 7 + 3) streak++;
    else break;
  }
  return streak;
}

export default function CheckInStatsCards({ checkIns, clients, latestPerClient }) {
  const stats = useMemo(() => {
    // Pending reviews
    const pending = latestPerClient.filter(ci => !ci.coach_responded && ci.review_status !== 'reviewed').length;

    // Reviewed this week
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const reviewedThisWeek = checkIns.filter(ci =>
      (ci.coach_responded || ci.review_status === 'reviewed') &&
      new Date(ci.updated_date || ci.date) >= weekStart
    ).length;

    // Avg response rate (% of active clients with check-in this week)
    const activeClients = clients.filter(c => c.lifecycle_status === 'active' || c.status === 'active');
    const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const submittedThisWeek = new Set(
      checkIns
        .filter(ci => {
          const d = parseISO(ci.date);
          return d >= lastWeekStart && d < thisWeekStart;
        })
        .map(ci => ci.client_id)
    );
    const responseRate = activeClients.length > 0
      ? Math.round((submittedThisWeek.size / activeClients.length) * 100)
      : 0;

    // Streak leaders
    const cisByClient = {};
    for (const ci of checkIns) {
      if (!cisByClient[ci.client_id]) cisByClient[ci.client_id] = [];
      cisByClient[ci.client_id].push(ci);
    }
    const streakLeaders = Object.entries(cisByClient)
      .map(([clientId, cis]) => ({ clientId, streak: getStreak(cis) }))
      .filter(x => x.streak >= 3)
      .sort((a, b) => b.streak - a.streak)
      .length;

    return { pending, reviewedThisWeek, responseRate, streakLeaders };
  }, [checkIns, clients, latestPerClient]);

  const cards = [
    {
      label: 'Pending Reviews',
      value: stats.pending,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      dot: 'bg-orange-400',
    },
    {
      label: 'Reviewed This Week',
      value: stats.reviewedThisWeek,
      icon: CheckCircle2,
      color: 'text-success',
      bg: 'bg-success/10',
      border: 'border-success',
      dot: 'bg-success',
    },
    {
      label: 'Avg Response Rate',
      value: `${stats.responseRate}%`,
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-accent',
      border: 'border-accent',
      dot: 'bg-primary',
    },
    {
      label: 'Streak Leaders',
      value: stats.streakLeaders,
      icon: Flame,
      color: 'text-ai',
      bg: 'bg-ai/10',
      border: 'border-ai',
      dot: 'bg-ai',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map(({ label, value, icon: Icon, color, bg, border, dot }) => (
        <div key={label} className={cn('bg-card rounded-xl border p-4 shadow-sm', border)}>
          <div className="flex items-center justify-between mb-3">
            <div className={cn('w-2 h-2 rounded-full', dot)} />
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', bg)}>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}