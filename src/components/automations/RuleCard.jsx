import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONDITION_META, ACTION_META } from '@/lib/automationEngine';
import { format, parseISO } from 'date-fns';

export default function RuleCard({ rule, matchCount, onToggle, onEdit, onDelete }) {
  const cMeta = CONDITION_META[rule.condition_type] || {};
  const aMeta = ACTION_META[rule.action_type] || {};

  return (
    <div className={cn(
      'panel p-4',
      !rule.is_active && 'opacity-60'
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[15px] font-semibold text-foreground">{rule.name}</p>
            {matchCount > 0 && rule.is_active && (
              <span className="text-[13px] font-semibold text-destructive">
                {matchCount} client{matchCount > 1 ? 's' : ''} caught
              </span>
            )}
          </div>

          {/* IF → THEN */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap text-sm">
            <span className="text-foreground/80">
              When {cMeta.label || rule.condition_type?.replace(/_/g, ' ')}
              {rule.condition_threshold != null && (
                <span className="text-muted-foreground ml-1">
                  {rule.condition_threshold}{cMeta.thresholdType === 'percent' ? '%' : cMeta.thresholdType === 'days' ? 'd' : '×'}
                </span>
              )}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="text-foreground/80">
              {aMeta.label || rule.action_type?.replace(/_/g, ' ')}
            </span>
          </div>

          {rule.action_message && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">"{rule.action_message}"</p>
          )}
          {rule.action_calorie_delta != null && rule.action_type === 'adjust_calories' && (
            <p className="text-xs text-muted-foreground mt-1">
              Adjustment: <span className={rule.action_calorie_delta < 0 ? 'text-destructive' : 'text-success'}>
                {rule.action_calorie_delta > 0 ? '+' : ''}{rule.action_calorie_delta} kcal
              </span>
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
              {rule.trigger_count > 0 && <span>Ran {rule.trigger_count} times</span>}
              {rule.last_triggered && <span>last {format(parseISO(rule.last_triggered), 'MMM d')}</span>}
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