import React from 'react';
import { cn } from '@/lib/utils';
import TrendChart from './TrendChart';

export default function AnalyticsTrendCard({ title, subtitle, data, unit, color, referenceValue, formatter, badge, badgeColor, className }) {
  const last = data?.[data.length - 1]?.value;
  const prev = data?.[data.length - 2]?.value;
  const delta = last != null && prev != null ? last - prev : null;

  return (
    <div className={cn('glass-card rounded-2xl p-5 relative overflow-hidden', className)}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground/70">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', badgeColor || 'bg-primary/10 text-primary')}>
              {badge}
            </span>
          )}
          {delta != null && (
            <span className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              delta > 0 ? 'bg-accent/10 text-accent' : delta < 0 ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'
            )}>
              {delta > 0 ? '+' : ''}{typeof formatter === 'function' ? formatter(delta) : `${Math.round(delta * 10) / 10}${unit || ''}`}
            </span>
          )}
        </div>
      </div>
      {last != null && (
        <p className="stat-number text-2xl font-heading font-bold mt-2 mb-3">
          {typeof formatter === 'function' ? formatter(last) : `${last}${unit || ''}`}
        </p>
      )}
      <TrendChart data={data} unit={unit} color={color} referenceValue={referenceValue} formatter={formatter} />
    </div>
  );
}