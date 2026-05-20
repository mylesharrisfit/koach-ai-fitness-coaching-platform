import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, TrendingDown, Activity, Weight, BarChart3, UserCheck } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import AnalyticsStatCard from '@/components/analytics/AnalyticsStatCard';
import AnalyticsTrendCard from '@/components/analytics/AnalyticsTrendCard';
import {
  getMonthRanges,
  calcRetentionTrend,
  calcChurnTrend,
  calcAdherenceTrend,
  calcWeightProgressTrend,
  calcSummaryStats,
} from '@/lib/analyticsEngine';

export default function Analytics() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkins-analytics'],
    queryFn: () => base44.entities.CheckIn.list('-date', 500),
  });

  const months = useMemo(() => getMonthRanges(6), []);

  const retentionTrend = useMemo(() => calcRetentionTrend(clients, months), [clients, months]);
  const churnTrend = useMemo(() => calcChurnTrend(clients, checkIns, months), [clients, checkIns, months]);
  const adherenceTrend = useMemo(() => calcAdherenceTrend(checkIns, months), [checkIns, months]);
  const weightTrend = useMemo(() => calcWeightProgressTrend(checkIns, clients, months), [checkIns, clients, months]);
  const stats = useMemo(() => calcSummaryStats(clients, checkIns), [clients, checkIns]);

  // Retention month-over-month delta
  const retentionDelta = retentionTrend.length >= 2
    ? retentionTrend[retentionTrend.length - 1].value - retentionTrend[retentionTrend.length - 2].value
    : null;

  const adherenceDelta = adherenceTrend.length >= 2
    ? adherenceTrend[adherenceTrend.length - 1].value - adherenceTrend[adherenceTrend.length - 2].value
    : null;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Coach Analytics"
        subtitle="Track retention, adherence, and client progress trends over time"
        actions={
          <div className="flex items-center gap-2 text-xs text-[#374151] bg-[#F6F7FB] border border-[#E7EAF3] px-3 py-1.5 rounded-lg">
            <BarChart3 className="w-3.5 h-3.5" />
            Last 6 months
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 fade-up">
        <AnalyticsStatCard
          dark
          title="Retention Rate"
          value={`${stats.retentionRate}%`}
          subtitle={`${stats.active} active clients`}
          icon={UserCheck}
          trendLabel={retentionDelta != null ? `${retentionDelta > 0 ? '+' : ''}${retentionDelta}% vs last month` : 'No data yet'}
          trendPositive={retentionDelta != null ? retentionDelta >= 0 : null}
        />
        <AnalyticsStatCard
          dark
          title="Avg Adherence"
          value={`${stats.avgAdherence}%`}
          subtitle="Training + nutrition avg"
          icon={Activity}
          trendLabel={adherenceDelta != null ? `${adherenceDelta > 0 ? '+' : ''}${adherenceDelta}% vs last month` : 'No data yet'}
          trendPositive={adherenceDelta != null ? adherenceDelta >= 0 : null}
        />
        <AnalyticsStatCard
          dark
          title="Avg Weight Change"
          value={stats.avgWeightDelta != null ? `${stats.avgWeightDelta > 0 ? '+' : ''}${stats.avgWeightDelta} lbs` : '—'}
          subtitle="Across all clients"
          icon={Weight}
          trendLabel={stats.avgWeightDelta != null ? (stats.avgWeightDelta < 0 ? 'On track' : stats.avgWeightDelta === 0 ? 'Stable' : 'Gaining') : 'Not enough data'}
          trendPositive={stats.avgWeightDelta != null ? stats.avgWeightDelta <= 0 : null}
        />
        <AnalyticsStatCard
          dark
          title="Churn Risk"
          value={`${stats.churnRate}%`}
          subtitle={`${stats.atRisk} at-risk client${stats.atRisk !== 1 ? 's' : ''}`}
          icon={TrendingDown}
          trendLabel={stats.atRisk > 0 ? 'Needs attention' : 'All good'}
          trendPositive={stats.atRisk === 0}
        />
      </div>

      {/* Trend Charts — top row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 fade-up fade-up-delay-1">
        <AnalyticsTrendCard
          title="Client Retention Rate"
          subtitle="% of enrolled clients staying active"
          data={retentionTrend}
          unit="%"
          color="hsl(162,72%,42%)"
          referenceValue={80}
          badge={`${stats.retentionRate}%`}
          badgeColor="bg-accent/10 text-accent"
        />
        <AnalyticsTrendCard
          title="Avg Adherence Score"
          subtitle="Training + nutrition compliance"
          data={adherenceTrend}
          unit="%"
          color="hsl(228,90%,58%)"
          referenceValue={70}
          badge={`${stats.avgAdherence}%`}
          badgeColor="bg-primary/10 text-primary"
        />
      </div>

      {/* Trend Charts — bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 fade-up fade-up-delay-2">
        <AnalyticsTrendCard
          title="Avg Weight Progress"
          subtitle="Mean lbs change from each client's baseline"
          data={weightTrend}
          unit=" lbs"
          color="hsl(38,92%,54%)"
          referenceValue={0}
          formatter={v => `${v > 0 ? '+' : ''}${v} lbs`}
          badge={stats.avgWeightDelta != null ? `${stats.avgWeightDelta > 0 ? '+' : ''}${stats.avgWeightDelta} lbs` : '—'}
          badgeColor="bg-chart-4/10 text-chart-4"
        />
        <AnalyticsTrendCard
          title="Churn Rate"
          subtitle="% of clients flagged at-risk each month"
          data={churnTrend}
          unit="%"
          color="hsl(0,82%,58%)"
          referenceValue={10}
          badge={`${stats.churnRate}%`}
          badgeColor={stats.churnRate > 10 ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'}
        />
      </div>

      {/* Client breakdown table */}
      {clients.length > 0 && (
        <div className="mt-8 bg-white border border-[#E7EAF3] rounded-2xl overflow-hidden shadow-sm fade-up fade-up-delay-3">
          <div className="px-5 py-4 border-b border-[#E7EAF3]">
            <p className="text-sm font-semibold text-[#1F2A44]">Client Breakdown</p>
            <p className="text-xs text-[#374151] mt-0.5">Lifecycle status distribution</p>
          </div>
          <div className="p-5">
            {['active', 'at_risk', 'lead', 'completed', 'alumni'].map(status => {
              const count = clients.filter(c => c.lifecycle_status === status).length;
              const pct = clients.length ? Math.round((count / clients.length) * 100) : 0;
              const colors = {
                active: 'bg-emerald-400',
                at_risk: 'bg-red-400',
                lead: 'bg-primary',
                completed: 'bg-violet-400',
                alumni: 'bg-[#6B7280]',
              };
              const labels = {
                active: 'Active', at_risk: 'At Risk', lead: 'Lead', completed: 'Completed', alumni: 'Alumni'
              };
              if (count === 0) return null;
              return (
                <div key={status} className="flex items-center gap-3 mb-3 last:mb-0">
                  <span className="text-xs text-[#374151] w-20 shrink-0">{labels[status]}</span>
                  <div className="flex-1 bg-[#E7EAF3] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[status]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#1F2A44] w-14 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}