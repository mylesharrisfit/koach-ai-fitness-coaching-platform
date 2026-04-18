import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const LIFECYCLE_CONFIG = {
  lead:      { label: 'Lead',      color: 'bg-chart-4/15 text-chart-4 border-chart-4/30' },
  active:    { label: 'Active',    color: 'bg-accent/15 text-accent border-accent/30' },
  at_risk:   { label: 'At Risk',   color: 'bg-destructive/15 text-destructive border-destructive/30' },
  completed: { label: 'Completed', color: 'bg-chart-3/15 text-chart-3 border-chart-3/30' },
  alumni:    { label: 'Alumni',    color: 'bg-primary/15 text-primary border-primary/30' },
};

export default function LifecycleBadge({ status, className }) {
  const config = LIFECYCLE_CONFIG[status] || LIFECYCLE_CONFIG.lead;
  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold border', config.color, className)}>
      {config.label}
    </Badge>
  );
}