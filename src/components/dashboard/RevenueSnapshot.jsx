import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, AlertTriangle } from 'lucide-react';

export default function RevenueSnapshot({ clients }) {
  const activeClients = clients.filter(c => c.status === 'active');
  const mrr = activeClients.reduce((sum, c) => sum + (c.monthly_rate || 0), 0);
  const churnRisk = clients.filter(c => c.status === 'active' && !c.monthly_rate).length;
  const prospects = clients.filter(c => c.status === 'prospect').length;

  const stats = [
    { label: 'MRR', value: `$${mrr.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10', trend: '+8%' },
    { label: 'Active Clients', value: activeClients.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Churn Risk', value: churnRisk, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Pipeline', value: prospects, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Revenue Snapshot</h2>
      <div className="grid grid-cols-2 gap-4">
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold font-heading leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        <p className="text-xs text-muted-foreground">MRR up <span className="text-emerald-400 font-medium">+8%</span> vs last month</p>
      </div>
    </div>
  );
}