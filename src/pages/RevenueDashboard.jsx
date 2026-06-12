import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Users, AlertTriangle, XCircle, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StripeRevenueSummary from '@/components/stripe/StripeRevenueSummary';
import StripeRevenueChart from '@/components/stripe/StripeRevenueChart';
import StripeSubscriptionTable from '@/components/stripe/StripeSubscriptionTable';
import CreateSubscriptionDialog from '@/components/stripe/CreateSubscriptionDialog';
import PaymentLinksPanel from '@/components/stripe/PaymentLinksPanel';
import SubscriptionPlansPanel from '@/components/stripe/SubscriptionPlansPanel';

export default function RevenueDashboard() {
  const [showCreate, setShowCreate] = useState(false);

  const { data: dashData, isLoading, refetch } = useQuery({
    queryKey: ['stripe-dashboard'],
    queryFn: async () => {
      const res = await base44.functions.invoke('stripeGetDashboard', {});
      return res.data;
    },
    refetchInterval: 60000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="bg-[#111827] rounded-xl p-5 text-white mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Revenue Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Stripe subscriptions, MRR, and payment health</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold"
            style={{ background: '#fff', color: '#111827' }}
          >
            <Plus className="w-3.5 h-3.5" /> New Subscription
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <StripeRevenueSummary data={dashData} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <StripeRevenueChart data={dashData?.monthly_revenue || []} />
            </div>
            <div className="bg-white border border-[#E7EAF3] rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-[#374151] uppercase tracking-widest mb-4">Payment Health</h3>
              <div className="space-y-3">
                {[
                  { label: 'Active Subscriptions', value: dashData?.active_subscriptions || 0 },
                  { label: 'Past Due', value: dashData?.past_due || 0 },
                  { label: 'Canceled', value: dashData?.canceled || 0 },
                  { label: 'Failed Charges', value: dashData?.failed_charges || 0 },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-[#E7EAF3] bg-[#F9FAFB]">
                    <span className="text-sm text-[#374151]">{item.label}</span>
                    <span className="text-sm font-bold text-[#111827]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <StripeSubscriptionTable subscriptions={dashData?.subscriptions || []} clients={clients} onRefresh={refetch} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaymentLinksPanel />
            <SubscriptionPlansPanel />
          </div>
        </div>
      )}

      <CreateSubscriptionDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        clients={clients}
        onSuccess={() => { setShowCreate(false); refetch(); }}
      />
    </div>
  );
}