import React from 'react';
import { cn } from '@/lib/utils';

export const LIFECYCLE_CONFIG = {
  lead:      { label: 'Lead',      dot: 'bg-[#93C5FD]',  badge: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]' },
  active:    { label: 'Active',    dot: 'bg-[#16A34A]',  badge: 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]' },
  at_risk:   { label: 'At Risk',   dot: 'bg-[#D97706]',  badge: 'bg-[#FFF7ED] text-[#D97706] border border-[#FED7AA]' },
  completed: { label: 'Completed', dot: 'bg-[#9CA3AF]',  badge: 'bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]' },
  alumni:    { label: 'Alumni',    dot: 'bg-[#9CA3AF]',  badge: 'bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]' },
};

export default function LifecycleBadge({ status, className }) {
  const config = LIFECYCLE_CONFIG[status] || LIFECYCLE_CONFIG.lead;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full', config.badge, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
      {config.label}
    </span>
  );
}