import React, { useMemo } from 'react';
import { Users, TrendingUp, ClipboardList, DollarSign } from 'lucide-react';
import { differenceInDays, parseISO, startOfMonth, subMonths } from 'date-fns';
import { compositeAdherenceScore } from '@/lib/adherence';
import { useNavigate } from 'react-router-dom';

// Mini adherence bar shown under the % value
function AdherenceBar({ pct }) {
  const color = pct < 40 ? 'var(--tc-destructive)' : 'var(--tc-primary)';
  return (
    <div className="mt-2 h-1.5 w-full rounded-full" style={{ background: 'var(--tc-muted)' }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }}
      />
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, subColor, color, bgGrad, borderColor, extra, onClick, dark }) {
  if (dark) {
    return (
      <div
        className="rounded-xl p-4 flex flex-col gap-2 transition-all hover:opacity-90 cursor-default"
        onClick={onClick}
        style={{ background: 'var(--tc-sidebar)', minHeight: 110 }}
      >
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, white 10%, transparent)' }}>
            <Icon className="w-4 h-4 text-white/70" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'color-mix(in srgb, white 40%, transparent)' }}>{label}</p>
        </div>
        <div>
          <p className="text-3xl font-extrabold leading-none text-white" style={{ letterSpacing: '-0.03em' }}>{value}</p>
          {sub && <p className="text-xs mt-1 font-medium" style={{ color: 'color-mix(in srgb, white 40%, transparent)' }}>{sub}</p>}
          {extra}
        </div>
      </div>
    );
  }
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2 transition-all hover:shadow-md cursor-default"
      onClick={onClick}
      style={{
        background: 'var(--tc-card)',
        border: '1px solid var(--tc-border)',
        minHeight: 110,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--tc-background)' }}>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <div>
        <p className="text-2xl font-bold leading-none text-foreground" style={{ letterSpacing: '-0.02em' }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-1" style={{ color: subColor || 'var(--tc-muted-foreground)' }}>{sub}</p>
        )}
        {extra}
      </div>
    </div>
  );
}

export default function DashboardKPIs({ clients, checkIns, payments }) {
  const navigate = useNavigate();
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = new Date(thisMonthStart.getTime() - 1);

  // Active clients
  const active = useMemo(() =>
    clients.filter(c => c.status === 'active' || c.lifecycle_status === 'active').length,
    [clients]
  );

  // New active clients this month vs last
  const newThisMonth = useMemo(() =>
    clients.filter(c =>
      (c.status === 'active' || c.lifecycle_status === 'active') &&
      c.created_date && new Date(c.created_date) >= thisMonthStart
    ).length,
    [clients, thisMonthStart]
  );

  // Avg adherence
  const avgAdherence = useMemo(() => {
    const scores = clients
      .map(c => {
        const cis = checkIns.filter(ci => ci.client_id === c.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        return compositeAdherenceScore(cis);
      })
      .filter(s => s !== null);
    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [clients, checkIns]);

  const adherenceColor = avgAdherence === null ? 'var(--tc-muted-foreground)'
    : avgAdherence >= 80 ? 'var(--tc-success)'
    : avgAdherence >= 50 ? 'var(--tc-warning)'
    : 'var(--tc-destructive)';

  // Pending reviews
  const pendingReviews = useMemo(() =>
    checkIns.filter(ci => !ci.coach_responded && !ci.coach_notes &&
      differenceInDays(new Date(), parseISO(ci.date)) <= 14).length,
    [checkIns]
  );

  // Revenue
  const monthRevenue = useMemo(() => {
    return (payments || [])
      .filter(p => p.status === 'paid' && new Date(p.created_date) >= thisMonthStart)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments, thisMonthStart]);

  const lastMonthRevenue = useMemo(() => {
    return (payments || [])
      .filter(p => p.status === 'paid' &&
        new Date(p.created_date) >= lastMonthStart &&
        new Date(p.created_date) <= lastMonthEnd)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments, lastMonthStart, lastMonthEnd]);

  const revenueTrend = useMemo(() => {
    if (!lastMonthRevenue || !monthRevenue) return null;
    const pct = Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
    return pct;
  }, [monthRevenue, lastMonthRevenue]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

      {/* Active Clients — dark */}
      <KPICard
        dark
        icon={Users}
        label="Active Clients"
        value={active}
        sub={newThisMonth > 0 ? `+${newThisMonth} this month` : 'same as last month'}
      />

      {/* Avg Adherence — light */}
      <KPICard
        icon={TrendingUp}
        label="Avg Adherence"
        value={avgAdherence !== null ? `${avgAdherence}%` : 'No data yet'}
        sub={avgAdherence !== null
          ? avgAdherence >= 80 ? 'Great compliance 🎉'
          : avgAdherence >= 50 ? 'Room to improve'
          : 'Needs attention'
          : 'Check-ins needed'}
        subColor={adherenceColor}
        extra={avgAdherence !== null ? <AdherenceBar pct={avgAdherence} /> : null}
      />

      {/* Pending Reviews — light */}
      <KPICard
        icon={ClipboardList}
        label="Pending Reviews"
        value={pendingReviews === 0 ? 'All clear' : pendingReviews}
        sub={pendingReviews === 0 ? 'All caught up ✓' : `check-in${pendingReviews !== 1 ? 's' : ''} awaiting`}
        onClick={pendingReviews > 0 ? () => navigate('/checkin-review') : undefined}
      />

      {/* Revenue — light */}
      <KPICard
        icon={DollarSign}
        label="Revenue"
        value={monthRevenue > 0 ? `$${monthRevenue.toLocaleString()}` : '—'}
        sub={
          monthRevenue > 0 && revenueTrend !== null
            ? `${revenueTrend >= 0 ? '+' : ''}${revenueTrend}% vs last month`
            : monthRevenue === 0
            ? 'Set up billing to track'
            : 'this month'
        }
        subColor={
          monthRevenue === 0 ? 'var(--tc-muted-foreground)'
          : revenueTrend !== null && revenueTrend >= 0 ? 'var(--tc-success)'
          : 'var(--tc-destructive)'
        }
        onClick={monthRevenue === 0 ? () => navigate('/revenue') : undefined}
      />
    </div>
  );
}