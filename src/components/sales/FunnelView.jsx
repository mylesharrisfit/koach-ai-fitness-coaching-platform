import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, UserPlus, PhoneCall, CheckCircle2, Users } from 'lucide-react';

const STAGES = [
  { key: 'lead', label: 'Lead', icon: UserPlus, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
  { key: 'booked', label: 'Booked', icon: PhoneCall, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  { key: 'closed', label: 'Closed', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
  { key: 'active_client', label: 'Active Client', icon: Users, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
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
                  "flex-1 rounded-xl border-2 p-4 transition-all text-left",
                  stage.bg, stage.border,
                  isSelected ? "ring-2 ring-offset-2 ring-offset-card scale-105 shadow-lg" : "hover:scale-102 opacity-90 hover:opacity-100"
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <stage.icon className={cn("w-4 h-4", stage.color)} />
                  <span className={cn("text-xs font-semibold uppercase tracking-wide", stage.color)}>{stage.label}</span>
                </div>
                <p className={cn("text-3xl font-heading font-bold", stage.color)}>{count}</p>
                <p className="text-xs text-muted-foreground mt-1">{pct}% of total</p>
                <div className="mt-3 h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", stage.color.replace('text-', 'bg-'))} style={{ width: `${pct}%` }} />
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