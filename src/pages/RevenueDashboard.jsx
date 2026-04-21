import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Users, AlertTriangle, XCircle, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import StripeRevenueSummary from '@/components/stripe/StripeRevenueSummary';
import StripeRevenueChart from '@/components/stripe/StripeRevenueChart';
import StripeSubscriptionTable from '@/components/stripe/StripeSubscriptionTable';
import CreateSubscriptionDialog from '@/components/stripe/CreateSubscriptionDialog';

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
      <PageHeader
        title="Revenue Dashboard"
        subtitle="Stripe subscriptions, MRR, and payment health"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Subscription
            </Button>
          </div>
        }
      />

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
                  { label: 'Active Subscriptions', value: dashData?.active_subscriptions || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Past Due', value: dashData?.past_due || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Canceled', value: dashData?.canceled || 0, color: 'text-[#374151]', bg: 'bg-[#F6F7FB]' },
                  { label: 'Failed Charges', value: dashData?.failed_charges || 0, color: 'text-red-500', bg: 'bg-red-50' },
                ].map(item => (
                  <div key={item.label} className={`flex items-center justify-between p-3 rounded-xl border border-[#E7EAF3] ${item.bg}`}>
                    <span className="text-sm text-[#374151]">{item.label}</span>
                    <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <StripeSubscriptionTable subscriptions={dashData?.subscriptions || []} clients={clients} onRefresh={refetch} />
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