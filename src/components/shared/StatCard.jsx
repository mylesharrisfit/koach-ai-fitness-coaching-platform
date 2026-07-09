import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, sub, trend, trendUp, icon: Icon, accent, className }) {
  return (
    <div className={cn(
      'relative rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md',
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        {Icon && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', accent || 'bg-primary/10')}>
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={cn('flex items-center gap-0.5 text-xs font-semibold', trendUp ? 'text-success' : 'text-destructive')}>
              {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend}
            </span>
          )}
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      )}
    </div>
  );
}