import React from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function RiskBadge({ score }) {
  if (score >= 80) return <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-xs">High Risk</Badge>;
  if (score >= 60) return <Badge className="bg-amber-400/15 text-amber-400 border-amber-400/20 text-xs">Medium Risk</Badge>;
  return <Badge className="bg-yellow-400/15 text-yellow-400 border-yellow-400/20 text-xs">Low Risk</Badge>;
}

function RiskBar({ score }) {
  const color = score >= 80 ? 'bg-destructive' : score >= 60 ? 'bg-amber-400' : 'bg-yellow-400';
  return (
    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
    </div>
  );
}

export default function ChurnRiskTable({ clients, mrr }) {
  const mrrAtRisk = clients.reduce((s, c) => s + (c.monthly_rate || 0), 0);
  const pctAtRisk = mrr > 0 ? ((mrrAtRisk / mrr) * 100).toFixed(1) : 0;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Churn Risk Analysis</h3>
          <p className="text-sm text-foreground">
            {clients.length > 0
              ? <><span className="font-semibold text-amber-400">{clients.length} clients</span> flagged — <span className="font-semibold text-destructive">${mrrAtRisk.toLocaleString()}</span> MRR at risk ({pctAtRisk}%)</>
              : <span className="text-emerald-400 font-semibold">All clients are engaged ✓</span>
            }
          </p>
        </div>
        {clients.length === 0 && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No clients show churn signals. Keep up the great coaching work!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground py-2 pr-4">Client</th>
                <th className="text-left text-xs font-semibold text-muted-foreground py-2 pr-4">Last Check-in</th>
                <th className="text-left text-xs font-semibold text-muted-foreground py-2 pr-4">MRR</th>
                <th className="text-left text-xs font-semibold text-muted-foreground py-2 pr-4">Risk</th>
                <th className="text-left text-xs font-semibold text-muted-foreground py-2">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {client.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-foreground leading-tight">{client.name}</p>
                        {client.isAtRisk && <p className="text-[10px] text-destructive">Flagged at-risk</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {client.daysSinceCheckIn !== null
                        ? <span className={cn(client.daysSinceCheckIn > 21 ? 'text-destructive font-medium' : 'text-amber-400')}>
                            {client.daysSinceCheckIn}d ago
                          </span>
                        : <span className="text-destructive">Never</span>
                      }
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-semibold text-foreground">
                    {client.monthly_rate ? `$${client.monthly_rate}/mo` : <span className="text-muted-foreground">—</span>}
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