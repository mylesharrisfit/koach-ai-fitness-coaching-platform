import React, { useState } from 'react';
import {
  MessageSquare, Flame, Footprints, ClipboardCheck,
  Sparkles, Check, Loader2, Plus, Minus, ChevronUp, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/* ── Tiny inline confirmation pill ── */
function ConfirmPill({ onConfirm, onCancel, label = 'Confirm?' }) {
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <button
        onClick={onConfirm}
        className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full hover:bg-emerald-500/20 transition-colors"
      >
        Yes
      </button>
      <button
        onClick={onCancel}
        className="text-[11px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full hover:bg-secondary/70 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

/* ── Calorie adjuster sub-panel ── */
function CaloriesPanel({ checkIn, client, onDone }) {
  const [saving, setSaving] = useState(false);

  const adjust = async (delta) => {
    if (!client?.assigned_nutrition_id) {
      toast.error('No nutrition plan assigned to this client');
      return;
    }
    setSaving(true);
    const plans = await base44.entities.NutritionPlan.filter({ id: client.assigned_nutrition_id });
    const plan = plans[0];
    if (plan) {
      const newCals = Math.max(1000, (plan.calories || 2000) + delta);
      await base44.entities.NutritionPlan.update(plan.id, { calories: newCals });
      // Notify client
      await base44.entities.Message.create({
        client_id: checkIn.client_id,
        client_name: checkIn.client_name,
        sender: 'coach',
        content: `Your daily calorie target has been updated to ${newCals} kcal (${delta > 0 ? '+' : ''}${delta} adjustment based on your check-in).`,
        tag: 'nutrition',
        is_read: false,
      });
      toast.success(`Calories ${delta > 0 ? 'increased' : 'decreased'} to ${newCals} kcal`);
      onDone(delta > 0 ? `+${delta} kcal` : `${delta} kcal`);
    } else {
      toast.error('Could not find nutrition plan');
    }
    setSaving(false);
  };

  return (
    <div className="mt-2 p-3 bg-orange-500/8 border border-orange-500/20 rounded-xl space-y-2">
      <p className="text-xs font-semibold text-orange-400">Adjust daily calories</p>
      <div className="flex gap-2">
        {[[-250, '−250'], [-150, '−150'], [+150, '+150'], [+250, '+250']].map(([delta, label]) => (
          <button
            key={delta}
            onClick={() => adjust(delta)}
            disabled={saving}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-bold border transition-all active:scale-[0.96]',
              delta < 0
                ? 'bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            )}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Cardio adjuster sub-panel ── */
function CardioPanel({ checkIn, client, onDone }) {
  const [saving, setSaving] = useState(false);

  const adjust = async (direction) => {
    setSaving(true);
    const msg = direction === 'up'
      ? 'Your cardio has been increased — add 1 extra session or 20 min to your current sessions this week.'
      : 'Your cardio has been reduced — drop 1 session or reduce session duration by 15–20 min this week.';

    const existing = checkIn.coach_notes || '';
    await base44.entities.CheckIn.update(checkIn.id, {
      coach_notes: existing ? existing + '\n[Cardio] ' + msg : '[Cardio] ' + msg,
    });
    await base44.entities.Message.create({
      client_id: checkIn.client_id,
      client_name: checkIn.client_name,
      sender: 'coach',
      content: msg,
      tag: 'training',
      is_read: false,
    });
    toast.success(`Cardio ${direction === 'up' ? 'increased' : 'reduced'}`);
    onDone(direction === 'up' ? '+1 session' : '−1 session');
    setSaving(false);
  };

  return (
    <div className="mt-2 p-3 bg-blue-500/8 border border-blue-500/20 rounded-xl space-y-2">
      <p className="text-xs font-semibold text-blue-400">Adjust steps / cardio</p>
      <div className="flex gap-2">
        <button
          onClick={() => adjust('up')}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold border bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 active:scale-[0.96] transition-all"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ChevronUp className="w-3.5 h-3.5" /> Increase</>}
        </button>
        <button
          onClick={() => adjust('down')}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold border bg-secondary border-border text-muted-foreground hover:bg-secondary/70 active:scale-[0.96] transition-all"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ChevronDown className="w-3.5 h-3.5" /> Decrease</>}
        </button>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function CheckInQuickActions({
  checkIn, client, allClientCIs = [],
  onSendFeedback, onMarkReviewed, isReviewed, saving
}) {
  const [openPanel, setOpenPanel] = useState(null); // 'calories' | 'cardio'
  const [calResult, setCalResult] = useState(null);
  const [cardioResult, setCardioResult] = useState(null);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  const togglePanel = (name) => setOpenPanel(p => p === name ? null : name);

  const handleApplyAI = async () => {
    if (aiDone) return;
    setAiSaving(true);
    const weights = allClientCIs.filter(c => c.weight).slice(0, 4).map(c => c.weight);
    const weightTrend = weights.length >= 2
      ? (weights[0] < weights[weights.length - 1] ? 'trending down' : 'trending up or flat')
      : 'not enough data';
    const avgT = allClientCIs.slice(0, 4).reduce((s, c) => s + (c.compliance_training || 0), 0) / Math.min(allClientCIs.length || 1, 4);
    const avgN = allClientCIs.slice(0, 4).reduce((s, c) => s + (c.compliance_nutrition || 0), 0) / Math.min(allClientCIs.length || 1, 4);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an elite fitness coach writing a brief, specific response to your client's check-in.
Write 2–3 sentences MAX. Be warm, direct, and cite at least one specific number or data point.
Start with a positive acknowledgement then give one clear, actionable adjustment.

Client goal: ${client?.goal?.replace(/_/g, ' ') || 'general fitness'}
Weight trend: ${weightTrend}
Training compliance this week: ${checkIn.compliance_training ?? 'N/A'}% (4-week avg: ${Math.round(avgT)}%)
Nutrition compliance this week: ${checkIn.compliance_nutrition ?? 'N/A'}% (4-week avg: ${Math.round(avgN)}%)
Sleep: ${checkIn.sleep_hours ?? 'N/A'} hrs | Energy: ${checkIn.energy_level ?? 'N/A'}/10 | Stress: ${checkIn.stress_level ?? 'N/A'}/10
Client notes: ${checkIn.notes || 'none'}

Write the message directly to the client (use "you"). Do NOT use bullet points.`,
    });

    // Save to check-in + send to inbox
    const existing = checkIn.coach_notes ? checkIn.coach_notes + '\n\n' : '';
    await Promise.all([
      base44.entities.CheckIn.update(checkIn.id, {
        coach_notes: existing + result,
        coach_responded: true,
      }),
      base44.entities.Message.create({
        client_id: checkIn.client_id,
        client_name: checkIn.client_name,
        sender: 'coach',
        content: result,
        tag: 'check_in',
        is_read: false,
      }),
    ]);

    setAiDone(true);
    setAiSaving(false);
    toast.success('AI feedback sent to client inbox');
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Actions</p>

      {/* ── 4 primary action buttons ── */}
      <div className="grid grid-cols-2 gap-2">

        {/* Send AI Feedback */}
        <button
          onClick={handleApplyAI}
          disabled={aiSaving || aiDone}
          className={cn(
            'flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97]',
            aiDone
              ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 opacity-60 cursor-default'
              : 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20'
          )}
        >
          {aiSaving
            ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            : aiDone
              ? <Check className="w-4 h-4 flex-shrink-0" />
              : <Sparkles className="w-4 h-4 flex-shrink-0" />
          }
          <span className="leading-tight">{aiDone ? 'Feedback Sent' : 'Send AI Feedback'}</span>
        </button>

        {/* Write Custom Feedback */}
        <button
          onClick={onSendFeedback}
          className="flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97] bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
        >
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          <span className="leading-tight">Write Feedback</span>
        </button>

        {/* Calories */}
        <button
          onClick={() => togglePanel('calories')}
          className={cn(
            'flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97]',
            calResult
              ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 opacity-60 cursor-default'
              : openPanel === 'calories'
                ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                : 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
          )}
          disabled={!!calResult}
        >
          <Flame className="w-4 h-4 flex-shrink-0" />
          <span className="leading-tight">{calResult ? `Calories ${calResult}` : 'Adjust Calories'}</span>
        </button>

        {/* Cardio */}
        <button
          onClick={() => togglePanel('cardio')}
          className={cn(
            'flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97]',
            cardioResult
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 opacity-60 cursor-default'
              : openPanel === 'cardio'
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
          )}
          disabled={!!cardioResult}
        >
          <Footprints className="w-4 h-4 flex-shrink-0" />
          <span className="leading-tight">{cardioResult ? `Cardio ${cardioResult}` : 'Adjust Cardio'}</span>
        </button>
      </div>

      {/* ── Inline sub-panels (expand below buttons) ── */}
      {openPanel === 'calories' && (
        <CaloriesPanel
          checkIn={checkIn}
          client={client}
          onDone={(result) => { setCalResult(result); setOpenPanel(null); }}
        />
      )}
      {openPanel === 'cardio' && (
        <CardioPanel
          checkIn={checkIn}
          client={client}
          onDone={(result) => { setCardioResult(result); setOpenPanel(null); }}
        />
      )}

      {/* ── Mark Reviewed ── */}
      <button
        onClick={onMarkReviewed}
        disabled={saving || isReviewed}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97]',
          isReviewed
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 opacity-60 cursor-default'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
        )}
      >
        {saving
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : isReviewed
            ? <><Check className="w-4 h-4" /> Marked as Reviewed</>
            : <><ClipboardCheck className="w-4 h-4" /> Mark as Reviewed</>
        }
      </button>
    </div>
  );
}