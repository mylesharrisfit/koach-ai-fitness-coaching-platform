import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
  return (
    <div className={cn(
      "glass-card card-hover rounded-2xl p-6 group relative overflow-hidden",
      className
    )}>
      {/* Subtle top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground/70">{title}</p>
          <p className="stat-number text-3xl font-heading font-bold mt-2 leading-none">{value}</p>
          {subtitle && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{subtitle}</p>}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 mt-3 text-xs font-semibold px-2.5 py-1 rounded-full border",
              trendUp
                ? "bg-accent/10 text-accent border-accent/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            )}>
              {trendUp ? '↑' : '↓'} {trend}
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:glow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner-top">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}