import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONDITION_META, ACTION_META } from '@/lib/automationEngine';
import { format, parseISO } from 'date-fns';

export default function RuleCard({ rule, matchCount, onToggle, onEdit, onDelete }) {
  const cMeta = CONDITION_META[rule.condition_type] || {};
  const aMeta = ACTION_META[rule.action_type] || {};

  return (
    <div className={cn(
      'bg-card border rounded-2xl p-4 transition-all',
      rule.is_active ? 'border-border' : 'border-border opacity-60'
    )}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
          {cMeta.icon || '⚡'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{rule.name}</p>
            {matchCount > 0 && rule.is_active && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-destructive/15 text-destructive px-1.5 py-0.5 rounded border border-destructive/20">
                <Zap className="w-2.5 h-2.5" /> {matchCount} client{matchCount > 1 ? 's' : ''} triggered
              </span>
            )}
          </div>

          {/* IF → THEN */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs">
            <span className="bg-secondary px-2 py-1 rounded-lg font-medium text-foreground">
              IF {cMeta.label || rule.condition_type?.replace(/_/g, ' ')}
              {rule.condition_threshold != null && (
                <span className="text-muted-foreground ml-1">
                  {rule.condition_threshold}{cMeta.thresholdType === 'percent' ? '%' : cMeta.thresholdType === 'days' ? 'd' : '×'}
                </span>
              )}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="bg-secondary px-2 py-1 rounded-lg font-medium text-foreground">
              THEN {aMeta.label || rule.action_type?.replace(/_/g, ' ')}
            </span>
          </div>

          {rule.action_message && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">"{rule.action_message}"</p>
          )}
          {rule.action_calorie_delta != null && rule.action_type === 'adjust_calories' && (
            <p className="text-xs text-muted-foreground mt-1">
              Adjustment: <span className={rule.action_calorie_delta < 0 ? 'text-destructive' : 'text-accent'}>
                {rule.action_calorie_delta > 0 ? '+' : ''}{rule.action_calorie_delta} kcal
              </span>
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {rule.trigger_count > 0 && <span>Fired {rule.trigger_count}× total</span>}
              {rule.last_triggered && <span>Last: {format(parseISO(rule.last_triggered), 'MMM d')}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(rule)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(rule.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              <Switch checked={rule.is_active} onCheckedChange={v => onToggle(rule, v)} className="scale-90" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}