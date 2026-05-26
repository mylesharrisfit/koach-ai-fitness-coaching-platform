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

  const cards = [
    { label: 'Pending Reviews', value: stats.pending, icon: Clock, iconBg: 'bg-orange-50', iconColor: 'text-orange-500', dot: 'bg-orange-400', border: 'border-orange-100' },
    { label: 'Reviewed This Week', value: stats.reviewedThisWeek, icon: CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', dot: 'bg-emerald-400', border: 'border-emerald-100' },
    { label: 'Avg Response Rate', value: `${stats.responseRate}%`, icon: TrendingUp, iconBg: 'bg-blue-50', iconColor: 'text-blue-500', dot: 'bg-blue-400', border: 'border-blue-100' },
    { label: 'Streak Leaders', value: stats.streakLeaders, icon: Flame, iconBg: 'bg-purple-50', iconColor: 'text-purple-500', dot: 'bg-purple-400', border: 'border-purple-100' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map(({ label, value, icon: Icon, iconBg, iconColor, dot, border }) => (
        <div key={label} className={cn('bg-white rounded-xl border p-4 shadow-sm', border)}>
          <div className="flex items-center justify-between mb-3">
            <div className={cn('w-2 h-2 rounded-full', dot)} />
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
              <Icon className={cn('w-4 h-4', iconColor)} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827]">{value}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}