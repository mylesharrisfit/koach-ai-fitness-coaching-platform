import React from 'react';
import { DollarSign, TrendingUp, CreditCard, AlertTriangle } from 'lucide-react';

export default function StripeRevenueSummary({ data }) {
  const stats = [
    {
      label: 'Monthly Recurring Revenue',
      value: `$${(data?.mrr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: 'Total Revenue Collected',
      value: `$${(data?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Active Subscriptions',
      value: data?.active_subscriptions || 0,
      icon: CreditCard,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Failed / At-Risk',
      value: (data?.past_due || 0) + (data?.failed_charges || 0),
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 card-hover">
          <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
            <s.icon className={`w-5 h-5 ${s.color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-heading font-bold leading-none">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}