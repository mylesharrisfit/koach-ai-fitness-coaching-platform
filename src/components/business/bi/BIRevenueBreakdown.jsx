import React, { useMemo } from 'react';
import { AlertTriangle, Crown } from 'lucide-react';

export default function BIRevenueBreakdown({ clients, payments }) {
  const activeClients = useMemo(() => clients.filter(c => c.lifecycle_status === 'active' || c.status === 'active'), [clients]);
  const mrr = useMemo(() => activeClients.reduce((s, c) => s + (c.monthly_rate || 0), 0), [activeClients]);

  const topClients = useMemo(() =>
    [...activeClients].filter(c => c.monthly_rate > 0)
      .sort((a, b) => (b.monthly_rate || 0) - (a.monthly_rate || 0))
      .slice(0, 5),
    [activeClients]);

  const top3Revenue = topClients.slice(0, 3).reduce((s, c) => s + (c.monthly_rate || 0), 0);
  const concentrationPct = mrr > 0 ? Math.round((top3Revenue / mrr) * 100) : 0;

  const avgRevenue = activeClients.length > 0 ? Math.round(mrr / activeClients.length) : 0;

  const failedPayments = payments.filter(p => p.status === 'failed').length;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-4">Revenue Breakdown</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-accent border border-accent">
          <p className="text-[10px] text-primary font-semibold uppercase mb-1">Total MRR</p>
          <p className="text-xl font-bold text-primary">${mrr.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-xl bg-ai/10 border border-ai">
          <p className="text-[10px] text-ai font-semibold uppercase mb-1">Avg / Client</p>
          <p className="text-xl font-bold text-ai">${avgRevenue.toLocaleString()}</p>
        </div>
      </div>

      {concentrationPct > 40 && (
        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning rounded-xl mb-4 text-xs text-warning">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-warning" />
          <p>Top 3 clients = <strong>{concentrationPct}%</strong> of revenue — consider diversifying your client base</p>
        </div>
      )}

      {failedPayments > 0 && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive rounded-xl mb-4 text-xs text-destructive">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p><strong>{failedPayments}</strong> failed payment{failedPayments !== 1 ? 's' : ''} need attention</p>
        </div>
      )}

      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Top Revenue Clients</p>
        {topClients.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No billing data yet — add monthly rates to clients</p>
        ) : (
          <div className="space-y-2">
            {topClients.map((c, i) => {
              const pct = mrr > 0 ? Math.round(((c.monthly_rate || 0) / mrr) * 100) : 0;
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${i === 0 ? 'bg-warning' : 'bg-border'}`}>
                    {i === 0 ? <Crown className="w-3 h-3" /> : i + 1}
                  </div>
                  <p className="text-xs text-foreground flex-1 truncate">{c.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs font-bold text-foreground w-10 text-right">${(c.monthly_rate || 0).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}