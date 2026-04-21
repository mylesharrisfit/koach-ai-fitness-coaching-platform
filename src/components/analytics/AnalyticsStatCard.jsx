import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function AnalyticsStatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, trendPositive, className }) {
  const hasTrend = trend != null;
  const isPositive = trendPositive === true;
  const isNeutral = trendPositive === null || trendPositive === undefined;

  return (
    <div className={cn('bg-white border border-[#E7EAF3] rounded-2xl p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wider uppercase text-[#6B7280]">{title}</p>
        {Icon && (
          <div className="p-2 rounded-lg bg-[#EEF4FF] text-primary">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <p className="stat-number text-3xl font-heading font-bold mt-3 leading-none text-[#1F2A44]">{value}</p>
      {subtitle && <p className="text-xs text-[#6B7280] mt-1.5">{subtitle}</p>}
      {hasTrend && (
        <div className={cn(
          'inline-flex items-center gap-1 mt-3 text-xs font-semibold px-2 py-0.5 rounded-full border',
          isNeutral ? 'bg-[#F6F7FB] text-[#6B7280] border-[#E7EAF3]' :
          isPositive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'
        )}>
          {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trendLabel}
        </div>
      )}
    </div>
  );
}