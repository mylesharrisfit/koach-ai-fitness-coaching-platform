import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInDays, parseISO, format } from 'date-fns';
import {
  ChevronLeft, ChevronRight, CheckCircle2, Sparkles, MessageSquare,
  Flame, Footprints, Check, Loader2, Send, RefreshCw, Moon, Zap,
  TrendingDown, TrendingUp, Minus, BookOpen, ChevronDown, Pencil,
  ClipboardCheck, X, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { compositeAdherenceScore, scoreColor } from '@/lib/adherence';

/* ─────────────────────────────────────────
   AI + Template helpers (inline, no imports)
───────────────────────────────────────── */
const TEMPLATES = [
  { label: 'Great Check-in', text: "Awesome check-in this week! Your consistency is really showing. Keep up the great work and let's build on this momentum! 💪" },
  { label: 'Motivation Boost', text: "Just wanted to say I'm proud of the effort you've been putting in. Some weeks are harder than others — keep showing up and the results will follow 🔥" },
  { label: 'Nutrition Reminder', text: "Quick reminder to stay on track with your nutrition targets this week. Even 80% compliance makes a huge difference over time. You've got this!" },
  { label: 'Missed Check-in', text: "Hey, I noticed you missed your check-in this week. Everything okay? Let me know if anything came up — I'm here to support you!" },
];

function buildAIPrompt(client, checkIn, allCIs) {
  const weights = allCIs.filter(c => c.weight).slice(0, 4).map(c => c.weight);
  const avgT = allCIs.slice(0, 4).reduce((s, c) => s + (c.compliance_training || 0), 0) / Math.min(allCIs.length || 1, 4);
  const avgN = allCIs.slice(0, 4).reduce((s, c) => s + (c.compliance_nutrition || 0), 0) / Math.min(allCIs.length || 1, 4);
  const weightTrend = weights.length >= 2
    ? (weights[0] < weights[weights.length - 1] ? 'trending down' : 'trending up or flat')
    : 'not enough data';
  return `You are an elite fitness coach writing a brief, specific check-in response.
Write 2–3 sentences MAX. Warm, direct, cite at least one specific data point. Start positive then give one actionable adjustment.
Client goal: ${client?.goal?.replace(/_/g, ' ') || 'general fitness'}
Weight trend: ${weightTrend}
Training compliance: ${checkIn.compliance_training ?? 'N/A'}% (4-week avg: ${Math.round(avgT)}%)
Nutrition compliance: ${checkIn.compliance_nutrition ?? 'N/A'}% (4-week avg: ${Math.round(avgN)}%)
Sleep: ${checkIn.sleep_hours ?? 'N/A'} hrs | Energy: ${checkIn.energy_level ?? 'N/A'}/10 | Stress: ${checkIn.stress_level ?? 'N/A'}/10
Client notes: ${checkIn.notes || 'none'}
Write directly to the client ("you"). No bullet points.`;
}

/* ─────────────────────────────────────────
   Stat pill
───────────────────────────────────────── */
function Stat({ icon: Icon, value, label, colorClass }) {
  if (value == null) return null;
  return (
    <div className="flex flex-col items-center gap-0.5 bg-secondary/40 rounded-xl p-2.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mb-0.5" />
      <span className={cn('text-sm font-bold tabular-nums', colorClass)}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   Weight delta
───────────────────────────────────────── */
function WeightDelta({ current, previous }) {
  if (!current) return null;
  if (!previous) return <span className="font-bold">{current} lbs</span>;
  const diff = (current - previous).toFixed(1);
  const n = Number(diff);
  return (
    <span className="font-bold">
      {current} lbs{' '}
      <span className={cn('text-xs font-bold', n < 0 ? 'text-emerald-400' : n > 0 ? 'text-destructive' : 'text-muted-foreground')}>
        {n < 0 ? <TrendingDown className="w-3 h-3 inline" /> : n > 0 ? <TrendingUp className="w-3 h-3 inline" /> : <Minus className="w-3 h-3 inline" />}
        {n > 0 ? '+' : ''}{diff}
      </span>
    </span>
  );
}

/* ─────────────────────────────────────────
   Inline feedback composer
───────────────────────────────────────── */
function FeedbackComposer({ checkIn, client, allCIs, onSent }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const generateAI = async () => {
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({ prompt: buildAIPrompt(client, checkIn, allCIs) });
    setText(result);
    setAiLoading(false);
  };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    await Promise.all([
      base44.entities.CheckIn.update(checkIn.id, { coach_notes: text, coach_responded: true }),
      base44.entities.Message.create({
        client_id: checkIn.client_id,
        client_name: checkIn.client_name,
        sender: 'coach', content: text.trim(), tag: 'check_in', is_read: false,
      }),
    ]);
    setSending(false);
    toast.success('Feedback sent!');
    onSent();
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        {/* Templates */}
        <div className="relative">
          <button
            onClick={() => setShowTemplates(s => !s)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <BookOpen className="w-3 h-3" /> Templates <ChevronDown className="w-3 h-3" />
          </button>
          {showTemplates && (
            <div className="absolute left-0 top-9 z-30 bg-card border border-border rounded-xl shadow-xl p-2 w-64 max-h-56 overflow-y-auto">
              {TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => { setText(t.text); setShowTemplates(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
                  <p className="text-xs font-medium">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{t.text}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Generate */}
        <button
          onClick={generateAI}
          disabled={aiLoading}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-primary/30 bg-primary/10 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-60"
        >
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {aiLoading ? 'Generating…' : 'AI Draft'}
        </button>
      </div>

      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write your coaching response..."
        className="text-sm resize-none"
        rows={4}
        autoFocus
      />

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{text.length} chars</span>
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 active:scale-95 transition-all"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Send to Client
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Calorie / Cardio adjust panels
───────────────────────────────────────── */
function CaloriesPanel({ checkIn, client, onDone }) {
  const [saving, setSaving] = useState(false);
  const adjust = async (delta) => {
    if (!client?.assigned_nutrition_id) { toast.error('No nutrition plan assigned'); return; }
    setSaving(true);
    const plans = await base44.entities.NutritionPlan.filter({ id: client.assigned_nutrition_id });
    const plan = plans[0];
    if (plan) {
      const newCals = Math.max(1000, (plan.calories || 2000) + delta);
      await base44.entities.NutritionPlan.update(plan.id, { calories: newCals });
      await base44.entities.Message.create({
        client_id: checkIn.client_id, client_name: checkIn.client_name, sender: 'coach',
        content: `Your daily calorie target has been updated to ${newCals} kcal (${delta > 0 ? '+' : ''}${delta} adjustment).`,
        tag: 'nutrition', is_read: false,
      });
      toast.success(`Calories updated to ${newCals} kcal`);
      onDone(`${delta > 0 ? '+' : ''}${delta} kcal`);
    }
    setSaving(false);
  };
  return (
    <div className="p-3 bg-orange-500/8 border border-orange-500/20 rounded-xl space-y-2">
      <p className="text-xs font-semibold text-orange-400">Adjust daily calories</p>
      <div className="grid grid-cols-4 gap-2">
        {[[-250, '−250'], [-150, '−150'], [+150, '+150'], [+250, '+250']].map(([d, l]) => (
          <button key={d} onClick={() => adjust(d)} disabled={saving}
            className={cn('py-2 rounded-lg text-xs font-bold border active:scale-95 transition-all',
              d < 0 ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400')}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : l}
          </button>
        ))}
      </div>
    </div>
  );
}

function CardioPanel({ checkIn, client, onDone }) {
  const [saving, setSaving] = useState(false);
  const adjust = async (dir) => {
    setSaving(true);
    const msg = dir === 'up'
      ? 'Your cardio has been increased — add 1 extra session or 20 min to your current sessions this week.'
      : 'Your cardio has been reduced — drop 1 session or reduce session duration by 15–20 min this week.';
    await base44.entities.CheckIn.update(checkIn.id, {
      coach_notes: (checkIn.coach_notes ? checkIn.coach_notes + '\n' : '') + '[Cardio] ' + msg,
    });
    await base44.entities.Message.create({
      client_id: checkIn.client_id, client_name: checkIn.client_name, sender: 'coach',
      content: msg, tag: 'training', is_read: false,
    });
    toast.success(`Cardio ${dir === 'up' ? 'increased' : 'reduced'}`);
    onDone(dir === 'up' ? '+1 session' : '−1 session');
    setSaving(false);
  };
  return (
    <div className="p-3 bg-blue-500/8 border border-blue-500/20 rounded-xl space-y-2">
      <p className="text-xs font-semibold text-blue-400">Adjust cardio</p>
      <div className="flex gap-2">
        <button onClick={() => adjust('up')} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold border bg-blue-500/10 border-blue-500/20 text-blue-400 active:scale-95 transition-all">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ChevronUp className="w-3.5 h-3.5" /> Increase</>}
        </button>
        <button onClick={() => adjust('down')} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold border bg-secondary border-border text-muted-foreground active:scale-95 transition-all">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ChevronDown className="w-3.5 h-3.5" /> Decrease</>}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Single check-in card (full review panel)
───────────────────────────────────────── */
function ReviewCard({ checkIn, client, allCIs, onMarkReviewed, isReviewed, markSaving }) {
  const [panel, setPanel] = useState(null); // 'feedback' | 'calories' | 'cardio'
  const [calResult, setCalResult] = useState(null);
  const [cardioResult, setCardioResult] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(!!checkIn.coach_responded || !!checkIn.coach_notes);
  const [aiSending, setAiSending] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  const prevCI = allCIs[1];
  const daysAgo = differenceInDays(new Date(), parseISO(checkIn.date));
  const avgScore = compositeAdherenceScore(allCIs);
  const MOOD_EMOJI = { great: '😄', good: '🙂', okay: '😐', tired: '😴', stressed: '😰' };

  const sendAI = async () => {
    setAiSending(true);
    const result = await base44.integrations.Core.InvokeLLM({ prompt: buildAIPrompt(client, checkIn, allCIs) });
    await Promise.all([
      base44.entities.CheckIn.update(checkIn.id, { coach_notes: result, coach_responded: true }),
      base44.entities.Message.create({
        client_id: checkIn.client_id, client_name: checkIn.client_name,
        sender: 'coach', content: result, tag: 'check_in', is_read: false,
      }),
    ]);
    setAiDone(true);
    setFeedbackSent(true);
    setAiSending(false);
    toast.success('AI feedback sent to client!');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Client header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
          {(client?.name || checkIn.client_name || '?')[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base">{client?.name || checkIn.client_name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            {format(parseISO(checkIn.date), 'MMM d, yyyy')}
            {daysAgo > 0 && (
              <span className={cn(daysAgo > 7 ? 'text-destructive' : daysAgo > 3 ? 'text-amber-400' : '')}> · {daysAgo}d ago</span>
            )}
            {checkIn.mood && <span className="ml-1">{MOOD_EMOJI[checkIn.mood]}</span>}
          </p>
        </div>
        {(feedbackSent || isReviewed) && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <Check className="w-3 h-3" /> Reviewed
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        <Stat icon={Zap} value={checkIn.weight ? `${checkIn.weight}` : null} label="lbs"
          colorClass={cn(prevCI?.weight && checkIn.weight < prevCI.weight ? 'text-emerald-400' : 'text-foreground')} />
        <Stat icon={Moon} value={checkIn.sleep_hours} label="hrs sleep"
          colorClass={checkIn.sleep_hours >= 7 ? 'text-emerald-400' : checkIn.sleep_hours >= 6 ? 'text-amber-400' : 'text-destructive'} />
        <Stat icon={Zap} value={checkIn.energy_level} label="energy"
          colorClass={checkIn.energy_level >= 4 ? 'text-emerald-400' : checkIn.energy_level >= 2 ? 'text-amber-400' : 'text-destructive'} />
        <div className="flex flex-col items-center gap-0.5 bg-secondary/40 rounded-xl p-2.5">
          <span className="text-[10px] text-muted-foreground mb-0.5">Adhere.</span>
          <span className={cn('text-sm font-bold tabular-nums', scoreColor(avgScore))}>{avgScore ?? '–'}</span>
          <span className="text-[10px] text-muted-foreground">%</span>
        </div>
      </div>

      {/* Compliance bars */}
      {(checkIn.compliance_training != null || checkIn.compliance_nutrition != null) && (
        <div className="space-y-2">
          {checkIn.compliance_training != null && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Training</span>
                <span className={cn('text-xs font-bold', checkIn.compliance_training >= 80 ? 'text-emerald-400' : checkIn.compliance_training >= 60 ? 'text-amber-400' : 'text-destructive')}>
                  {checkIn.compliance_training}%
                </span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', checkIn.compliance_training >= 80 ? 'bg-emerald-400' : checkIn.compliance_training >= 60 ? 'bg-amber-400' : 'bg-destructive')}
                  style={{ width: `${checkIn.compliance_training}%` }} />
              </div>
            </div>
          )}
          {checkIn.compliance_nutrition != null && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Nutrition</span>
                <span className={cn('text-xs font-bold', checkIn.compliance_nutrition >= 80 ? 'text-emerald-400' : checkIn.compliance_nutrition >= 60 ? 'text-amber-400' : 'text-destructive')}>
                  {checkIn.compliance_nutrition}%
                </span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', checkIn.compliance_nutrition >= 80 ? 'bg-emerald-400' : checkIn.compliance_nutrition >= 60 ? 'bg-amber-400' : 'bg-destructive')}
                  style={{ width: `${checkIn.compliance_nutrition}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Client notes */}
      {checkIn.notes && (
        <div className="bg-secondary/30 rounded-xl p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Client Notes</p>
          <p className="text-sm leading-relaxed">{checkIn.notes}</p>
        </div>
      )}

      {/* Existing coach response */}
      {checkIn.coach_notes && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Your Response</p>
          <p className="text-sm leading-relaxed">{checkIn.coach_notes}</p>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="space-y-2">
        {/* Primary row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Send AI Feedback */}
          <button onClick={sendAI} disabled={aiSending || aiDone || feedbackSent}
            className={cn('flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-95',
              (aiDone || feedbackSent) ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 opacity-60 cursor-default'
                : 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20')}>
            {aiSending ? <Loader2 className="w-4 h-4 animate-spin" /> : (aiDone || feedbackSent) ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {aiDone || feedbackSent ? 'Feedback Sent' : 'AI Feedback'}
          </button>

          {/* Write Feedback */}
          <button onClick={() => setPanel(p => p === 'feedback' ? null : 'feedback')}
            className={cn('flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-95',
              panel === 'feedback' ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20')}>
            <MessageSquare className="w-4 h-4" /> Write Feedback
          </button>

          {/* Adjust Calories */}
          <button onClick={() => setPanel(p => p === 'calories' ? null : 'calories')} disabled={!!calResult}
            className={cn('flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-95',
              calResult ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 opacity-60 cursor-default'
                : panel === 'calories' ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                  : 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20')}>
            <Flame className="w-4 h-4" /> {calResult ? `Cal ${calResult}` : 'Calories'}
          </button>

          {/* Adjust Cardio */}
          <button onClick={() => setPanel(p => p === 'cardio' ? null : 'cardio')} disabled={!!cardioResult}
            className={cn('flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-95',
              cardioResult ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 opacity-60 cursor-default'
                : panel === 'cardio' ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20')}>
            <Footprints className="w-4 h-4" /> {cardioResult ? `Cardio ${cardioResult}` : 'Cardio'}
          </button>
        </div>

        {/* Inline sub-panels */}
        {panel === 'feedback' && (
          <div className="bg-secondary/20 rounded-xl p-3.5 border border-border">
            <FeedbackComposer checkIn={checkIn} client={client} allCIs={allCIs}
              onSent={() => { setFeedbackSent(true); setPanel(null); }} />
          </div>
        )}
        {panel === 'calories' && (
          <CaloriesPanel checkIn={checkIn} client={client}
            onDone={(r) => { setCalResult(r); setPanel(null); }} />
        )}
        {panel === 'cardio' && (
          <CardioPanel checkIn={checkIn} client={client}
            onDone={(r) => { setCardioResult(r); setPanel(null); }} />
        )}

        {/* Mark Reviewed */}
        <button onClick={onMarkReviewed} disabled={markSaving || isReviewed}
          className={cn('w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border text-sm font-semibold transition-all active:scale-95',
            isReviewed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 opacity-60 cursor-default'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20')}>
          {markSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isReviewed ? <><Check className="w-4 h-4" /> Marked as Reviewed</> : <><ClipboardCheck className="w-4 h-4" /> Mark as Reviewed</>}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main page
───────────────────────────────────────── */
export default function FastReview() {
  const [idx, setIdx] = useState(0);
  const [reviewed, setReviewed] = useState({});
  const [markSaving, setMarkSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ['checkins-fast'],
    queryFn: () => base44.entities.CheckIn.list('-date', 200),
  });

  const clientMap = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients]);

  const cisByClient = useMemo(() => {
    const map = {};
    for (const ci of checkIns) {
      if (!map[ci.client_id]) map[ci.client_id] = [];
      map[ci.client_id].push(ci);
    }
    return map;
  }, [checkIns]);

  // Only show pending (not responded) check-ins, oldest first = most urgent
  const queue = useMemo(() => {
    const seen = new Set();
    const pending = checkIns
      .filter(ci => !ci.coach_responded && !ci.coach_notes)
      .filter(ci => differenceInDays(new Date(), parseISO(ci.date)) <= 21)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return pending.filter(ci => {
      if (seen.has(ci.client_id)) return false;
      seen.add(ci.client_id);
      return true;
    });
  }, [checkIns]);

  const current = queue[idx];
  const total = queue.length;
  const progress = total > 0 ? ((Object.keys(reviewed).length) / total) * 100 : 0;

  const handleMark = async () => {
    if (!current) return;
    setMarkSaving(true);
    await base44.entities.CheckIn.update(current.id, { coach_responded: true });
    setReviewed(r => ({ ...r, [current.id]: true }));
    queryClient.invalidateQueries({ queryKey: ['checkins-fast'] });
    setMarkSaving(false);
    // Auto-advance
    if (idx < total - 1) setIdx(i => i + 1);
  };

  const goNext = () => { if (idx < total - 1) setIdx(i => i + 1); };
  const goPrev = () => { if (idx > 0) setIdx(i => i - 1); };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 p-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">All caught up! 🎉</p>
          <p className="text-sm text-muted-foreground mt-1">No pending check-ins to review</p>
        </div>
      </div>
    );
  }

  const isReviewed = !!reviewed[current?.id] || current?.coach_responded;

  return (
    <div className="max-w-xl mx-auto px-4 py-5 pb-28 space-y-4 sm:py-8">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <h1 className="text-lg font-heading font-bold">Quick Review</h1>
            <span className="text-sm font-semibold text-muted-foreground">
              {idx + 1} <span className="text-muted-foreground/50">/</span> {total}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.max(((idx) / total) * 100, 4)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Review card ── */}
      {current && (
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 fade-up">
          <ReviewCard
            key={current.id}
            checkIn={current}
            client={clientMap[current.client_id]}
            allCIs={cisByClient[current.client_id] || []}
            onMarkReviewed={handleMark}
            isReviewed={isReviewed}
            markSaving={markSaving}
          />
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="flex gap-3">
        <button
          onClick={goPrev}
          disabled={idx === 0}
          className="flex items-center gap-1.5 h-12 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground disabled:opacity-30 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>

        <button
          onClick={goNext}
          disabled={idx >= total - 1}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-30 active:scale-95 transition-all"
        >
          Next Client <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {idx >= total - 1 && (
        <p className="text-center text-xs text-muted-foreground py-1">
          Last check-in in queue — mark reviewed or go back
        </p>
      )}
    </div>
  );
}