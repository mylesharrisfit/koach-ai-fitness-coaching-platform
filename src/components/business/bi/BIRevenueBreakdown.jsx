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
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Revenue Breakdown</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-[10px] text-blue-400 font-semibold uppercase mb-1">Total MRR</p>
          <p className="text-xl font-bold text-blue-700">${mrr.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
          <p className="text-[10px] text-purple-400 font-semibold uppercase mb-1">Avg / Client</p>
          <p className="text-xl font-bold text-purple-700">${avgRevenue.toLocaleString()}</p>
        </div>
      </div>

      {concentrationPct > 40 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
          <p>Top 3 clients = <strong>{concentrationPct}%</strong> of revenue — consider diversifying your client base</p>
        </div>
      )}

      {failedPayments > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p><strong>{failedPayments}</strong> failed payment{failedPayments !== 1 ? 's' : ''} need attention</p>
        </div>
      )}

      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Top Revenue Clients</p>
        {topClients.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No billing data yet — add monthly rates to clients</p>
        ) : (
          <div className="space-y-2">
            {topClients.map((c, i) => {
              const pct = mrr > 0 ? Math.round(((c.monthly_rate || 0) / mrr) * 100) : 0;
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${i === 0 ? 'bg-amber-400' : 'bg-gray-300'}`}>
                    {i === 0 ? <Crown className="w-3 h-3" /> : i + 1}
                  </div>
                  <p className="text-xs text-gray-700 flex-1 truncate">{c.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs font-bold text-gray-900 w-10 text-right">${(c.monthly_rate || 0).toLocaleString()}</p>
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