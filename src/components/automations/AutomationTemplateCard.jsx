import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AutomationTemplateCard({ template, onUse }) {
  return (
    <div className={cn('rounded-2xl border p-4 flex flex-col gap-3 bg-card transition-all hover:shadow-md', template.color?.replace('text-', 'border-') || 'border-border')}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{template.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{template.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{template.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <span className="bg-secondary px-2 py-0.5 rounded-full text-muted-foreground font-medium">
          IF {template.condition_type?.replace(/_/g, ' ')}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="bg-secondary px-2 py-0.5 rounded-full text-muted-foreground font-medium">
          THEN {template.action_type?.replace(/_/g, ' ')}
        </span>
      </div>

      <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1.5 mt-auto" onClick={() => onUse(template)}>
        <Plus className="w-3 h-3" /> Use Template
      </Button>
    </div>
  );
}