import React from 'react';
import { cn } from '@/lib/utils';

export default function PageHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex items-start justify-between mb-8', className)}>
      <div>
        <h1 className="text-2xl font-heading font-bold text-white tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
}