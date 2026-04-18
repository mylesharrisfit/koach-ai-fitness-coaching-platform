import React from 'react';
import { AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACTION_META, CONDITION_META } from '@/lib/automationEngine';

export default function AutomationResultsPanel({ results }) {
  if (!results.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
          <Zap className="w-5 h-5 text-accent" />
        </div>
        <p className="text-sm font-medium">No rules triggered</p>
        <p className="text-xs text-muted-foreground mt-1">All clients are within thresholds</p>
      </div>
    );
  }

  // Group by rule
  const grouped = results.reduce((acc, r) => {
    const key = r.rule.id;
    if (!acc[key]) acc[key] = { rule: r.rule, clients: [] };
    acc[key].clients.push({ client: r.client, detail: r.detail });
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.values(grouped).map(({ rule, clients }) => {
        const cMeta = CONDITION_META[rule.condition_type] || {};
        const aMeta = ACTION_META[rule.action_type] || {};
        return (
          <div key={rule.id} className="bg-card border border-destructive/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{cMeta.icon || '⚡'}</span>
              <div>
                <p className="text-sm font-semibold">{rule.name}</p>
                <p className="text-xs text-muted-foreground">→ {aMeta.label || rule.action_type}</p>
              </div>
              <span className="ml-auto text-xs font-bold bg-destructive/15 text-destructive px-2 py-0.5 rounded-full">
                {clients.length} client{clients.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-1.5">
              {clients.map(({ client, detail }) => (
                <div key={client.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-secondary/40">
                  <div className="w-7 h-7 rounded-full bg-destructive/20 flex items-center justify-center text-xs font-bold text-destructive flex-shrink-0">
                    {client.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{client.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
            {rule.action_message && (
              <div className="mt-3 bg-primary/5 border border-primary/15 rounded-xl p-2.5">
                <p className="text-[10px] font-semibold text-primary mb-1 uppercase tracking-wide">Message to send</p>
                <p className="text-xs text-foreground leading-relaxed">"{rule.action_message}"</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}