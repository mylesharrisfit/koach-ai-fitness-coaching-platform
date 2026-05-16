import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const LIFECYCLE_CONFIG = {
  lead:      { label: 'Lead',      color: 'bg-blue-500 text-white border-blue-500' },
  active:    { label: 'Active',    color: 'bg-emerald-500 text-white border-emerald-500' },
  at_risk:   { label: 'At Risk',   color: 'bg-orange-500 text-white border-orange-500' },
  completed: { label: 'Completed', color: 'bg-gray-400 text-white border-gray-400' },
  alumni:    { label: 'Alumni',    color: 'bg-purple-500 text-white border-purple-500' },
};

export default function LifecycleBadge({ status, className }) {
  const config = LIFECYCLE_CONFIG[status] || LIFECYCLE_CONFIG.lead;
  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold border', config.color, className)}>
      {config.label}
    </Badge>
  );
}