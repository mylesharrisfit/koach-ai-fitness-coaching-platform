import React from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function RiskBadge({ score }) {
  if (score >= 80) return <Badge className="bg-red-50 text-red-500 border-red-100 text-xs">High Risk</Badge>;
  if (score >= 60) return <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-xs">Medium Risk</Badge>;
  return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-100 text-xs">Low Risk</Badge>;
}

function RiskBar({ score }) {
  const color = score >= 80 ? 'bg-red-400' : score >= 60 ? 'bg-amber-400' : 'bg-yellow-400';
  return (
    <div className="w-16 h-1.5 bg-[#E7EAF3] rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
    </div>
  );
}

export default function ChurnRiskTable({ clients, mrr }) {
  const mrrAtRisk = clients.reduce((s, c) => s + (c.monthly_rate || 0), 0);
  const pctAtRisk = mrr > 0 ? ((mrrAtRisk / mrr) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white border border-[#E7EAF3] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-1">Churn Risk Analysis</h3>
          <p className="text-sm text-[#1F2A44]">
            {clients.length > 0
              ? <><span className="font-semibold text-[#111827]">{clients.length} clients</span> flagged — <span className="font-semibold text-[#111827]">${mrrAtRisk.toLocaleString()}</span> MRR at risk ({pctAtRisk}%)</>
              : <span className="text-emerald-600 font-semibold">All clients are engaged ✓</span>
            }
          </p>
        </div>
        {clients.length === 0 && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-10 text-[#6B7280] text-sm">
          No clients show churn signals. Keep up the great coaching work!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E7EAF3]">
                <th className="text-left text-xs font-semibold text-[#6B7280] py-2 pr-4">Client</th>
                <th className="text-left text-xs font-semibold text-[#6B7280] py-2 pr-4">Last Check-in</th>
                <th className="text-left text-xs font-semibold text-[#6B7280] py-2 pr-4">MRR</th>
                <th className="text-left text-xs font-semibold text-[#6B7280] py-2 pr-4">Risk</th>
                <th className="text-left text-xs font-semibold text-[#6B7280] py-2">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EAF3]">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-[#F6F7FB] transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#EEF4FF] flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {client.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-[#1F2A44] leading-tight">{client.name}</p>
                        {client.isAtRisk && <p className="text-[10px] text-red-500">Flagged at-risk</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5 text-[#6B7280]">
                      <Clock className="w-3 h-3" />
                      {client.daysSinceCheckIn !== null
                        ? <span className={cn(client.daysSinceCheckIn > 21 ? 'text-red-500 font-medium' : 'text-amber-600')}>
                            {client.daysSinceCheckIn}d ago
                          </span>
                        : <span className="text-red-500">Never</span>
                      }
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-semibold text-[#1F2A44]">
                    {client.monthly_rate ? `$${client.monthly_rate}/mo` : <span className="text-[#6B7280]">—</span>}
                  </td>
                  <td className="py-3 pr-4"><RiskBadge score={client.riskScore} /></td>
                  <td className="py-3"><RiskBar score={client.riskScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}