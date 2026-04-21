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
        <div key={s.label} className="bg-white border border-[#E7EAF3] rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
          <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
            <s.icon className={`w-5 h-5 ${s.color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-heading font-bold leading-none text-[#1F2A44]">{s.value}</p>
            <p className="text-[11px] text-[#374151] mt-1 leading-tight">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}