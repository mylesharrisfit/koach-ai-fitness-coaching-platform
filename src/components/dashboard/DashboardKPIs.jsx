import React, { useMemo } from 'react';
import { Users, TrendingUp, ClipboardList, DollarSign } from 'lucide-react';
import { differenceInDays, parseISO, startOfMonth, subMonths } from 'date-fns';
import { compositeAdherenceScore } from '@/lib/adherence';
import { useNavigate } from 'react-router-dom';

// Mini adherence bar shown under the % value
function AdherenceBar({ pct }) {
  const color = pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
  return (
    <div className="mt-2 h-1.5 w-full rounded-full" style={{ background: '#f3f4f6' }}>
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
        style={{ background: '#111827', minHeight: 110 }}
      >
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <Icon className="w-4 h-4 text-white/70" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
        </div>
        <div>
          <p className="text-3xl font-extrabold leading-none text-white" style={{ letterSpacing: '-0.03em' }}>{value}</p>
          {sub && <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>}
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
        background: bgGrad,
        border: `1px solid ${borderColor}`,
        boxShadow: `0 1px 4px rgba(0,0,0,0.05), inset 0 -3px 0 0 ${color}`,
        minHeight: 110,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      </div>
      <div>
        <p
          className="text-3xl font-extrabold leading-none"
          style={{ letterSpacing: '-0.03em', color: sub === 'All caught up ✓' ? '#16a34a' : '#111827' }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-1 font-medium" style={{ color: subColor || '#9ca3af' }}>{sub}</p>
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

  const adherenceColor = avgAdherence === null ? '#9ca3af'
    : avgAdherence >= 80 ? '#16a34a'
    : avgAdherence >= 50 ? '#d97706'
    : '#dc2626';

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
        color="#f59e0b"
        bgGrad="linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)"
        borderColor="#fde68a"
        extra={avgAdherence !== null ? <AdherenceBar pct={avgAdherence} /> : null}
      />

      {/* Pending Reviews — dark */}
      <KPICard
        dark
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
          monthRevenue === 0 ? '#3b82f6'
          : revenueTrend !== null && revenueTrend >= 0 ? '#16a34a'
          : '#dc2626'
        }
        color="#16a34a"
        bgGrad="linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)"
        borderColor="#bbf7d0"
        onClick={monthRevenue === 0 ? () => navigate('/revenue') : undefined}
      />
    </div>
  );
}