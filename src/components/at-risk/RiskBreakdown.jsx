import React from 'react';
import { cn } from '@/lib/utils';

const COLUMNS = [
  { key: 'critical', label: 'Critical Risk', emoji: '🔴', desc: '3+ risk factors · Immediate attention', bg: 'bg-destructive/10', border: 'border-destructive', badge: 'bg-destructive/10 text-destructive', minFlags: 3 },
  { key: 'moderate', label: 'Moderate Risk', emoji: '🟡', desc: '2 risk factors · Attention this week', bg: 'bg-warning/10', border: 'border-warning', badge: 'bg-warning/10 text-warning', minFlags: 2 },
  { key: 'watch',    label: 'Watch List',   emoji: '🔵', desc: '1 risk factor · Keep an eye on',   bg: 'bg-accent',  border: 'border-primary',  badge: 'bg-accent text-primary',  minFlags: 1 },
];

function getRiskLevel(flagCount) {
  if (flagCount >= 3) return 'critical';
  if (flagCount >= 2) return 'moderate';
  return 'watch';
}

export default function RiskBreakdown({ atRisk, activeColumn, onColumnClick }) {
  const grouped = { critical: [], moderate: [], watch: [] };
  for (const entry of atRisk) {
    const level = getRiskLevel(entry.flags.length);
    grouped[level].push(entry);
  }

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {COLUMNS.map(col => {
        const entries = grouped[col.key];
        const isActive = activeColumn === col.key;
        return (
          <button key={col.key} onClick={() => onColumnClick(col.key)}
            className={cn('text-left p-3 rounded-xl border-2 transition-all hover:shadow-sm',
              col.bg, isActive ? col.border + ' ring-2 ring-offset-1' : 'border-transparent hover:' + col.border)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base">{col.emoji}</span>
              <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-full', col.badge)}>{entries.length}</span>
            </div>
            <p className="text-xs font-bold text-foreground mb-0.5">{col.label}</p>
            <p className="text-[10px] text-muted-foreground leading-tight mb-2">{col.desc}</p>
            {/* Stacked avatars */}
            {entries.length > 0 && (
              <div className="flex -space-x-1.5">
                {entries.slice(0, 5).map((e, i) => (
                  <div key={e.client.id}
                    className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgb(var(--destructive)), rgb(var(--ai)))', zIndex: 5 - i }}>
                    {e.client.name?.[0]?.toUpperCase()}
                  </div>
                ))}
                {entries.length > 5 && (
                  <div className="w-5 h-5 rounded-full border-2 border-white bg-border flex items-center justify-center text-[7px] font-bold text-muted-foreground">
                    +{entries.length - 5}
                  </div>
                )}
              </div>
            )}
            {entries.length === 0 && <p className="text-[10px] text-muted-foreground italic">None</p>}
          </button>
        );
      })}
    </div>
  );
}

export { getRiskLevel };