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
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <h2 className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-4">Revenue Snapshot</h2>

      {/* 2×2 on mobile, 4-col on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`rounded-xl p-3 flex flex-col gap-2 ${s.bg}`}>
            <s.icon className={`w-4 h-4 ${s.color}`} />
            <p className={`stat-number text-2xl font-bold font-heading leading-none ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground/80 uppercase tracking-wide leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2">
        <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
        <p className="text-[11px] text-muted-foreground">MRR up <span className="text-emerald-400 font-semibold">+8%</span> vs last month</p>
      </div>
    </div>
  );
}