import React from 'react';
import { cn } from '@/lib/utils';

export const LIFECYCLE_CONFIG = {
  lead:      { label: 'Lead',      dot: 'bg-primary',  badge: 'bg-accent/10 text-primary border border-accent' },
  active:    { label: 'Active',    dot: 'bg-success',  badge: 'bg-success/10 text-success border border-success' },
  at_risk:   { label: 'At Risk',   dot: 'bg-warning',  badge: 'bg-[#FFF7ED] text-warning border border-[#FED7AA]' },
  completed: { label: 'Completed', dot: 'bg-muted-foreground',  badge: 'bg-background text-muted-foreground border border-border' },
  alumni:    { label: 'Alumni',    dot: 'bg-muted-foreground',  badge: 'bg-background text-muted-foreground border border-border' },
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