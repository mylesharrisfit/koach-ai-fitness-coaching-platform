/**
 * TopRecommendationBadge
 * Shows the single highest-priority coaching recommendation for a client.
 * Can be used in client cards, dashboard rows, and FastReview.
 *
 * Props:
 *   checkIn       — latest CheckIn record
 *   client        — Client record
 *   allClientCIs  — all check-ins for this client (sorted newest first)
 *   onApply       — optional callback after action applied
 *   compact       — if true, renders a slim 1-line pill (for list views)
 */

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTopRecommendation, PRIORITY_STYLES, CATEGORY_ICONS } from '@/lib/decisionEngine';

async function applyRecommendation(rec, checkIn, client) {
  if (rec.action === 'adjust_calories') {
    if (!client?.assigned_nutrition_id) throw new Error('No nutrition plan assigned');
    const plans = await base44.entities.NutritionPlan.filter({ id: client.assigned_nutrition_id });
    const plan = plans[0];
    if (!plan) throw new Error('Nutrition plan not found');
    const newCals = Math.max(1000, (plan.calories || 2000) + rec.actionData.delta);
    await Promise.all([
      base44.entities.NutritionPlan.update(plan.id, { calories: newCals }),
      base44.entities.Message.create({
        client_id: checkIn.client_id, client_name: checkIn.client_name,
        sender: 'coach',
        content: `Your daily calorie target has been updated to ${newCals} kcal (${rec.actionData.delta > 0 ? '+' : ''}${rec.actionData.delta} kcal).`,
        tag: 'nutrition', is_read: false,
      }),
    ]);
    return `Calories → ${newCals} kcal ✓`;
  }

  if (rec.action === 'adjust_cardio') {
    const msg = rec.actionData.direction === 'up'
      ? 'Cardio increased — add 1 extra session or +20 min this week.'
      : 'Cardio reduced — drop 1 session or −15 min this week.';
    await Promise.all([
      base44.entities.CheckIn.update(checkIn.id, {
        coach_notes: (checkIn.coach_notes ? checkIn.coach_notes + '\n' : '') + '[Cardio] ' + msg,
        coach_responded: true,
      }),
      base44.entities.Message.create({
        client_id: checkIn.client_id, client_name: checkIn.client_name,
        sender: 'coach', content: msg, tag: 'training', is_read: false,
      }),
    ]);
    return `Cardio ${rec.actionData.direction === 'up' ? 'increased' : 'reduced'} ✓`;
  }

  if (rec.action === 'message') {
    await base44.entities.Message.create({
      client_id: checkIn.client_id, client_name: checkIn.client_name,
      sender: 'coach', content: rec.actionData.content,
      tag: rec.actionData.tag || 'general', is_read: false,
    });
    return 'Message sent ✓';
  }

  if (rec.action === 'maintain') {
    await base44.entities.CheckIn.update(checkIn.id, { coach_responded: true });
    return 'Marked reviewed ✓';
  }

  return 'Done ✓';
}

export default function TopRecommendationBadge({ checkIn, client, allClientCIs = [], onApply, compact = false }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const rec = getTopRecommendation(checkIn, client, allClientCIs);
  if (!rec) return null;

  const styles = PRIORITY_STYLES[rec.priority];

  const handleApply = async (e) => {
    e.stopPropagation();
    if (applied || applying) return;
    setApplying(true);
    try {
      const msg = await applyRecommendation(rec, checkIn, client);
      setSuccessMsg(msg);
      setApplied(true);
      toast.success(msg);
      onApply?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setApplying(false);
    }
  };

  /* ── Compact pill (for client card list rows) ── */
  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold',
        applied ? 'opacity-60 bg-emerald-500/8 border-emerald-500/20 text-emerald-400' : styles.badge
      )}>
        <span className="flex-shrink-0">{CATEGORY_ICONS[rec.category]}</span>
        <span className="truncate max-w-[140px]">{applied ? successMsg : rec.title}</span>
        {!applied && (
          <button
            onClick={handleApply}
            disabled={applying}
            className="flex-shrink-0 flex items-center gap-0.5 ml-1 opacity-80 hover:opacity-100 transition-opacity"
          >
            {applying
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Zap className="w-3 h-3" />}
          </button>
        )}
        {applied && <Check className="w-3 h-3 flex-shrink-0" />}
      </div>
    );
  }

  /* ── Full card (for FastReview / expanded views) ── */
  return (
    <div className={cn(
      'rounded-xl border px-4 py-3 space-y-2 transition-all',
      applied ? 'opacity-60 bg-card/40 border-border' : styles.badge
    )}>
      <div className="flex items-start gap-2.5">
        <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', styles.dot)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm">{CATEGORY_ICONS[rec.category]}</span>
            <p className="text-sm font-bold leading-tight">{rec.title}</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{rec.reason}</p>
        </div>
      </div>
      <button
        onClick={handleApply}
        disabled={applying || applied}
        className={cn(
          'w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-all active:scale-95',
          applied
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default'
            : 'bg-card hover:brightness-110 border-current/30'
        )}
      >
        {applying
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : applied
          ? <><Check className="w-3.5 h-3.5" />{successMsg}</>
          : <><Zap className="w-3.5 h-3.5" />{rec.actionLabel}</>
        }
      </button>
    </div>
  );
}