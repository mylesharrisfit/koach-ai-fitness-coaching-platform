import React, { useMemo } from 'react';
import { DollarSign, Users, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { differenceInMonths, subMonths, startOfMonth, parseISO } from 'date-fns';

function KPICard({ icon: Icon, label, value, sub, trend, trendLabel, color = 'var(--tc-primary)', badge }) {
  const isUp = (trend || 0) > 0;
  const isFlat = trend === 0 || trend === undefined;
  const TrendIcon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  const trendColor = isFlat ? 'var(--tc-muted-foreground)' : isUp ? 'var(--tc-success)' : 'var(--tc-destructive)';

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${badge.color}15`, color: badge.color }}>
            {badge.label}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      {trend !== undefined && (
        <div className="flex items-center gap-1">
          <TrendIcon className="w-3.5 h-3.5" style={{ color: trendColor }} />
          <span className="text-xs font-semibold" style={{ color: trendColor }}>
            {isFlat ? '0%' : `${Math.abs(trend).toFixed(1)}%`}
          </span>
          <span className="text-xs text-muted-foreground">{trendLabel || 'vs last month'}</span>
        </div>
      )}
      {sub && !trend && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function BIKPIRow({ clients, payments, checkIns }) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));

  const activeClients = useMemo(() => clients.filter(c => c.lifecycle_status === 'active' || c.status === 'active'), [clients]);
  const lastMonthActive = useMemo(() => {
    return clients.filter(c => {
      if (c.lifecycle_status !== 'active' && c.status !== 'active') return false;
      const sd = c.start_date ? parseISO(c.start_date) : c.created_date ? new Date(c.created_date) : null;
      return !sd || sd < thisMonthStart;
    });
  }, [clients, thisMonthStart]);

  const mrr = useMemo(() => activeClients.reduce((s, c) => s + (c.monthly_rate || 0), 0), [activeClients]);
  const lastMrr = useMemo(() => lastMonthActive.reduce((s, c) => s + (c.monthly_rate || 0), 0), [lastMonthActive]);
  const mrrTrend = lastMrr > 0 ? ((mrr - lastMrr) / lastMrr) * 100 : 0;
  const projectedMrr = mrr + (mrr * (mrrTrend / 100));

  const newThisMonth = clients.filter(c => {
    const sd = c.start_date ? parseISO(c.start_date) : c.created_date ? new Date(c.created_date) : null;
    return sd && sd >= thisMonthStart;
  }).length;

  const newLastMonth = clients.filter(c => {
    const sd = c.start_date ? parseISO(c.start_date) : c.created_date ? new Date(c.created_date) : null;
    return sd && sd >= lastMonthStart && sd < thisMonthStart;
  }).length;

  const clientTrend = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 : 0;

  const avgLTV = useMemo(() => {
    const withRate = activeClients.filter(c => c.monthly_rate > 0);
    if (!withRate.length) return 0;
    const avg = withRate.reduce((sum, c) => {
      const months = c.start_date ? Math.max(1, differenceInMonths(now, parseISO(c.start_date))) : 3;
      return sum + (c.monthly_rate * months);
    }, 0) / withRate.length;
    return Math.round(avg);
  }, [activeClients]);

  const completedClients = clients.filter(c => c.lifecycle_status === 'completed' || c.lifecycle_status === 'alumni').length;
  const churnRate = clients.length > 0 ? ((completedClients / clients.length) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        icon={DollarSign}
        label="Monthly Recurring Revenue"
        value={`$${mrr.toLocaleString()}`}
        trend={mrrTrend}
        color="var(--tc-primary)"
        badge={projectedMrr > mrr ? { label: `→ $${Math.round(projectedMrr).toLocaleString()} projected`, color: 'var(--tc-success)' } : null}
      />
      <KPICard
        icon={Users}
        label="Active Clients"
        value={activeClients.length}
        trend={clientTrend}
        trendLabel="vs last month"
        color="var(--tc-ai)"
        badge={{ label: `+${newThisMonth} new`, color: 'var(--tc-ai)' }}
      />
      <KPICard
        icon={TrendingUp}
        label="Avg. Client LTV"
        value={avgLTV > 0 ? `$${avgLTV.toLocaleString()}` : '—'}
        sub="Lifetime value estimate"
        color="var(--tc-warning)"
      />
      <KPICard
        icon={TrendingDown}
        label="Churn / Completed"
        value={`${churnRate.toFixed(1)}%`}
        sub={`${completedClients} clients completed`}
        color="var(--tc-destructive)"
      />
    </div>
  );
}