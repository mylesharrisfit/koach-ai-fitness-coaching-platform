import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, TrendingDown, TrendingUp, Activity, Weight, BarChart3, UserCheck, ArrowUp, ArrowDown, Minus, AlertTriangle, Star, Zap, Shield } from 'lucide-react';
import AnalyticsStatCard from '@/components/analytics/AnalyticsStatCard';
import AnalyticsTrendCard from '@/components/analytics/AnalyticsTrendCard';
import { getMonthRanges, calcRetentionTrend, calcChurnTrend, calcAdherenceTrend, calcWeightProgressTrend, calcSummaryStats } from '@/lib/analyticsEngine';
import { averageAdherenceScore, calculateStreak } from '@/lib/adherence';
import { differenceInDays, parseISO, format, startOfWeek, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

const BLUE = '#2563EB';

// ── Client Activity Table ──────────────────────────────────────────────────
function ClientActivityTable({ clients, checkIns }) {
  const rows = useMemo(() => clients
    .filter(c => c.lifecycle_status !== 'lead')
    .map(c => {
      const cis = checkIns.filter(ci => ci.client_id === c.id).sort((a, b) => new Date(b.date) - new Date(a.date));
      const adherence = averageAdherenceScore(cis) ?? 0;
      const streak = calculateStreak(cis);
      const lastDate = cis[0]?.date;
      const daysSince = lastDate ? differenceInDays(new Date(), parseISO(lastDate)) : 999;
      const recentAdh = averageAdherenceScore(cis.slice(0, 2));
      const prevAdh = averageAdherenceScore(cis.slice(2, 4));
      const trend = recentAdh != null && prevAdh != null ? recentAdh - prevAdh : null;
      return { client: c, adherence: Math.round(adherence), streak, lastDate, daysSince, trend };
    })
    .sort((a, b) => b.adherence - a.adherence),
  [clients, checkIns]);

  const adherenceColor = (v) => v >= 80 ? 'text-emerald-600 bg-emerald-50' : v >= 60 ? 'text-amber-600 bg-amber-50' : 'text-red-500 bg-red-50';
  const statusColors = { active: 'bg-emerald-100 text-emerald-700', at_risk: 'bg-red-100 text-red-600', completed: 'bg-violet-100 text-violet-700', alumni: 'bg-gray-100 text-gray-600', lead: 'bg-blue-100 text-blue-700' };

  if (rows.length === 0) return null;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E5E7EB]">
        <p className="text-sm font-semibold text-[#111827]">Client Activity Summary</p>
        <p className="text-xs text-[#6B7280] mt-0.5">All clients sorted by adherence score</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-[#6B7280]">Client</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">Last Check-In</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-[#6B7280]">Adherence</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-[#6B7280]">Streak</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-[#6B7280]">Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ client, adherence, streak, lastDate, daysSince, trend }) => (
              <tr key={client.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#EEF4FF] flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {client.name?.[0]}
                    </div>
                    <span className="font-medium text-[#111827] text-sm">{client.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize', statusColors[client.lifecycle_status] || 'bg-gray-100 text-gray-600')}>
                    {client.lifecycle_status?.replace('_', ' ') || 'unknown'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#6B7280]">
                  {lastDate ? (
                    <span className={daysSince > 14 ? 'text-red-500 font-medium' : daysSince > 7 ? 'text-amber-600' : 'text-[#6B7280]'}>
                      {daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', adherenceColor(adherence))}>
                    {adherence}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold text-[#111827]">{streak > 0 ? `🔥 ${streak}d` : '—'}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {trend === null ? <span className="text-[#9CA3AF]">—</span>
                    : trend > 3 ? <ArrowUp className="w-4 h-4 text-emerald-500 mx-auto" />
                    : trend < -3 ? <ArrowDown className="w-4 h-4 text-red-500 mx-auto" />
                    : <Minus className="w-4 h-4 text-[#9CA3AF] mx-auto" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Weekly Performance Grid ────────────────────────────────────────────────
function WeeklyGrid({ checkIns }) {
  const days = useMemo(() => {
    const week = [];
    const mon = startOfWeek(new Date(), { weekStartsOn: 1 });
    for (let i = 0; i < 7; i++) {
      const d = addDays(mon, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayCIs = checkIns.filter(ci => ci.date === dateStr);
      const avgComp = dayCIs.length ? Math.round(dayCIs.reduce((s, ci) => s + ((ci.compliance_training || 0) + (ci.compliance_nutrition || 0)) / 2, 0) / dayCIs.length) : 0;
      week.push({ label: format(d, 'EEE'), dateStr, count: dayCIs.length, avgComp });
    }
    return week;
  }, [checkIns]);

  const maxCount = Math.max(...days.map(d => d.count), 1);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
      <p className="text-sm font-semibold text-[#111827] mb-1">Weekly Performance Grid</p>
      <p className="text-xs text-[#6B7280] mb-4">Check-in activity this week (Mon–Sun)</p>
      <div className="grid grid-cols-7 gap-2">
        {days.map(d => {
          const intensity = d.count === 0 ? 0 : Math.round((d.count / maxCount) * 5);
          const bgMap = ['bg-[#F3F4F6]', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-[#2563EB]'];
          const textMap = ['text-[#9CA3AF]', 'text-blue-700', 'text-blue-800', 'text-white', 'text-white', 'text-white'];
          return (
            <div key={d.dateStr} className="flex flex-col items-center gap-1.5">
              <div className={cn('w-full aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all', bgMap[intensity], textMap[intensity])}>
                {d.count || '0'}
              </div>
              <span className="text-[10px] text-[#9CA3AF] font-medium">{d.label}</span>
              {d.count > 0 && <span className="text-[10px] text-[#6B7280]">{d.avgComp}%</span>}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] text-[#9CA3AF]">Less</span>
        {['bg-[#F3F4F6]', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-[#2563EB]'].map((bg, i) => (
          <div key={i} className={cn('w-3.5 h-3.5 rounded', bg)} />
        ))}
        <span className="text-[10px] text-[#9CA3AF]">More</span>
      </div>
    </div>
  );
}

// ── Top Metric Cards ───────────────────────────────────────────────────────
function TopMetricCards({ clients, checkIns }) {
  const metrics = useMemo(() => {
    const active = clients.filter(c => c.lifecycle_status === 'active' || c.status === 'active');

    let mostImproved = null, highestStreak = null, mostConsistent = null, churnRisk = null;
    let bestImprovement = -Infinity, bestStreak = 0, bestConsistency = -Infinity, worstScore = Infinity;

    for (const c of active) {
      const cis = checkIns.filter(ci => ci.client_id === c.id).sort((a, b) => new Date(b.date) - new Date(a.date));
      const streak = calculateStreak(cis);
      const recentScore = averageAdherenceScore(cis.slice(0, 2));
      const olderScore = averageAdherenceScore(cis.slice(2, 4));
      const improvement = recentScore != null && olderScore != null ? recentScore - olderScore : null;
      const missed = cis.length > 0 ? differenceInDays(new Date(), parseISO(cis[0].date)) : 999;

      if (improvement !== null && improvement > bestImprovement) { bestImprovement = improvement; mostImproved = { client: c, value: `+${Math.round(improvement)}%` }; }
      if (streak > bestStreak) { bestStreak = streak; highestStreak = { client: c, value: `${streak} days` }; }
      if (missed < bestConsistency || bestConsistency === -Infinity) { bestConsistency = missed; mostConsistent = { client: c, value: missed === 0 ? 'Today' : `${missed}d ago` }; }
      if (recentScore !== null && recentScore < worstScore) { worstScore = recentScore; churnRisk = { client: c, value: `${Math.round(recentScore)}% adherence` }; }
    }

    return [
      { icon: <TrendingUp className="w-4 h-4 text-emerald-600" />, label: 'Most Improved', bg: 'bg-emerald-50', ...mostImproved },
      { icon: <Zap className="w-4 h-4 text-amber-500" />, label: 'Highest Streak', bg: 'bg-amber-50', ...highestStreak },
      { icon: <Shield className="w-4 h-4 text-blue-600" />, label: 'Most Consistent', bg: 'bg-blue-50', ...mostConsistent },
      { icon: <AlertTriangle className="w-4 h-4 text-red-500" />, label: 'Churn Risk', bg: 'bg-red-50', ...churnRisk },
    ];
  }, [clients, checkIns]);

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((m, i) => (
        <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-start gap-3">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', m.bg)}>{m.icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-[#6B7280] font-medium">{m.label}</p>
            <p className="text-sm font-bold text-[#111827] mt-0.5 truncate">{m.client?.name || '—'}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">{m.value || 'No data'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Retention Funnel ───────────────────────────────────────────────────────
function RetentionFunnel({ clients }) {
  const stages = useMemo(() => {
    const total = clients.length || 1;
    const counts = {
      lead: clients.filter(c => c.lifecycle_status === 'lead').length,
      active: clients.filter(c => c.lifecycle_status === 'active').length,
      completed: clients.filter(c => c.lifecycle_status === 'completed').length,
      alumni: clients.filter(c => c.lifecycle_status === 'alumni').length,
    };
    return [
      { label: 'Lead', count: counts.lead, pct: Math.round((counts.lead / total) * 100) },
      { label: 'Active', count: counts.active, pct: Math.round((counts.active / total) * 100) },
      { label: 'Completed', count: counts.completed, pct: Math.round((counts.completed / total) * 100) },
      { label: 'Alumni', count: counts.alumni, pct: Math.round((counts.alumni / total) * 100) },
    ];
  }, [clients]);

  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
      <p className="text-sm font-semibold text-[#111827] mb-1">Retention Funnel</p>
      <p className="text-xs text-[#6B7280] mb-4">Client lifecycle stage distribution</p>
      <div className="space-y-3">
        {stages.map((s, i) => {
          const barPct = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
          const conversion = i > 0 && stages[i - 1].count > 0 ? Math.round((s.count / stages[i - 1].count) * 100) : null;
          return (
            <div key={s.label}>
              {i > 0 && conversion !== null && (
                <div className="flex items-center gap-2 my-1 pl-1">
                  <div className="w-px h-3 bg-[#E5E7EB] ml-3" />
                  <span className="text-[10px] text-[#9CA3AF]">{conversion}% conversion</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#374151] w-20 shrink-0 font-medium">{s.label}</span>
                <div className="flex-1 bg-[#F3F4F6] rounded-full h-7 overflow-hidden relative">
                  <div className="h-full bg-[#E5E7EB] rounded-full transition-all" style={{ width: `${Math.max(barPct, 2)}%` }} />
                  <span className="absolute inset-0 flex items-center px-3 text-xs font-semibold text-[#374151]">
                    {s.count} clients
                  </span>
                </div>
                <span className="text-xs font-bold text-[#111827] w-10 text-right">{s.pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30');

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: checkIns = [] } = useQuery({ queryKey: ['checkins-analytics'], queryFn: () => base44.entities.CheckIn.list('-date', 500) });

  const months = useMemo(() => getMonthRanges(6), []);
  const retentionTrend = useMemo(() => calcRetentionTrend(clients, months), [clients, months]);
  const churnTrend = useMemo(() => calcChurnTrend(clients, checkIns, months), [clients, checkIns, months]);
  const adherenceTrend = useMemo(() => calcAdherenceTrend(checkIns, months), [checkIns, months]);
  const weightTrend = useMemo(() => calcWeightProgressTrend(checkIns, clients, months), [checkIns, clients, months]);
  const stats = useMemo(() => calcSummaryStats(clients, checkIns), [clients, checkIns]);

  const retentionDelta = retentionTrend.length >= 2 ? retentionTrend[retentionTrend.length - 1].value - retentionTrend[retentionTrend.length - 2].value : null;
  const adherenceDelta = adherenceTrend.length >= 2 ? adherenceTrend[adherenceTrend.length - 1].value - adherenceTrend[adherenceTrend.length - 2].value : null;

  const trendLabel = (delta) => {
    if (delta === null) return 'No data yet';
    if (Math.abs(delta) < 1) return '—';
    return `${delta > 0 ? '+' : ''}${Math.round(delta)}% vs last month`;
  };
  const trendPositive = (delta) => delta === null || Math.abs(delta) < 1 ? null : delta >= 0;

  const handleExport = () => {
    const rows = [['Name', 'Status', 'Adherence', 'Goal']];
    clients.forEach(c => rows.push([c.name, c.lifecycle_status, '', c.goal]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv); a.download = 'analytics.csv'; a.click();
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-5">
      {/* ── Dark header ── */}
      <div className="bg-[#111827] rounded-xl p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white leading-tight">Coach Analytics</h1>
            <p className="text-sm text-white/50 mt-0.5">Track retention, adherence, and client progress trends</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="all">All time</option>
          </select>
          <button onClick={handleExport} className="px-4 py-1.5 bg-white text-[#111827] rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors">
            Export
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsStatCard dark title="Retention Rate" value={`${stats.retentionRate}%`} subtitle={`${stats.active} active clients`} icon={UserCheck}
          trendLabel={trendLabel(retentionDelta)} trendPositive={trendPositive(retentionDelta)} />
        <AnalyticsStatCard dark title="Avg Adherence" value={`${stats.avgAdherence}%`} subtitle="Training + nutrition avg" icon={Activity}
          trendLabel={trendLabel(adherenceDelta)} trendPositive={trendPositive(adherenceDelta)} />
        <AnalyticsStatCard dark title="Avg Weight Change" value={stats.avgWeightDelta != null ? `${stats.avgWeightDelta > 0 ? '+' : ''}${stats.avgWeightDelta} lbs` : '—'} subtitle="Across all clients" icon={Weight}
          trendLabel={stats.avgWeightDelta != null ? (stats.avgWeightDelta < 0 ? 'On track' : stats.avgWeightDelta === 0 ? 'Stable' : 'Gaining') : 'Not enough data'}
          trendPositive={stats.avgWeightDelta != null ? stats.avgWeightDelta <= 0 : null} />
        <AnalyticsStatCard dark title="Churn Risk" value={`${stats.churnRate}%`} subtitle={`${stats.atRisk} at-risk client${stats.atRisk !== 1 ? 's' : ''}`} icon={TrendingDown}
          trendLabel={stats.atRisk > 0 ? 'Needs attention' : 'All good'} trendPositive={stats.atRisk === 0} />
      </div>

      {/* ── Trend charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AnalyticsTrendCard title="Client Retention Rate" subtitle="% of enrolled clients staying active" data={retentionTrend} unit="%" color={BLUE} referenceValue={80}
          badge={`${stats.retentionRate}%`} badgeColor="bg-blue-50 text-blue-700" />
        <AnalyticsTrendCard title="Avg Adherence Score" subtitle="Training + nutrition compliance" data={adherenceTrend} unit="%" color={BLUE} referenceValue={70}
          badge={`${stats.avgAdherence}%`} badgeColor="bg-blue-50 text-blue-700" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AnalyticsTrendCard title="Avg Weight Progress" subtitle="Mean lbs change from each client's baseline" data={weightTrend} unit=" lbs" color={BLUE} referenceValue={0}
          formatter={v => `${v > 0 ? '+' : ''}${v} lbs`} badge={stats.avgWeightDelta != null ? `${stats.avgWeightDelta > 0 ? '+' : ''}${stats.avgWeightDelta} lbs` : '—'} badgeColor="bg-blue-50 text-blue-700" />
        <AnalyticsTrendCard title="Churn Rate" subtitle="% of clients flagged at-risk each month" data={churnTrend} unit="%" color={BLUE} referenceValue={10}
          badge={`${stats.churnRate}%`} badgeColor={stats.churnRate > 10 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'} />
      </div>

      {/* ── Client Activity Table ── */}
      <ClientActivityTable clients={clients} checkIns={checkIns} />

      {/* ── Weekly Grid + Top Metrics (side by side) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <WeeklyGrid checkIns={checkIns} />
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#111827]">Top Metrics</p>
          <TopMetricCards clients={clients} checkIns={checkIns} />
        </div>
      </div>

      {/* ── Retention Funnel ── */}
      <RetentionFunnel clients={clients} />
    </div>
  );
}