import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
  return (
    <div className={cn(
      "bg-card rounded-2xl p-6 border border-border hover:border-primary/20 transition-all duration-300 group",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-heading font-bold mt-2">{value}</p>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2 py-0.5 rounded-full",
              trendUp ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
            )}>
              {trendUp ? '↑' : '↓'} {trend}
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}