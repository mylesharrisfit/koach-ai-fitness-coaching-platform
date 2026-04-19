import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function AnalyticsStatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, trendPositive, className }) {
  const hasTrend = trend != null;
  const isPositive = trendPositive === true;
  const isNeutral = trendPositive === null || trendPositive === undefined;

  return (
    <div className={cn('glass-card rounded-2xl p-5 relative overflow-hidden', className)}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground/70">{title}</p>
        {Icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <p className="stat-number text-3xl font-heading font-bold mt-3 leading-none">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>}
      {hasTrend && (
        <div className={cn(
          'inline-flex items-center gap-1 mt-3 text-xs font-semibold px-2 py-0.5 rounded-full border',
          isNeutral ? 'bg-secondary text-muted-foreground border-border' :
          isPositive ? 'bg-accent/10 text-accent border-accent/20' : 'bg-destructive/10 text-destructive border-destructive/20'
        )}>
          {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trendLabel}
        </div>
      )}
    </div>
  );
}