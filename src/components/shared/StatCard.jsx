import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, sub, trend, trendUp, icon: Icon, accent, className }) {
  return (
    <div className={cn(
      'relative rounded-2xl border border-white/[0.06] p-5 transition-all duration-200 hover:border-white/[0.10] hover:bg-[#1C1C1C] group',
      className
    )}
    style={{ background: '#161616' }}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/30">{label}</p>
        {Icon && (
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', accent || 'bg-primary/10')}>
            <Icon className={cn('w-4 h-4', accent ? 'text-white' : 'text-primary')} />
          </div>
        )}
      </div>
      <p className="stat-number text-3xl font-bold text-white mb-1">{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={cn('flex items-center gap-0.5 text-xs font-semibold', trendUp ? 'text-success' : 'text-destructive')}>
              {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend}
            </span>
          )}
          {sub && <p className="text-xs text-white/30">{sub}</p>}
        </div>
      )}
    </div>
  );
}