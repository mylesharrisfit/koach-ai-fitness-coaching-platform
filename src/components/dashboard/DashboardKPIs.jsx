import React, { useMemo } from 'react';
import { Users, TrendingUp, ClipboardList, DollarSign } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { compositeAdherenceScore } from '@/lib/adherence';

function KPICard({ icon: Icon, label, value, sub, color = '#3B82F6', bg = '#EFF6FF' }) {
  return (
    <div className="bg-white rounded-xl p-4 flex flex-col gap-3 transition-all hover:shadow-md"
      style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none" style={{ letterSpacing: '-0.02em' }}>{value}</p>
        <p className="text-xs font-semibold mt-1.5 text-gray-500">{label}</p>
        {sub && <p className="text-[10px] mt-0.5 text-gray-400">{sub}</p>}
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
    return (payments || [])
      .filter(p => p.status === 'paid' && new Date(p.created_date).getMonth() === now.getMonth())
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <KPICard
        icon={Users}
        label="Active Clients"
        value={active}
        color="#3B82F6"
        bg="#EFF6FF"
      />
      <KPICard
        icon={TrendingUp}
        label="Avg Adherence"
        value={avgAdherence != null ? `${avgAdherence}%` : '—'}
        sub="composite score"
        color="#16A34A"
        bg="#F0FDF4"
      />
      <KPICard
        icon={ClipboardList}
        label="Pending Reviews"
        value={pendingReviews}
        sub="check-ins"
        color="#D97706"
        bg="#FFFBEB"
      />
      <KPICard
        icon={DollarSign}
        label="Revenue"
        value={monthRevenue > 0 ? `$${monthRevenue.toLocaleString()}` : '$—'}
        sub="this month"
        color="#7C3AED"
        bg="#F5F3FF"
      />
    </div>
  );
}