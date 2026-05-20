import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInDays, differenceInMonths, subMonths, format, startOfMonth, parseISO } from 'date-fns';
import MRROverview from '@/components/business/MRROverview';
import AcquisitionTrends from '@/components/business/AcquisitionTrends';
import ChurnRiskTable from '@/components/business/ChurnRiskTable';
import BusinessMetricCard from '@/components/business/BusinessMetricCard';
import { DollarSign, Users, TrendingUp, TrendingDown, UserCheck, AlertTriangle } from 'lucide-react';
import PageGuard from '@/components/subscription/PageGuard';

function BusinessPage() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['check-ins'],
    queryFn: () => base44.entities.CheckIn.list('-date', 200),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 200),
  });

  // ── MRR from active clients with monthly_rate ──
  const activeClients = useMemo(() => clients.filter(c => c.status === 'active' || c.lifecycle_status === 'active'), [clients]);
  const mrr = useMemo(() => activeClients.reduce((sum, c) => sum + (c.monthly_rate || 0), 0), [activeClients]);

  // ── Month-over-month client acquisition ──
  const acquisitionData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { month: format(d, 'MMM'), start: startOfMonth(d) };
    });
    return months.map(({ month, start }) => {
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      const count = clients.filter(c => {
        const sd = c.start_date ? parseISO(c.start_date) : c.created_date ? new Date(c.created_date) : null;
        return sd && sd >= start && sd <= end;
      }).length;
      return { month, count };
    });
  }, [clients]);

  // ── Churn risk: active clients with no check-in in 14+ days or at_risk lifecycle ──
  const churnRiskClients = useMemo(() => {
    return activeClients
      .map(client => {
        const clientCheckIns = checkIns.filter(ci => ci.client_id === client.id);
        const lastCheckIn = clientCheckIns.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        const daysSinceCheckIn = lastCheckIn ? differenceInDays(new Date(), new Date(lastCheckIn.date)) : null;
        const isAtRisk = client.lifecycle_status === 'at_risk';
        const noRecentCheckIn = daysSinceCheckIn === null || daysSinceCheckIn > 14;
        const riskScore = isAtRisk ? 100 : noRecentCheckIn ? Math.min(50 + (daysSinceCheckIn || 30), 90) : 20;
        return { ...client, daysSinceCheckIn, lastCheckIn, riskScore, isAtRisk };
      })
      .filter(c => c.riskScore >= 50)
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [activeClients, checkIns]);

  // ── MRR at risk from churn clients ──
  const mrrAtRisk = useMemo(() => churnRiskClients.reduce((sum, c) => sum + (c.monthly_rate || 0), 0), [churnRiskClients]);

  // ── New clients this month ──
  const thisMonthStart = startOfMonth(new Date());
  const newClientsThisMonth = clients.filter(c => {
    const sd = c.start_date ? parseISO(c.start_date) : c.created_date ? new Date(c.created_date) : null;
    return sd && sd >= thisMonthStart;
  }).length;

  // ── Client lifetime value (avg months active * monthly rate) ──
  const avgLTV = useMemo(() => {
    const withRate = activeClients.filter(c => c.monthly_rate > 0);
    if (!withRate.length) return 0;
    const avg = withRate.reduce((sum, c) => {
      const months = c.start_date ? Math.max(1, differenceInMonths(new Date(), parseISO(c.start_date))) : 1;
      return sum + (c.monthly_rate * months);
    }, 0) / withRate.length;
    return Math.round(avg);
  }, [activeClients]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#111827] rounded-xl p-5 text-white mb-6">
        <h1 className="text-xl font-semibold text-white">Business Overview</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>MRR, client acquisition, and churn risk analytics</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 fade-up">
        <BusinessMetricCard
          icon={DollarSign}
          label="Monthly Recurring Revenue"
          value={`$${mrr.toLocaleString()}`}
          sub={`$${mrrAtRisk.toLocaleString()} at risk`}
          dark
        />
        <BusinessMetricCard
          icon={Users}
          label="Active Clients"
          value={activeClients.length}
          sub={`${newClientsThisMonth} new this month`}
          dark
        />
        <BusinessMetricCard
          icon={AlertTriangle}
          label="Churn Risk"
          value={churnRiskClients.length}
          sub={churnRiskClients.length > 0 ? 'clients need attention' : 'All clients engaged'}
          dark
        />
        <BusinessMetricCard
          icon={TrendingUp}
          label="Avg. Client LTV"
          value={avgLTV > 0 ? `$${avgLTV.toLocaleString()}` : '—'}
          sub="lifetime value estimate"
          dark
        />
      </div>

      {/* MRR + Acquisition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 fade-up fade-up-delay-1">
        <MRROverview clients={clients} payments={payments} />
        <AcquisitionTrends data={acquisitionData} totalActive={activeClients.length} />
      </div>

      {/* Churn Risk Table */}
      <div className="fade-up fade-up-delay-2">
        <ChurnRiskTable clients={churnRiskClients} mrr={mrr} />
      </div>
    </div>
  );
}

export default function Business() {
  return (
    <PageGuard feature="revenue_dashboard">
      <BusinessPage />
    </PageGuard>
  );
}