import React from 'react';
import { cn } from '@/lib/utils';

export const LIFECYCLE_CONFIG = {
  lead:      { label: 'Lead',      dot: 'bg-[#9CA3AF]' },
  active:    { label: 'Active',    dot: 'bg-[#16A34A]' },
  at_risk:   { label: 'At Risk',   dot: 'bg-[#DC2626]' },
  completed: { label: 'Completed', dot: 'bg-[#9CA3AF]' },
  alumni:    { label: 'Alumni',    dot: 'bg-[#9CA3AF]' },
};

export default function LifecycleBadge({ status, className }) {
  const config = LIFECYCLE_CONFIG[status] || LIFECYCLE_CONFIG.lead;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]', className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
      {config.label}
    </span>
  );
}