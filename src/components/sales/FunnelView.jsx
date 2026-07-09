import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, UserPlus, PhoneCall, CheckCircle2, Users } from 'lucide-react';

const STAGES = [
  { key: 'lead', label: 'Lead', icon: UserPlus },
  { key: 'booked', label: 'Booked', icon: PhoneCall },
  { key: 'closed', label: 'Closed', icon: CheckCircle2 },
  { key: 'active_client', label: 'Active Client', icon: Users },
];

export default function FunnelView({ leads, onStageClick, selectedStage }) {
  const counts = STAGES.reduce((acc, s) => {
    acc[s.key] = leads.filter(l => l.stage === s.key).length;
    return acc;
  }, {});
  const total = leads.length || 1;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">Sales Funnel</h2>
      <div className="flex items-stretch gap-1">
        {STAGES.map((stage, idx) => {
          const count = counts[stage.key];
          const pct = Math.round((count / total) * 100);
          const isSelected = selectedStage === stage.key;
          return (
            <React.Fragment key={stage.key}>
              <button
                onClick={() => onStageClick(isSelected ? null : stage.key)}
                className={cn(
                  "flex-1 rounded-xl border p-4 transition-all text-left bg-card border-border",
                  isSelected ? "ring-2 ring-foreground/20 scale-105 shadow-lg" : "hover:opacity-90"
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <stage.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage.label}</span>
                </div>
                <p className="text-3xl font-heading font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">{pct}% of total</p>
                <div className="mt-3 h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-sidebar transition-all" style={{ width: `${pct}%` }} />
                </div>
              </button>
              {idx < STAGES.length - 1 && (
                <div className="flex items-center px-1">
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}