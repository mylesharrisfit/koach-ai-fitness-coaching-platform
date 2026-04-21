import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { XCircle, CheckCircle2, Clock, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  active:   { label: 'Active',    cls: 'bg-emerald-50 text-emerald-600 border border-emerald-100', icon: CheckCircle2 },
  past_due: { label: 'Past Due',  cls: 'bg-amber-50 text-amber-600 border border-amber-100',       icon: Clock },
  canceled: { label: 'Canceled',  cls: 'bg-[#F6F7FB] text-[#374151] border border-[#E7EAF3]',     icon: Ban },
  trialing: { label: 'Trialing',  cls: 'bg-blue-50 text-blue-600 border border-blue-100',          icon: Clock },
  unpaid:   { label: 'Unpaid',    cls: 'bg-red-50 text-red-500 border border-red-100',             icon: XCircle },
};

export default function StripeSubscriptionTable({ subscriptions, clients, onRefresh }) {
  const [canceling, setCanceling] = useState(null);

  const handleCancel = async (sub) => {
    if (!confirm(`Cancel subscription ${sub.id}? This cannot be undone.`)) return;
    setCanceling(sub.id);
    await base44.functions.invoke('stripeCancelSubscription', { subscription_id: sub.id });
    toast.success('Subscription canceled');
    onRefresh();
    setCanceling(null);
  };

  const getClientName = (sub) => {
    if (sub.metadata?.client_id) {
      const c = clients.find(c => c.id === sub.metadata.client_id);
      if (c) return c.name;
    }
    return sub.customer_email || sub.id;
  };

  return (
    <div className="bg-white border border-[#E7EAF3] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-[#E7EAF3]">
        <h3 className="text-xs font-bold text-[#374151] uppercase tracking-widest">Stripe Subscriptions</h3>
      </div>
      {subscriptions.length === 0 ? (
        <p className="text-sm text-[#374151] text-center py-10">No subscriptions found. Create your first one above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E7EAF3] text-left bg-[#F6F7FB]">
                <th className="px-6 py-3 text-xs text-[#374151] font-semibold">Client</th>
                <th className="px-6 py-3 text-xs text-[#374151] font-semibold">Amount</th>
                <th className="px-6 py-3 text-xs text-[#374151] font-semibold">Status</th>
                <th className="px-6 py-3 text-xs text-[#374151] font-semibold">Next Payment</th>
                <th className="px-6 py-3 text-xs text-[#374151] font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(sub => {
                const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.unpaid;
                const Icon = cfg.icon;
                const nextDate = sub.current_period_end
                  ? new Date(sub.current_period_end * 1000).toLocaleDateString()
                  : '—';
                return (
                  <tr key={sub.id} className="border-b border-[#E7EAF3] hover:bg-[#F6F7FB] transition-colors">
                    <td className="px-6 py-3.5 font-medium">{getClientName(sub)}</td>
                    <td className="px-6 py-3.5">${(sub.amount || 0).toLocaleString()}/{sub.interval || 'mo'}</td>
                    <td className="px-6 py-3.5">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.cls)}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-[#374151]">{nextDate}</td>
                    <td className="px-6 py-3.5">
                      {sub.status === 'active' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs"
                          disabled={canceling === sub.id}
                          onClick={() => handleCancel(sub)}
                        >
                          {canceling === sub.id ? 'Canceling...' : 'Cancel'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}