import React, { useState } from 'react';
import { format } from 'date-fns';
import { TrendingUp, AlertTriangle, Zap, Trophy } from 'lucide-react';

const TYPE_ICONS = {
  performance: { icon: TrendingUp, color: 'rgb(var(--primary))' },
  risk: { icon: AlertTriangle, color: '#ea580c' },
  opportunity: { icon: Zap, color: 'rgb(var(--success))' },
  celebration: { icon: Trophy, color: 'rgb(var(--warning))' },
};

export default function InsightHistory({ clients }) {
  const [filter, setFilter] = useState('all');

  // Read dismissed insights from localStorage as a simple history proxy
  const history = (() => {
    try {
      const raw = JSON.parse(localStorage.getItem('koach_dismissed_insights') || '{}');
      return Object.entries(raw)
        .map(([id, ts]) => ({ id, ts, type: id.split('_')[0] === 'risk' ? 'risk' : id.split('_')[0] === 'celebrate' ? 'celebration' : id.split('_')[0] === 'opp' ? 'opportunity' : 'performance' }))
        .sort((a, b) => b.ts - a.ts);
    } catch { return []; }
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-foreground">Insight History</h2>
        <span className="text-xs text-muted-foreground">({history.length} dismissed insights)</span>
      </div>
      {history.length === 0 ? (
        <div className="rounded-2xl p-8 text-center bg-muted border border-border">
          <p className="text-sm text-muted-foreground">No dismissed insights yet. When you dismiss insights, they appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map(({ id, ts, type }) => {
            const cfg = TYPE_ICONS[type] || TYPE_ICONS.opportunity;
            const Icon = cfg.icon;
            return (
              <div key={id} className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${cfg.color}18` }}>
                  <Icon style={{ width: 14, height: 14, color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{id.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(ts), 'MMM d, h:mm a')}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-border text-muted-foreground">Dismissed</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}