import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

function getRiskReasons(client, checkIns) {
  const reasons = [];
  const clientCheckIns = checkIns.filter(ci => ci.client_id === client.id);
  const latest = clientCheckIns[0];

  if (latest) {
    if (latest.compliance_training !== undefined && latest.compliance_training < 70) reasons.push('Low training compliance');
    if (latest.compliance_nutrition !== undefined && latest.compliance_nutrition < 70) reasons.push('Low nutrition compliance');
    if (latest.sleep_hours !== undefined && latest.sleep_hours < 6) reasons.push('Poor sleep');
  }

  // No check-in in 10+ days
  if (!latest) {
    reasons.push('No recent check-in');
  } else {
    const daysSince = Math.floor((Date.now() - new Date(latest.date)) / 86400000);
    if (daysSince > 9) reasons.push(`No check-in for ${daysSince}d`);
  }

  return reasons;
}

export default function AtRiskClients({ clients, checkIns }) {
  const atRisk = clients
    .filter(c => c.status === 'active')
    .map(c => ({ client: c, reasons: getRiskReasons(c, checkIns) }))
    .filter(({ reasons }) => reasons.length > 0)
    .slice(0, 4);

  return (
    <div className="bg-card border border-destructive/30 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-destructive">At-Risk Clients</h2>
        </div>
        <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-medium">{atRisk.length}</span>
      </div>

      {atRisk.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">All clients on track 🎉</p>
      ) : (
        <div className="space-y-3">
          {atRisk.map(({ client, reasons }) => (
            <div key={client.id} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center text-destructive text-xs font-bold flex-shrink-0">
                {client.name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{client.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {reasons.map(r => (
                    <span key={r} className="text-xs bg-destructive/15 text-destructive/80 px-1.5 py-0.5 rounded">{r}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link to="/progress" className="block mt-4">
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground text-xs">
          View All Progress <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
}