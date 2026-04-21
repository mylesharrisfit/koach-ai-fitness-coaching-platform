import React from 'react';
import { cn } from '@/lib/utils';

export default function BusinessMetricCard({ icon: Icon, label, value, sub, subColor, iconColor, iconBg }) {
  return (
    <div className="bg-white border border-[#E7EAF3] rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-[#6B7280] font-medium leading-tight">{label}</span>
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
      </div>
      <p className="stat-number text-2xl font-bold text-[#1F2A44] mb-1">{value}</p>
      {sub && <p className={cn('text-xs', subColor || 'text-[#6B7280]')}>{sub}</p>}
    </div>
  );
}