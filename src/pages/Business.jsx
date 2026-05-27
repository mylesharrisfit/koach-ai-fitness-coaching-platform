import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageGuard from '@/components/subscription/PageGuard';
import BIKPIRow from '@/components/business/bi/BIKPIRow';
import BIRevenueChart from '@/components/business/bi/BIRevenueChart';
import BIClientGrowthChart from '@/components/business/bi/BIClientGrowthChart';
import BIRevenueBreakdown from '@/components/business/bi/BIRevenueBreakdown';
import BILeadPipeline from '@/components/business/bi/BILeadPipeline';
import BIForecast from '@/components/business/bi/BIForecast';
import BIHealthScore from '@/components/business/bi/BIHealthScore';
import BIAIInsights from '@/components/business/bi/BIAIInsights';
import BICapacity from '@/components/business/bi/BICapacity';
import BIGoals from '@/components/business/bi/BIGoals';
import BIBenchmarks from '@/components/business/bi/BIBenchmarks';
import { BarChart2, Rocket } from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'clients', label: 'Clients' },
  { key: 'growth', label: 'Growth' },
  { key: 'insights', label: '✨ AI Insights' },
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
        <Rocket className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Your business insights will appear here</h2>
      <p className="text-sm text-gray-400 max-w-xs">As you grow your client base, KOACH AI will surface revenue trends, retention analytics, and growth recommendations. Keep going! 🚀</p>
    </div>
  );
}

function BusinessPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-bi'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkins-bi'],
    queryFn: () => base44.entities.CheckIn.list('-date', 500),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments-bi'],
    queryFn: () => base44.entities.Payment.list('-created_date', 200),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-bi'],
    queryFn: () => base44.entities.Lead.list('-created_date', 200),
  });

  const isEmpty = clients.length === 0;

  const sharedProps = { clients, checkIns, payments, leads };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-5 py-4 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)' }}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-400" />
              Business Intelligence
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Revenue, growth &amp; client analytics
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 max-w-7xl mx-auto overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-white text-gray-900' : 'text-white/50 hover:text-white/80'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-5">
          {isEmpty && activeTab !== 'insights' ? (
            <EmptyState />
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              {activeTab === 'overview' && (
                <>
                  <BIKPIRow {...sharedProps} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <BIRevenueChart {...sharedProps} />
                    <BIHealthScore {...sharedProps} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <BIGoals {...sharedProps} />
                    <BICapacity clients={clients} user={user} />
                    <BIBenchmarks {...sharedProps} />
                  </div>
                </>
              )}

              {/* ── REVENUE ── */}
              {activeTab === 'revenue' && (
                <>
                  <BIKPIRow {...sharedProps} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <BIRevenueChart {...sharedProps} />
                    <BIRevenueBreakdown {...sharedProps} />
                  </div>
                  <BIForecast clients={clients} leads={leads} />
                </>
              )}

              {/* ── CLIENTS ── */}
              {activeTab === 'clients' && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <BIClientGrowthChart clients={clients} />
                    <BIBenchmarks {...sharedProps} />
                  </div>
                  <BICapacity clients={clients} user={user} />
                </>
              )}

              {/* ── GROWTH ── */}
              {activeTab === 'growth' && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <BILeadPipeline leads={leads} />
                    <BIForecast clients={clients} leads={leads} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <BIGoals {...sharedProps} />
                    <BICapacity clients={clients} user={user} />
                  </div>
                </>
              )}

              {/* ── AI INSIGHTS ── */}
              {activeTab === 'insights' && (
                <BIAIInsights {...sharedProps} />
              )}
            </>
          )}
        </div>
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