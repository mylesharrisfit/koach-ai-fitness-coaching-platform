import React from 'react';
import { Button } from '@/components/ui/button';

// Not currently mounted (Automations renders its own template rows). Kept in the kit style.
export default function AutomationTemplateCard({ template, onUse }) {
  return (
    <div className="panel p-4 flex flex-col gap-3">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-foreground">{template.name}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{template.description}</p>
      </div>
      <p className="text-[13px] text-muted-foreground">
        When {template.condition_type?.replace(/_/g, ' ')} → {template.action_type?.replace(/_/g, ' ')}
      </p>
      <Button size="sm" variant="outline" className="mt-auto self-start" onClick={() => onUse(template)}>Use</Button>
    </div>
  );
}
