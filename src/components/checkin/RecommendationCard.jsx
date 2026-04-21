import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Check, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRIORITY_STYLES, CATEGORY_ICONS } from '@/lib/decisionEngine';

/**
 * Renders a single recommendation with a one-click "Apply" button.
 * Handles all three action types: adjust_calories, adjust_cardio, message, maintain.
 */
export default function RecommendationCard({ recommendation: rec, checkIn, client, onApplied }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const styles = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.medium;

  const handleApply = async () => {
    if (applied || applying) return;
    setApplying(true);

    try {
      if (rec.action === 'adjust_calories') {
        if (!client?.assigned_nutrition_id) {
          toast.error('No nutrition plan assigned to this client');
          setApplying(false);
          return;
        }
        const plans = await base44.entities.NutritionPlan.filter({ id: client.assigned_nutrition_id });
        const plan = plans[0];
        if (plan) {
          const newCals = Math.max(1000, (plan.calories || 2000) + rec.actionData.delta);
          await Promise.all([
            base44.entities.NutritionPlan.update(plan.id, { calories: newCals }),
            base44.entities.Message.create({
              client_id: checkIn.client_id,
              client_name: checkIn.client_name,
              sender: 'coach',
              content: `Your daily calorie target has been updated to ${newCals} kcal (${rec.actionData.delta > 0 ? '+' : ''}${rec.actionData.delta} kcal based on your progress).`,
              tag: 'nutrition',
              is_read: false,
            }),
          ]);
          toast.success(`Calories adjusted to ${newCals} kcal ✓`);
        }
      } else if (rec.action === 'adjust_cardio') {
        const msg = rec.actionData.direction === 'up'
          ? 'Your cardio has been increased — add 1 extra session or 20 min to your current sessions this week.'
          : 'Your cardio has been reduced — drop 1 session or reduce session duration by 15–20 min this week.';
        const existing = checkIn.coach_notes || '';
        await Promise.all([
          base44.entities.CheckIn.update(checkIn.id, {
            coach_notes: existing ? existing + '\n[Cardio] ' + msg : '[Cardio] ' + msg,
            coach_responded: true,
          }),
          base44.entities.Message.create({
            client_id: checkIn.client_id,
            client_name: checkIn.client_name,
            sender: 'coach',
            content: msg,
            tag: 'training',
            is_read: false,
          }),
        ]);
        toast.success(`Cardio ${rec.actionData.direction === 'up' ? 'increased' : 'reduced'} ✓`);
      } else if (rec.action === 'message') {
        await base44.entities.Message.create({
          client_id: checkIn.client_id,
          client_name: checkIn.client_name,
          sender: 'coach',
          content: rec.actionData.content,
          tag: rec.actionData.tag || 'general',
          is_read: false,
        });
        toast.success('Message sent ✓');
      } else if (rec.action === 'maintain') {
        await base44.entities.CheckIn.update(checkIn.id, { coach_responded: true });
        toast.success('Check-in marked reviewed ✓');
      }

      setApplied(true);
      onApplied?.(rec);
    } catch (err) {
      toast.error('Failed to apply: ' + err.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className={cn(
      'relative bg-card border rounded-xl overflow-hidden transition-all duration-200',
      applied ? 'opacity-60' : 'hover:border-primary/20'
    )}>
      {/* priority bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', styles.bar)} />

      <div className="pl-4 pr-3 py-3 flex items-start gap-3">
        {/* icon + category */}
        <div className="text-lg flex-shrink-0 mt-0.5">
          {CATEGORY_ICONS[rec.category] || '⚡'}
        </div>

        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-bold">{rec.title}</span>
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border capitalize', styles.badge)}>
              {rec.priority}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>
        </div>

        {/* apply button */}
        <button
          onClick={handleApply}
          disabled={applied || applying}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all active:scale-[0.95] whitespace-nowrap',
            applied
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default'
              : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
          )}
        >
          {applying
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : applied
              ? <><Check className="w-3.5 h-3.5" /> Done</>
              : <><Zap className="w-3.5 h-3.5" /> {rec.actionLabel}</>
          }
        </button>
      </div>
    </div>
  );
}