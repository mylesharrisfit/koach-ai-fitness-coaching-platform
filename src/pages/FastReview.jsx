import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInDays, parseISO, format } from 'date-fns';
import {
  ChevronLeft, ChevronRight, CheckCircle2, Sparkles, MessageSquare,
  Flame, Footprints, Check, Loader2, Send, Moon, Zap,
  TrendingDown, TrendingUp, Minus, BookOpen, ChevronDown,
  ClipboardCheck, ChevronUp, AlertTriangle, X, Play, Wind,
  Brain, Camera, ArrowRight, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { compositeAdherenceScore, scoreColor } from '@/lib/adherence';
import { evaluateClientRisk } from '@/lib/riskEngine';
import { generateRecommendations, PRIORITY_STYLES, CATEGORY_ICONS } from '@/lib/decisionEngine';
import { applyRecommendation, getConfirmText } from '@/lib/applyRecommendation';

/* ─── Constants ─── */
const MOOD_EMOJI = { great: '😄', good: '🙂', okay: '😐', tired: '😴', stressed: '😰' };

const TEMPLATES = [
  { label: 'Great Check-in', text: "Awesome check-in this week! Your consistency is really showing. Keep up the great work and let's build on this momentum! 💪" },
  { label: 'Motivation Boost', text: "Just wanted to say I'm proud of the effort you've been putting in. Some weeks are harder than others — keep showing up and the results will follow 🔥" },
  { label: 'Nutrition Reminder', text: "Quick reminder to stay on track with your nutrition targets this week. Even 80% compliance makes a huge difference over time. You've got this!" },
  { label: 'Missed Check-in', text: "Hey, I noticed you missed your check-in this week. Everything okay? Let me know if anything came up — I'm here to support you!" },
];

/* ─── Helpers ─── */
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

function buildQueue(checkIns, clients) {
  const cisByClient = {};
  for (const ci of checkIns) {
    if (!cisByClient[ci.client_id]) cisByClient[ci.client_id] = [];
    cisByClient[ci.client_id].push(ci);
  }
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));
  const seen = new Set();
  const items = [];

  for (const ci of checkIns) {
    if (seen.has(ci.client_id)) continue;
    seen.add(ci.client_id);
    // Skip already-responded
    if (ci.coach_responded || ci.coach_notes) continue;
    const daysAgo = differenceInDays(new Date(), parseISO(ci.date));
    if (daysAgo > 21) continue;

    const client = clientMap[ci.client_id];
    const clientCIs = cisByClient[ci.client_id] || [];
    const riskEntry = client ? evaluateClientRisk(client, checkIns) : null;
    const riskScore = riskEntry?.riskScore || 0;
    const isOverdue = daysAgo > 7;

    // Tier 0 = at-risk, Tier 1 = overdue, Tier 2 = newest (recent first)
    let tier = 2;
    if (riskScore >= 40) tier = 0;
    else if (isOverdue) tier = 1;

    items.push({ ci, client, clientCIs, riskScore, riskEntry, daysAgo, tier });
  }

  items.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    // Within at-risk: highest risk score first
    if (a.tier === 0) return b.riskScore - a.riskScore;
    // Within overdue: oldest first (most overdue = most urgent)
    if (a.tier === 1) return new Date(a.ci.date) - new Date(b.ci.date);
    // Within newest (tier 2): newest first
    return new Date(b.ci.date) - new Date(a.ci.date);
  });

  return items;
}

/* ─── WeightTrend mini chart ─── */
function WeightTrend({ clientCIs }) {
  const weights = clientCIs.filter(c => c.weight).slice(0, 6).reverse();
  if (weights.length < 2) return null;
  const vals = weights.map(c => c.weight);
  const min = Math.min(...vals) - 2;
  const max = Math.max(...vals) + 2;
  const range = max - min || 1;
  const W = 120, H = 36;
  const pts = vals.map((v, i) => ({
    x: (i / (vals.length - 1)) * W,
    y: H - ((v - min) / range) * H,
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const latest = vals[vals.length - 1];
  const oldest = vals[0];
  const diff = (latest - oldest).toFixed(1);
  const isDown = Number(diff) < 0;
  const isUp = Number(diff) > 0;

  return (
    <div className="flex items-center gap-3">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="flex-shrink-0">
        <path d={path} fill="none" stroke={isDown ? '#34d399' : isUp ? '#f87171' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={isDown ? '#34d399' : isUp ? '#f87171' : '#6b7280'} />
        ))}
      </svg>
      <div>
        <p className="text-xs font-bold tabular-nums">{latest} lbs</p>
        <p className={cn('text-[10px] font-bold flex items-center gap-0.5', isDown ? 'text-emerald-400' : isUp ? 'text-destructive' : 'text-muted-foreground')}>
          {isDown ? <TrendingDown className="w-3 h-3" /> : isUp ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {isUp ? '+' : ''}{diff} lbs
        </p>
      </div>
    </div>
  );
}

/* ─── Stat tile ─── */
function StatTile({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl py-3 px-2">
      <Icon className={cn('w-3.5 h-3.5', color || 'text-[#6B7280]')} />
      <span className={cn('text-base font-bold tabular-nums leading-none', color || 'text-[#1F2A44]')}>{value ?? '–'}</span>
      {sub && <span className="text-[9px] text-[#6B7280]">{sub}</span>}
      <span className="text-[9px] text-[#6B7280]">{label}</span>
    </div>
  );
}

/* ─── Compliance bar ─── */
function ComplianceBar({ label, value }) {
  if (value == null) return null;
  const color = value >= 80 ? 'bg-emerald-400' : value >= 60 ? 'bg-amber-400' : 'bg-red-400';
  const textColor = value >= 80 ? 'text-emerald-600' : value >= 60 ? 'text-amber-600' : 'text-red-500';
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-[#6B7280]">{label}</span>
        <span className={cn('text-xs font-bold', textColor)}>{value}%</span>
      </div>
      <div className="h-1.5 bg-[#E7EAF3] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/* ─── Inline recommendation ─── */
function InlineRec({ rec, checkIn, client }) {
  const [stage, setStage] = useState('idle'); // idle | confirm | applying | done
  const [successMsg, setSuccessMsg] = useState('');
  const styles = PRIORITY_STYLES[rec.priority];
  const confirmText = getConfirmText(rec);

  const handleApplyClick = () => { if (stage === 'idle') setStage('confirm'); };
  const handleCancel = () => setStage('idle');

  const handleConfirm = async () => {
    setStage('applying');
    try {
      const msg = await applyRecommendation(rec, checkIn, client);
      setSuccessMsg(msg);
      setStage('done');
      toast.success(msg);
    } catch (err) {
      toast.error(err.message);
      setStage('idle');
    }
  };

  return (
    <div className={cn('rounded-xl border transition-all', stage === 'done' ? 'opacity-50 bg-[#F6F7FB] border-[#E7EAF3]' : 'bg-white border-[#E7EAF3] hover:border-blue-200', stage === 'confirm' && 'border-blue-200')}>
      {/* Main row */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', styles.dot)} />
        <span className="text-sm flex-shrink-0">{CATEGORY_ICONS[rec.category]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#1F2A44] leading-tight">{rec.title}</p>
          <p className="text-[11px] text-[#6B7280] leading-tight mt-0.5 line-clamp-1">{rec.reason}</p>
        </div>
        {stage === 'idle' && (
          <button onClick={handleApplyClick}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border bg-[#EEF4FF] border-blue-200 text-primary hover:bg-blue-100 active:scale-95 transition-all whitespace-nowrap">
            <Zap className="w-3 h-3" />{rec.actionLabel}
          </button>
        )}
        {stage === 'applying' && <Loader2 className="w-4 h-4 animate-spin text-[#6B7280] flex-shrink-0" />}
        {stage === 'done' && (
          <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <Check className="w-3 h-3" /> Done
          </span>
        )}
        {stage === 'confirm' && (
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={handleConfirm}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold active:scale-95">
              <Check className="w-3 h-3" /> Yes
            </button>
            <button onClick={handleCancel}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#F6F7FB] border border-[#E7EAF3] text-[#6B7280] active:scale-95">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      {/* Confirm detail */}
      {stage === 'confirm' && (
        <div className="px-3 pb-2.5 fade-up">
          <div className="flex items-start gap-1.5 bg-[#F6F7FB] border border-[#E7EAF3] rounded-lg px-2.5 py-2">
            <AlertCircle className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#1F2A44] leading-snug">{confirmText}</p>
          </div>
          {rec.action === 'message' && rec.actionData?.content && (
            <p className="mt-1.5 text-[10px] text-[#6B7280] italic border-l-2 border-blue-200 pl-2 line-clamp-2">
              "{rec.actionData.content}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Feedback composer ─── */
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
      base44.entities.Message.create({ client_id: checkIn.client_id, client_name: checkIn.client_name, sender: 'coach', content: text.trim(), tag: 'check_in', is_read: false }),
    ]);
    setSending(false);
    toast.success('Feedback sent!');
    onSent();
  };

  return (
    <div className="space-y-2.5 fade-up">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <button onClick={() => setShowTemplates(s => !s)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E7EAF3] bg-white text-xs font-medium text-[#6B7280] hover:text-[#1F2A44]">
            <BookOpen className="w-3 h-3" /> Templates <ChevronDown className="w-3 h-3" />
          </button>
          {showTemplates && (
            <div className="absolute left-0 top-9 z-30 bg-white border border-[#E7EAF3] rounded-xl shadow-lg p-2 w-64 max-h-56 overflow-y-auto">
              {TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => { setText(t.text); setShowTemplates(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F6F7FB] transition-colors">
                  <p className="text-xs font-medium text-[#1F2A44]">{t.label}</p>
                  <p className="text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">{t.text}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={generateAI} disabled={aiLoading}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-blue-200 bg-[#EEF4FF] text-xs font-medium text-primary hover:bg-blue-100 disabled:opacity-60">
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {aiLoading ? 'Generating…' : 'AI Draft'}
        </button>
      </div>
      <Textarea value={text} onChange={e => setText(e.target.value)}
        placeholder="Write your coaching response..." className="text-sm resize-none bg-white border-[#E7EAF3]" rows={4} autoFocus />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#6B7280]">{text.length} chars</span>
        <button onClick={send} disabled={sending || !text.trim()}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition-all">
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Send
        </button>
      </div>
    </div>
  );
}

/* ─── Calories panel ─── */
function CaloriesPanel({ checkIn, client, onDone }) {
  const [saving, setSaving] = useState(false);
  const adjust = async (delta) => {
    if (!client?.assigned_nutrition_id) { toast.error('No nutrition plan assigned'); return; }
    setSaving(true);
    const plans = await base44.entities.NutritionPlan.filter({ id: client.assigned_nutrition_id });
    const plan = plans[0];
    if (plan) {
      const newCals = Math.max(1000, (plan.calories || 2000) + delta);
      await Promise.all([
        base44.entities.NutritionPlan.update(plan.id, { calories: newCals }),
        base44.entities.Message.create({ client_id: checkIn.client_id, client_name: checkIn.client_name, sender: 'coach', content: `Your daily calorie target has been updated to ${newCals} kcal (${delta > 0 ? '+' : ''}${delta} adjustment).`, tag: 'nutrition', is_read: false }),
      ]);
      toast.success(`Calories → ${newCals} kcal`);
      onDone(`${delta > 0 ? '+' : ''}${delta} kcal`);
    }
    setSaving(false);
  };
  return (
    <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl space-y-2 fade-up">
      <p className="text-xs font-semibold text-orange-600">Adjust daily calories</p>
      <div className="grid grid-cols-4 gap-2">
        {[[-250, '−250'], [-150, '−150'], [+150, '+150'], [+250, '+250']].map(([d, l]) => (
          <button key={d} onClick={() => adjust(d)} disabled={saving}
            className={cn('py-2 rounded-lg text-xs font-bold border active:scale-95 transition-all',
              d < 0 ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100'
                    : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100')}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : l}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Cardio panel ─── */
function CardioPanel({ checkIn, onDone }) {
  const [saving, setSaving] = useState(false);
  const adjust = async (dir) => {
    setSaving(true);
    const msg = dir === 'up'
      ? 'Your cardio has been increased — add 1 extra session or 20 min to your current sessions this week.'
      : 'Your cardio has been reduced — drop 1 session or reduce duration by 15–20 min this week.';
    await Promise.all([
      base44.entities.CheckIn.update(checkIn.id, { coach_notes: (checkIn.coach_notes ? checkIn.coach_notes + '\n' : '') + '[Cardio] ' + msg }),
      base44.entities.Message.create({ client_id: checkIn.client_id, client_name: checkIn.client_name, sender: 'coach', content: msg, tag: 'training', is_read: false }),
    ]);
    toast.success(`Cardio ${dir === 'up' ? 'increased' : 'reduced'}`);
    onDone(dir === 'up' ? '+1 session' : '−1 session');
    setSaving(false);
  };
  return (
    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2 fade-up">
      <p className="text-xs font-semibold text-blue-600">Adjust cardio</p>
      <div className="flex gap-2">
        <button onClick={() => adjust('up')} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold border bg-white border-blue-200 text-blue-600 hover:bg-blue-50 active:scale-95">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ChevronUp className="w-3.5 h-3.5" /> Increase</>}
        </button>
        <button onClick={() => adjust('down')} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold border bg-white border-[#E7EAF3] text-[#6B7280] hover:bg-[#F6F7FB] active:scale-95">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ChevronDown className="w-3.5 h-3.5" /> Decrease</>}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main client review card
───────────────────────────────────────── */
function ClientCard({ item, onMarkReviewed, isReviewed, markSaving }) {
  const { ci: checkIn, client, clientCIs, riskEntry, daysAgo, tier } = item;
  const [panel, setPanel] = useState(null);
  const [calResult, setCalResult] = useState(null);
  const [cardioResult, setCardioResult] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(!!checkIn.coach_responded || !!checkIn.coach_notes);
  const [aiSending, setAiSending] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);

  const avgScore = compositeAdherenceScore(clientCIs);
  const recommendations = useMemo(() => generateRecommendations(checkIn, client, clientCIs), [checkIn, client, clientCIs]);

  const tierConfig = tier === 0
    ? { text: 'At Risk', bg: 'bg-red-50', border: 'border-red-100', text_color: 'text-red-500' }
    : tier === 1
    ? { text: 'Overdue', bg: 'bg-amber-50', border: 'border-amber-100', text_color: 'text-amber-600' }
    : null;

  const sendAI = async () => {
    if (aiSending || aiDone || feedbackSent) return;
    setAiSending(true);
    const result = await base44.integrations.Core.InvokeLLM({ prompt: buildAIPrompt(client, checkIn, clientCIs) });
    await Promise.all([
      base44.entities.CheckIn.update(checkIn.id, { coach_notes: result, coach_responded: true }),
      base44.entities.Message.create({ client_id: checkIn.client_id, client_name: checkIn.client_name, sender: 'coach', content: result, tag: 'check_in', is_read: false }),
    ]);
    setAiDone(true);
    setFeedbackSent(true);
    setAiSending(false);
    toast.success('AI feedback sent! ✨');
  };

  const sleepColor = !checkIn.sleep_hours ? 'text-[#6B7280]' : checkIn.sleep_hours >= 7 ? 'text-emerald-600' : checkIn.sleep_hours >= 6 ? 'text-amber-600' : 'text-red-500';
  const energyColor = !checkIn.energy_level ? 'text-[#6B7280]' : checkIn.energy_level >= 4 ? 'text-emerald-600' : checkIn.energy_level >= 2 ? 'text-amber-600' : 'text-red-500';
  const stressColor = !checkIn.stress_level ? 'text-[#6B7280]' : checkIn.stress_level <= 2 ? 'text-emerald-600' : checkIn.stress_level <= 3 ? 'text-amber-600' : 'text-red-500';
  const photos = checkIn.photo_urls || [];

  return (
    <div className="flex flex-col gap-4">

      {/* ── Client header ── */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
          {(client?.name || checkIn.client_name || '?')[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-heading font-bold text-xl text-[#1F2A44] leading-tight">{client?.name || checkIn.client_name}</p>
            {tierConfig && (
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', tierConfig.bg, tierConfig.border, tierConfig.text_color)}>
                {tierConfig.text}
              </span>
            )}
            {(feedbackSent || isReviewed) && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <Check className="w-2.5 h-2.5" /> Reviewed
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5 flex items-center gap-1.5">
            {format(parseISO(checkIn.date), 'MMM d, yyyy')}
            {daysAgo > 0 && <span className={cn(daysAgo > 7 ? 'text-red-500' : daysAgo > 3 ? 'text-amber-600' : '')}> · {daysAgo}d ago</span>}
            {checkIn.mood && <span className="ml-0.5">{MOOD_EMOJI[checkIn.mood]}</span>}
          </p>
        </div>
      </div>

      {/* ── Risk flags ── */}
      {riskEntry?.flags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {riskEntry.flags.slice(0, 4).map(f => (
            <span key={f.key} className="flex items-center gap-1 text-[10px] font-medium text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-2.5 h-2.5" />{f.label}
            </span>
          ))}
        </div>
      )}

      {/* ── Weight trend ── */}
      {clientCIs.filter(c => c.weight).length >= 2 && (
        <div className="bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Weight Trend</p>
            <WeightTrend clientCIs={clientCIs} />
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#6B7280]">Adherence</p>
            <p className={cn('text-2xl font-bold tabular-nums', scoreColor(avgScore))}>{avgScore ?? '–'}<span className="text-sm font-normal text-[#6B7280]">%</span></p>
          </div>
        </div>
      )}

      {/* ── 5 stat tiles ── */}
      <div className="grid grid-cols-5 gap-2">
        <StatTile icon={Moon} label="Sleep" value={checkIn.sleep_hours} sub="hrs" color={sleepColor} />
        <StatTile icon={Zap} label="Energy" value={checkIn.energy_level} sub="/10" color={energyColor} />
        <StatTile icon={Brain} label="Stress" value={checkIn.stress_level} sub="/10" color={stressColor} />
        <div className="col-span-2 flex flex-col justify-center bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl py-3 px-3 gap-2">
          <ComplianceBar label="Training" value={checkIn.compliance_training} />
          <ComplianceBar label="Nutrition" value={checkIn.compliance_nutrition} />
        </div>
      </div>

      {/* ── Photos ── */}
      {photos.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Camera className="w-3 h-3" /> Progress Photos ({photos.length})
          </p>
          <div className="relative">
            <a href={photos[photoIdx]} target="_blank" rel="noreferrer">
              <img src={photos[photoIdx]} alt="progress" className="w-full h-52 object-cover rounded-xl border border-[#E7EAF3]" />
            </a>
            {photos.length > 1 && (
              <div className="flex gap-1.5 mt-2 justify-center">
                {photos.map((_, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)}
                    className={cn('w-2 h-2 rounded-full transition-all', i === photoIdx ? 'bg-primary' : 'bg-[#E7EAF3]')} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Client notes ── */}
      {checkIn.notes && (
        <div className="bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl p-3">
          <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Client Notes</p>
          <p className="text-sm text-[#1F2A44] leading-relaxed">{checkIn.notes}</p>
        </div>
      )}

      {/* ── Existing coach response ── */}
      {checkIn.coach_notes && (
        <div className="bg-[#EEF4FF] border border-blue-100 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1">Your Response</p>
          <p className="text-sm text-[#1F2A44] leading-relaxed">{checkIn.coach_notes}</p>
        </div>
      )}

      {/* ── Recommendations ── */}
      {recommendations.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">⚡ Suggested Actions</p>
          {recommendations.slice(0, 3).map(rec => (
            <InlineRec key={rec.id} rec={rec} checkIn={checkIn} client={client} />
          ))}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          {/* AI Feedback */}
          <button onClick={sendAI} disabled={aiSending || aiDone || feedbackSent}
            className={cn('flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-95',
              (aiDone || feedbackSent)
                ? 'bg-purple-50 border-purple-100 text-purple-500 opacity-60 cursor-default'
                : 'bg-purple-50 border-purple-100 text-purple-600 hover:bg-purple-100')}>
            {aiSending ? <Loader2 className="w-4 h-4 animate-spin" /> : (aiDone || feedbackSent) ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {aiDone || feedbackSent ? 'AI Sent' : 'AI Feedback'}
          </button>

          {/* Message */}
          <button onClick={() => setPanel(p => p === 'feedback' ? null : 'feedback')}
            className={cn('flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-95',
              panel === 'feedback'
                ? 'bg-[#EEF4FF] border-blue-200 text-primary'
                : 'bg-white border-[#E7EAF3] text-primary hover:bg-[#EEF4FF] hover:border-blue-200')}>
            <MessageSquare className="w-4 h-4" /> Message
          </button>

          {/* Calories */}
          <button onClick={() => setPanel(p => p === 'calories' ? null : 'calories')} disabled={!!calResult}
            className={cn('flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-95',
              calResult
                ? 'bg-orange-50 border-orange-100 text-orange-500 opacity-60 cursor-default'
                : panel === 'calories'
                ? 'bg-orange-100 border-orange-200 text-orange-600'
                : 'bg-orange-50 border-orange-100 text-orange-600 hover:bg-orange-100')}>
            <Flame className="w-4 h-4" /> {calResult ? `Cal ${calResult}` : 'Calories'}
          </button>

          {/* Cardio */}
          <button onClick={() => setPanel(p => p === 'cardio' ? null : 'cardio')} disabled={!!cardioResult}
            className={cn('flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-95',
              cardioResult
                ? 'bg-blue-50 border-blue-100 text-blue-500 opacity-60 cursor-default'
                : panel === 'cardio'
                ? 'bg-blue-100 border-blue-200 text-blue-600'
                : 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100')}>
            <Footprints className="w-4 h-4" /> {cardioResult ? `Cardio ${cardioResult}` : 'Cardio'}
          </button>
        </div>

        {panel === 'feedback' && (
          <div className="bg-[#F6F7FB] rounded-xl p-3.5 border border-[#E7EAF3]">
            <FeedbackComposer checkIn={checkIn} client={client} allCIs={clientCIs}
              onSent={() => { setFeedbackSent(true); setPanel(null); }} />
          </div>
        )}
        {panel === 'calories' && <CaloriesPanel checkIn={checkIn} client={client} onDone={(r) => { setCalResult(r); setPanel(null); }} />}
        {panel === 'cardio' && <CardioPanel checkIn={checkIn} onDone={(r) => { setCardioResult(r); setPanel(null); }} />}

        {/* Mark Reviewed */}
        <button onClick={onMarkReviewed} disabled={markSaving || isReviewed}
          className={cn('w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border text-sm font-semibold transition-all active:scale-95',
            isReviewed
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600 cursor-default opacity-80'
              : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100')}>
          {markSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isReviewed
            ? <><Check className="w-4 h-4" /> Reviewed</>
            : <><ClipboardCheck className="w-4 h-4" /> Mark as Reviewed</>}
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
  const [reviewed, setReviewed] = useState({}); // ciId -> true for this session
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

  // Full sorted queue (unreviewed only — excludes already responded from DB)
  const queue = useMemo(() => buildQueue(checkIns, clients), [checkIns, clients]);

  // Active queue = items not yet reviewed this session
  const activeQueue = useMemo(
    () => queue.filter(item => !reviewed[item.ci.id]),
    [queue, reviewed]
  );

  const total = queue.length; // original total for progress
  const completedCount = Object.values(reviewed).filter(Boolean).length;
  const progressPct = total > 0 ? (completedCount / total) * 100 : 0;

  // Clamp idx to activeQueue bounds
  const safeIdx = Math.min(idx, Math.max(0, activeQueue.length - 1));
  const current = activeQueue[safeIdx];
  const isReviewed = false; // items in activeQueue are always unreviewed

  const handleMark = async () => {
    if (!current) return;
    setMarkSaving(true);
    await base44.entities.CheckIn.update(current.ci.id, { coach_responded: true });
    // Mark reviewed — removes from activeQueue, keeps idx pointing at next item naturally
    setReviewed(r => ({ ...r, [current.ci.id]: true }));
    queryClient.invalidateQueries({ queryKey: ['checkins-fast'] });
    setMarkSaving(false);
    // Don't advance idx — the item drops out of activeQueue, next item slides in at same idx
  };

  const goNext = () => { if (safeIdx < activeQueue.length - 1) setIdx(i => i + 1); };
  const goPrev = () => { if (safeIdx > 0) setIdx(i => i - 1); };

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (activeQueue.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 p-6">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>
      <div className="text-center">
        <p className="text-xl font-bold text-[#1F2A44]">All caught up! 🎉</p>
        <p className="text-sm text-[#6B7280] mt-1">
          {completedCount > 0 ? `Reviewed ${completedCount} client${completedCount !== 1 ? 's' : ''} today` : 'No pending check-ins — great work!'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-36 space-y-4">

      {/* ── Header ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-heading font-bold text-[#1F2A44]">Review Queue</h1>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-[#6B7280] tabular-nums">
              {safeIdx + 1} / {activeQueue.length}
            </span>
            {completedCount > 0 && (
              <p className="text-[10px] text-emerald-600 font-semibold">✓ {completedCount} done</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-[#E7EAF3] rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.max(progressPct, 3)}%` }} />
        </div>

        {/* Tier pills */}
        <div className="flex gap-2 flex-wrap">
          {activeQueue.filter(i => i.tier === 0).length > 0 && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-500 border border-red-100">
              🚨 {activeQueue.filter(i => i.tier === 0).length} at-risk
            </span>
          )}
          {activeQueue.filter(i => i.tier === 1).length > 0 && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              ⏰ {activeQueue.filter(i => i.tier === 1).length} overdue
            </span>
          )}
          {activeQueue.filter(i => i.tier === 2).length > 0 && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#F6F7FB] text-[#6B7280] border border-[#E7EAF3]">
              📋 {activeQueue.filter(i => i.tier === 2).length} pending
            </span>
          )}
        </div>
      </div>

      {/* ── Client card ── */}
      {current && (
        <div key={current.ci.id} className="bg-white border border-[#E7EAF3] rounded-2xl p-4 sm:p-5 shadow-sm fade-up">
          <ClientCard
            item={current}
            onMarkReviewed={handleMark}
            isReviewed={false}
            markSaving={markSaving}
          />
        </div>
      )}

      {/* ── Sticky bottom nav ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E7EAF3] px-4 py-3 flex gap-3 max-w-xl mx-auto">
        <button onClick={goPrev} disabled={safeIdx === 0}
          className="flex items-center gap-1.5 h-12 px-4 rounded-xl border border-[#E7EAF3] bg-white text-sm font-semibold text-[#6B7280] disabled:opacity-30 active:scale-95 transition-all flex-shrink-0">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={safeIdx >= activeQueue.length - 1 ? undefined : goNext}
          disabled={safeIdx >= activeQueue.length - 1}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold transition-all active:scale-95',
            safeIdx >= activeQueue.length - 1
              ? 'bg-emerald-50 border border-emerald-100 text-emerald-600 cursor-default'
              : 'bg-primary text-white hover:bg-primary/90'
          )}
        >
          {safeIdx >= activeQueue.length - 1
            ? <><CheckCircle2 className="w-4 h-4" /> All Done!</>
            : <><ArrowRight className="w-4 h-4" /> Next ({safeIdx + 2}/{activeQueue.length})</>
          }
        </button>
      </div>
    </div>
  );
}