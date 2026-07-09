import React from 'react';
import { cn } from '@/lib/utils';
import TrendChart from './TrendChart';

export default function AnalyticsTrendCard({ title, subtitle, data, unit, color, referenceValue, formatter, badge, badgeColor, className }) {
  const last = data?.[data.length - 1]?.value;
  const prev = data?.[data.length - 2]?.value;
  const delta = last != null && prev != null ? last - prev : null;

  return (
    <div className={cn('bg-card border border-border rounded-2xl p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-foreground">{title}</p>
          {subtitle && <p className="text-xs text-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', badgeColor || 'bg-accent/10 text-primary')}>
              {badge}
            </span>
          )}
          {delta != null && Math.abs(delta) >= 1 && (
            <span className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              delta > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}>
              {delta > 0 ? '+' : ''}{typeof formatter === 'function' ? formatter(delta) : `${Math.round(delta * 10) / 10}${unit || ''}`}
            </span>
          )}
        </div>
      </div>
      {last != null && (
        <p className="stat-number text-2xl font-heading font-bold mt-2 mb-3 text-foreground">
          {typeof formatter === 'function' ? formatter(last) : `${last}${unit || ''}`}
        </p>
      )}
      <TrendChart data={data} unit={unit} color={color} referenceValue={referenceValue} formatter={formatter} />
    </div>
  );
}