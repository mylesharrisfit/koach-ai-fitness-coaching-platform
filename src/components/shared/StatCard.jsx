import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
  return (
    <div className={cn(
      "bg-white border border-[#E7EAF3] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-[#6B7280]">{title}</p>
          <p className="stat-number text-3xl font-heading font-bold mt-2 leading-none text-[#1F2A44]">{value}</p>
          {subtitle && <p className="text-sm text-[#6B7280] mt-2 leading-relaxed">{subtitle}</p>}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 mt-3 text-xs font-semibold px-2.5 py-1 rounded-full border",
              trendUp
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-red-50 text-red-500 border-red-100"
            )}>
              {trendUp ? '↑' : '↓'} {trend}
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-[#EEF4FF] text-primary transition-all duration-200">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}