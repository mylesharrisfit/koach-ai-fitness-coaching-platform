import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function AnalyticsStatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, trendPositive, className, dark }) {
  const hasTrend = trend != null;
  const isPositive = trendPositive === true;
  const isNeutral = trendPositive === null || trendPositive === undefined;

  if (dark) {
    return (
      <div className={cn('bg-sidebar rounded-xl p-5', className)}>
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold tracking-wider uppercase text-white/50">{title}</p>
          {Icon && <Icon className="w-4 h-4 text-white/30" />}
        </div>
        <p className="text-3xl font-heading font-bold mt-3 leading-none text-white">{value}</p>
        {subtitle && <p className="text-xs text-white/40 mt-1.5">{subtitle}</p>}
        {trendLabel && (
          <div className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-white/50">
            {isNeutral
              ? <Minus className="w-3 h-3 text-white/30" />
              : isPositive
                ? <TrendingUp className="w-3 h-3 text-success" />
                : <TrendingDown className="w-3 h-3 text-destructive" />}
            <span className={isNeutral ? 'text-white/40' : isPositive ? 'text-success' : 'text-destructive'}>
              {trendLabel}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('bg-card border border-border rounded-2xl p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wider uppercase text-foreground">{title}</p>
        {Icon && (
          <div className="p-2 rounded-lg bg-accent/10 text-primary">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <p className="stat-number text-3xl font-heading font-bold mt-3 leading-none text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-foreground mt-1.5">{subtitle}</p>}
      {hasTrend && (
        <div className={cn(
          'inline-flex items-center gap-1 mt-3 text-xs font-semibold px-2 py-0.5 rounded-full border',
          isNeutral ? 'bg-muted text-foreground border-border' :
          isPositive ? 'bg-success/10 text-success border-success' : 'bg-destructive/10 text-destructive border-destructive'
        )}>
          {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trendLabel}
        </div>
      )}
    </div>
  );
}