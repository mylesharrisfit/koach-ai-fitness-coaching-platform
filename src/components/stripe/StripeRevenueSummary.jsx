import React from 'react';
import { DollarSign, TrendingUp, CreditCard, AlertTriangle } from 'lucide-react';

export default function StripeRevenueSummary({ data }) {
  const stats = [
    {
      label: 'Monthly Recurring Revenue',
      value: `$${(data?.mrr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Revenue Collected',
      value: `$${(data?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-[#EEF4FF]',
    },
    {
      label: 'Active Subscriptions',
      value: data?.active_subscriptions || 0,
      icon: CreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Failed / At-Risk',
      value: (data?.past_due || 0) + (data?.failed_charges || 0),
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className="bg-[#111827] rounded-xl p-5 flex items-center gap-4 transition-all">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <s.icon className="w-5 h-5 text-white/30" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-heading font-bold leading-none text-white">{s.value}</p>
            <p className="text-[11px] mt-1 leading-tight text-white/50 font-semibold uppercase tracking-wide">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}