import React, { useMemo } from 'react';
import { Users, TrendingUp, ClipboardList, DollarSign } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { compositeAdherenceScore } from '@/lib/adherence';

function KPICard({ icon: Icon, label, value, sub, color = '#3B82F6', trend }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 transition-all hover:scale-[1.01]"
      style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}14` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {trend != null && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: trend >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: trend >= 0 ? '#22C55E' : '#EF4444' }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none" style={{ letterSpacing: '-0.02em' }}>{value}</p>
        <p className="text-[11px] mt-1.5 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
        {sub && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardKPIs({ clients, checkIns, payments }) {
  const active = useMemo(() =>
    clients.filter(c => c.status === 'active' || c.lifecycle_status === 'active').length,
    [clients]
  );

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

  const pendingReviews = useMemo(() =>
    checkIns.filter(ci => !ci.coach_responded && !ci.coach_notes &&
      differenceInDays(new Date(), parseISO(ci.date)) <= 14).length,
    [checkIns]
  );

  const monthRevenue = useMemo(() => {
    const now = new Date();
    return payments
      .filter(p => p.status === 'paid' && new Date(p.created_date).getMonth() === now.getMonth())
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <KPICard icon={Users} label="Active Clients" value={active} color="#3B82F6" />
      <KPICard
        icon={TrendingUp}
        label="Avg Adherence"
        value={avgAdherence != null ? `${avgAdherence}%` : '—'}
        color="#22C55E"
        sub="composite score"
      />
      <KPICard
        icon={ClipboardList}
        label="Pending Reviews"
        value={pendingReviews}
        color="#F59E0B"
        sub="check-ins"
      />
      <KPICard
        icon={DollarSign}
        label="Revenue"
        value={monthRevenue > 0 ? `$${monthRevenue.toLocaleString()}` : '$—'}
        color="#A78BFA"
        sub="this month"
      />
    </div>
  );
}