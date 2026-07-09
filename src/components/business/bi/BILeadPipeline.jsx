import React, { useMemo } from 'react';
import { Clock, Zap } from 'lucide-react';
import { differenceInDays } from 'date-fns';

const SOURCE_COLORS = {
  instagram: '#E1306C',
  referral: 'rgb(var(--success))',
  website: 'rgb(var(--primary))',
  tiktok: '#000000',
  youtube: 'rgb(var(--destructive))',
  other: 'rgb(var(--muted-foreground))',
};

export default function BILeadPipeline({ leads }) {
  const pipelineLeads = useMemo(() => leads.filter(l => l.stage === 'lead' || l.stage === 'booked'), [leads]);
  const convertedLeads = useMemo(() => leads.filter(l => l.stage === 'active_client'), [leads]);
  const conversionRate = leads.length > 0 ? Math.round((convertedLeads.length / leads.length) * 100) : 0;

  const totalPipelineValue = useMemo(() =>
    pipelineLeads.reduce((s, l) => s + (l.deal_value || 0), 0),
    [pipelineLeads]);

  const stalePipelineLeads = useMemo(() =>
    pipelineLeads.filter(l => {
      const created = l.created_date ? new Date(l.created_date) : null;
      return created && differenceInDays(new Date(), created) >= 14;
    }),
    [pipelineLeads]);

  const avgConversionDays = useMemo(() => {
    const withDates = convertedLeads.filter(l => l.created_date);
    if (!withDates.length) return null;
    const avg = withDates.reduce((s, l) => s + differenceInDays(new Date(), new Date(l.created_date)), 0) / withDates.length;
    return Math.round(avg);
  }, [convertedLeads]);

  const sourceBreakdown = useMemo(() => {
    const map = {};
    leads.forEach(l => {
      const src = l.source || 'other';
      if (!map[src]) map[src] = 0;
      map[src]++;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-4">Lead Pipeline</h3>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-accent rounded-xl">
          <p className="text-lg font-bold text-primary">{pipelineLeads.length}</p>
          <p className="text-[10px] text-primary font-medium">Active Leads</p>
        </div>
        <div className="text-center p-3 bg-success/10 rounded-xl">
          <p className="text-lg font-bold text-success">{conversionRate}%</p>
          <p className="text-[10px] text-success font-medium">Conversion</p>
        </div>
        <div className="text-center p-3 bg-warning/10 rounded-xl">
          <p className="text-lg font-bold text-warning">${totalPipelineValue.toLocaleString()}</p>
          <p className="text-[10px] text-warning font-medium">Pipeline Value</p>
        </div>
      </div>

      {stalePipelineLeads.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning rounded-xl mb-4 text-xs text-warning">
          <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-warning" />
          <p><strong>{stalePipelineLeads.length} lead{stalePipelineLeads.length !== 1 ? 's' : ''}</strong> in pipeline 14+ days — following up today could add ${stalePipelineLeads.reduce((s, l) => s + (l.deal_value || 0), 0).toLocaleString()}/mo in revenue</p>
        </div>
      )}

      {avgConversionDays && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 p-2.5 bg-muted rounded-xl">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span>Average lead → client: <strong>{avgConversionDays} days</strong></span>
        </div>
      )}

      {sourceBreakdown.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Lead Sources</p>
          <div className="space-y-1.5">
            {sourceBreakdown.slice(0, 5).map(([src, count]) => {
              const pct = Math.round((count / leads.length) * 100);
              return (
                <div key={src} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SOURCE_COLORS[src] || 'rgb(var(--muted-foreground))' }} />
                  <p className="text-xs text-muted-foreground capitalize flex-1">{src}</p>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: SOURCE_COLORS[src] || 'rgb(var(--muted-foreground))' }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-5 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {leads.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4 italic">No leads tracked yet. Add leads in the Sales tab.</p>
      )}
    </div>
  );
}