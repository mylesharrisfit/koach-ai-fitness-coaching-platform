import React, { useState } from 'react';
import { MessageSquare, Flame, Footprints, ClipboardCheck, Sparkles, CheckCircle2, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

export default function CheckInQuickActions({ checkIn, client, allClientCIs = [], onSendFeedback, onMarkReviewed, isReviewed, saving }) {
  const [calDone, setCalDone] = useState(false);
  const [calSaving, setCalSaving] = useState(false);
  const [cardioDone, setCardioDone] = useState(false);
  const [cardioSaving, setCardioSaving] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);

  const handleAdjustCalories = async () => {
    if (calDone || !client?.assigned_nutrition_id) return;
    setCalSaving(true);
    const plans = await base44.entities.NutritionPlan.filter({ id: client.assigned_nutrition_id });
    if (plans[0]) {
      await base44.entities.NutritionPlan.update(plans[0].id, {
        calories: (plans[0].calories || 2000) - 150,
      });
    }
    setCalSaving(false);
    setCalDone(true);
  };

  const handleIncreaseCardio = async () => {
    if (cardioDone) return;
    setCardioSaving(true);
    const existing = checkIn.coach_notes || '';
    const note = existing
      ? existing + '\n[Action] Cardio increased — +1 session or +20 min/week.'
      : '[Action] Cardio increased — +1 session or +20 min/week.';
    await base44.entities.CheckIn.update(checkIn.id, { coach_notes: note });
    setCardioSaving(false);
    setCardioDone(true);
  };

  const handleApplyAI = async () => {
    if (aiDone) return;
    setAiSaving(true);
    const weights = allClientCIs.filter(c => c.weight).slice(0, 4).map(c => c.weight);
    const weightTrend = weights.length >= 2
      ? (weights[0] - weights[weights.length - 1] > 0 ? 'trending down' : 'trending up or stable')
      : 'unknown';
    const avgT = allClientCIs.slice(0, 4).reduce((s, c) => s + (c.compliance_training || 0), 0) / Math.min(allClientCIs.length || 1, 4);
    const avgN = allClientCIs.slice(0, 4).reduce((s, c) => s + (c.compliance_nutrition || 0), 0) / Math.min(allClientCIs.length || 1, 4);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an elite fitness coach. Based on this client check-in, write a concise coaching note (2–3 sentences max) with the most important adjustment to make right now.
Client goal: ${client?.goal?.replace(/_/g, ' ') || 'general fitness'}
Weight trend: ${weightTrend}
Training compliance: ${checkIn.compliance_training ?? 'N/A'}% (avg: ${Math.round(avgT)}%)
Nutrition compliance: ${checkIn.compliance_nutrition ?? 'N/A'}% (avg: ${Math.round(avgN)}%)
Sleep: ${checkIn.sleep_hours ?? 'N/A'} hrs
Energy: ${checkIn.energy_level ?? 'N/A'}/10
Stress: ${checkIn.stress_level ?? 'N/A'}/10
Mood: ${checkIn.mood || 'N/A'}
Client notes: ${checkIn.notes || 'none'}
Write the note directly as if speaking to the client. Be specific, cite one number. Start with an action.`,
    });

    const existing = checkIn.coach_notes ? checkIn.coach_notes + '\n\n' : '';
    await base44.entities.CheckIn.update(checkIn.id, {
      coach_notes: existing + '[AI] ' + result,
      coach_responded: true,
    });
    setAiSaving(false);
    setAiDone(true);
  };

  const actions = [
    {
      label: 'Send Feedback',
      icon: MessageSquare,
      onClick: onSendFeedback,
      done: false,
      saving: false,
      color: 'text-primary bg-primary/10 border-primary/20 hover:bg-primary/20',
    },
    {
      label: calDone ? 'Calories −150' : 'Adjust Calories',
      icon: Flame,
      onClick: handleAdjustCalories,
      done: calDone,
      saving: calSaving,
      disabled: !client?.assigned_nutrition_id,
      title: !client?.assigned_nutrition_id ? 'No nutrition plan assigned' : undefined,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20',
    },
    {
      label: cardioDone ? 'Cardio Added' : 'Increase Cardio',
      icon: Footprints,
      onClick: handleIncreaseCardio,
      done: cardioDone,
      saving: cardioSaving,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20',
    },
    {
      label: aiDone ? 'AI Applied' : 'Apply AI Note',
      icon: Sparkles,
      onClick: handleApplyAI,
      done: aiDone,
      saving: aiSaving,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20',
    },
    {
      label: isReviewed ? 'Reviewed' : 'Mark Reviewed',
      icon: ClipboardCheck,
      onClick: onMarkReviewed,
      done: isReviewed,
      saving: saving,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Actions</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {actions.map((a) => {
          const Icon = a.icon;
          const isDone = a.done;
          const isSaving = a.saving;
          return (
            <button
              key={a.label}
              onClick={a.onClick}
              disabled={isSaving || isDone || a.disabled}
              title={a.title}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-[0.97]',
                a.color,
                (isDone || a.disabled) && 'opacity-50 cursor-default'
              )}
            >
              {isSaving
                ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                : isDone
                  ? <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  : <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              }
              <span className="truncate">{a.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}