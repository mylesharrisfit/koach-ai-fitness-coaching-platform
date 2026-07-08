import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle, ChevronDown, ChevronUp, MessageSquare, Settings, ArrowRight,
  ShieldCheck, Search, X, TrendingUp, Zap, Briefcase, Calendar,
  RefreshCw, Sparkles, Check, Flag, Clock
} from 'lucide-react';
import { parseISO, differenceInDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { averageAdherenceScore, scoreColor, calculateStreak, checkInScore } from '@/lib/adherence';
import { getAtRiskClients, SEVERITY_CONFIG, FLAG_ICONS } from '@/lib/riskEngine';
import { toast } from 'sonner';

/* ── Risk level helpers ── */
function getRiskLevel(riskScore, flagCount) {
  if (flagCount >= 3 || riskScore >= 60) return { level: 'Critical', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', border: 'border-red-200', ring: 'ring-red-100' };
  if (flagCount === 2 || riskScore >= 30) return { level: 'Moderate', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400', border: 'border-amber-200', ring: 'ring-amber-50' };
  return { level: 'Watch', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400', border: 'border-blue-100', ring: 'ring-blue-50' };
}

function getRecommendedAction(flags, lastMsgDays) {
  if (lastMsgDays === null || lastMsgDays > 5) return { icon: '💬', text: 'Send a check-in message' };
  const topFlag = flags[0];
  if (topFlag?.key === 'missed_checkin') return { icon: '📋', text: 'Request their check-in' };
  if (topFlag?.key === 'low_adherence' || topFlag?.key === 'missed_workouts') return { icon: '📞', text: 'Schedule a call' };
  if (topFlag?.key === 'mood_low' || topFlag?.key === 'negative_notes') return { icon: '💙', text: 'Personal check-in message' };
  return { icon: '📋', text: 'Review their program' };
}

/* ── AI Intervention drawer ── */
function AIInterventionPanel({ entry, client, onClose, onSend }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [message, setMessage] = useState('');

  const generate = async () => {
    setLoading(true);
    const flagSummary = entry.flags.map(f => f.label + (f.detail ? `: ${f.detail}` : '')).join(', ');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a fitness coach AI assistant. Generate an intervention plan for a client named ${client.name}.
        
Risk factors: ${flagSummary}
Goal: ${client.goal?.replace(/_/g, ' ')}
Risk score: ${entry.riskScore}/100

Respond with JSON only:
{
  "immediate_action": "1-sentence recommended immediate action",
  "message_script": "A warm, personalized 2-3 sentence message to send to the client",
  "program_adjustment": "Suggested program change (1 sentence, e.g. reduce frequency)",
  "follow_up_timeline": "When to follow up (e.g. Check back in 3 days)"
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            immediate_action: { type: 'string' },
            message_script: { type: 'string' },
            program_adjustment: { type: 'string' },
            follow_up_timeline: { type: 'string' },
          }
        }
      });
      setPlan(result);
      setMessage(result.message_script);
    } catch { toast.error('AI generation failed'); }
    setLoading(false);
  };

  return (
    <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <span className="text-xs font-bold text-purple-800 uppercase tracking-wide">AI Intervention Plan</span>
        <button onClick={onClose} className="ml-auto text-purple-400 hover:text-purple-600"><X className="w-3.5 h-3.5" /></button>
      </div>
      {!plan && (
        <button onClick={generate} disabled={loading}
          className="w-full py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-60">
          {loading ? 'Generating plan...' : '✨ Generate Personalized Plan'}
        </button>
      )}
      {plan && (
        <div className="space-y-3">
          <div className="bg-white border border-purple-100 rounded-lg p-3 space-y-2">
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide">Immediate Action</p>
            <p className="text-xs text-[#374151]">{plan.immediate_action}</p>
          </div>
          <div className="bg-white border border-purple-100 rounded-lg p-3 space-y-2">
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide">Suggested Message</p>
            <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)}
              className="w-full text-xs text-[#374151] border border-purple-100 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-purple-300" />
            <button onClick={() => onSend(message)}
              className="w-full py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700">
              Send Message
            </button>
          </div>
          <div className="bg-white border border-purple-100 rounded-lg p-3 space-y-1">
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide">Program Adjustment</p>
            <p className="text-xs text-[#374151]">{plan.program_adjustment}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-100 rounded-lg px-3 py-2">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{plan.follow_up_timeline}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Mini adherence bars ── */
function MiniAdherenceChart({ checkIns }) {
  const weeks = checkIns.slice(0, 4).reverse();
  return (
    <div className="flex items-end gap-1 h-8">
      {weeks.map((ci, i) => {
        const score = checkInScore(ci) ?? 0;
        const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
        return (
          <div key={i} className="flex-1 rounded-sm" style={{ height: `${Math.max(15, score)}%`, background: color, minHeight: 4 }} title={`Week ${i + 1}: ${score}%`} />
        );
      })}
      {weeks.length === 0 && <span className="text-[10px] text-[#9CA3AF]">No data</span>}
    </div>
  );
}

/* ── Individual client card ── */
function RiskCard({ entry, messages, onSendNudge, onResolve, selected, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { client, flags, riskScore, clientCheckIns } = entry;

  const riskInfo = getRiskLevel(riskScore, flags.length);
  const clientMsgs = messages.filter(m => m.client_id === client.id).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const lastMsg = clientMsgs[0];
  const lastMsgDays = lastMsg ? differenceInDays(new Date(), parseISO(lastMsg.created_date)) : null;
  const recommended = getRecommendedAction(flags, lastMsgDays);
  const avgScore = averageAdherenceScore(clientCheckIns, 4);
  const streak = calculateStreak(clientCheckIns);

  // Days at risk (approximate from first flag trigger)
  const firstFlagDate = clientCheckIns.length > 0 ? differenceInDays(new Date(), parseISO(clientCheckIns[clientCheckIns.length - 1].date)) : 0;

  const updateClientMutation = useMutation({
    mutationFn: ({ data }) => base44.entities.Client.update(client.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client status updated');
    }
  });

  const sendMsgMutation = useMutation({
    mutationFn: (content) => base44.entities.Message.create({ client_id: client.id, client_name: client.name, sender: 'coach', content }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['messages'] }); toast.success('Message sent!'); }
  });

  return (
    <div className={cn('bg-white rounded-2xl border overflow-hidden shadow-sm transition-all',
      riskInfo.border, selected && `ring-2 ${riskInfo.ring}`)}>
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button onClick={() => onSelect(client.id)}
            className={cn('mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center',
              selected ? 'bg-primary border-primary' : 'border-[#D1D5DB]')}>
            {selected && <Check className="w-3 h-3 text-white" />}
          </button>

          {/* Avatar with pulse dot */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #374151, #1F2937)' }}>
              {client.name?.[0]?.toUpperCase()}
            </div>
            <div className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white', riskInfo.dot,
              riskInfo.level === 'Critical' && 'animate-pulse')} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-[#111827]">{client.name}</span>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', riskInfo.color)}>
                {riskInfo.level}
              </span>
            </div>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">
              {flags.length} risk factor{flags.length !== 1 ? 's' : ''} · {avgScore !== null ? `${avgScore}% compliance` : 'No data'}
            </p>
            {/* Risk factors summary */}
            <p className="text-[11px] text-[#6B7280] mt-1 line-clamp-1">
              {flags.slice(0, 3).map(f => f.detail || f.label).join(' · ')}
            </p>
          </div>

          {/* Score + expand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <p className={cn('text-lg font-bold tabular-nums', scoreColor(avgScore ?? 0))}>{avgScore ?? '—'}%</p>
              <p className="text-[9px] text-[#9CA3AF]">adherence</p>
            </div>
            <button onClick={() => setExpanded(e => !e)} className="p-1 rounded-lg hover:bg-[#F3F4F6]">
              {expanded ? <ChevronUp className="w-4 h-4 text-[#6B7280]" /> : <ChevronDown className="w-4 h-4 text-[#6B7280]" />}
            </button>
          </div>
        </div>

        {/* Bottom row: recommended action + last contact + quick actions */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] font-semibold bg-[#F3F4F6] text-[#374151] px-2 py-1 rounded-full">
            {recommended.icon} {recommended.text}
          </span>
          {lastMsgDays !== null && (
            <span className={cn('text-[10px]', lastMsgDays > 7 ? 'text-red-500' : 'text-[#6B7280]')}>
              Last contact: {lastMsgDays === 0 ? 'Today' : `${lastMsgDays}d ago`}
            </span>
          )}
          <div className="ml-auto flex gap-1">
            <button onClick={() => onSendNudge(client.id, client.name)} title="Message"
              className="p-1.5 rounded-lg hover:bg-blue-50 text-[#6B7280] hover:text-blue-600 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => navigate(`/schedule?clientId=${client.id}`)} title="Schedule"
              className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors">
              <Calendar className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => navigate(`/client-profile?id=${client.id}`)} title="Profile"
              className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors">
              <Briefcase className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onResolve(client.id)} title="Resolve"
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-[#6B7280] hover:text-emerald-600 transition-colors">
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-[#F3F4F6] px-4 py-3 space-y-4 bg-[#F9FAFB]">
          {/* All risk flags */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">Risk Factors</p>
            <div className="space-y-1.5">
              {flags.map(f => (
                <div key={f.key} className={cn('flex items-start gap-2 px-3 py-2 rounded-lg border text-xs', SEVERITY_CONFIG[f.severity].color)}>
                  <span className="text-sm flex-shrink-0 leading-none">{FLAG_ICONS[f.icon] || '⚠️'}</span>
                  <div>
                    <p className="font-semibold">{f.label}</p>
                    {f.detail && <p className="opacity-70 text-[10px] mt-0.5">{f.detail}</p>}
                  </div>
                  <span className="ml-auto text-[9px] uppercase font-bold opacity-60">{f.severity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Last 3 check-ins + mini chart */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">Recent Adherence (4 weeks)</p>
            <MiniAdherenceChart checkIns={clientCheckIns} />
            <div className="grid grid-cols-3 gap-2 mt-2">
              {clientCheckIns.slice(0, 3).map((ci, i) => {
                const s = checkInScore(ci);
                return (
                  <div key={i} className="bg-white border border-[#E5E7EB] rounded-lg p-2">
                    <p className="text-[10px] text-[#9CA3AF]">{format(parseISO(ci.date), 'MMM d')}</p>
                    <p className={cn('text-sm font-bold', scoreColor(s ?? 0))}>{s ?? '—'}%</p>
                    {ci.compliance_training != null && <p className="text-[9px] text-[#9CA3AF]">💪 {ci.compliance_training}%</p>}
                    {ci.compliance_nutrition != null && <p className="text-[9px] text-[#9CA3AF]">🥗 {ci.compliance_nutrition}%</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Intervention */}
          <div>
            <button onClick={() => setShowAI(s => !s)}
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors">
              <Sparkles className="w-3.5 h-3.5" /> AI Suggest Intervention
            </button>
            {showAI && (
              <AIInterventionPanel entry={entry} client={client}
                onClose={() => setShowAI(false)}
                onSend={(msg) => { sendMsgMutation.mutate(msg); setShowAI(false); }} />
            )}
          </div>

          {/* Private notes */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">Private Notes</p>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add coaching notes..." className="w-full text-xs border border-[#E5E7EB] rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary bg-white" />
          </div>

          {/* Resolution options */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { updateClientMutation.mutate({ data: { lifecycle_status: 'active' } }); toast.success('Marked as Improving'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100">
              📈 Mark as Improving
            </button>
            <button onClick={() => { updateClientMutation.mutate({ data: { lifecycle_status: 'active' } }); onResolve(client.id); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100">
              <Check className="w-3 h-3" /> Mark Resolved
            </button>
            <button onClick={() => { updateClientMutation.mutate({ data: { lifecycle_status: 'at_risk' } }); toast.success('Escalated to Critical'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100">
              <Flag className="w-3 h-3" /> Escalate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Risk Breakdown Columns ── */
function RiskBreakdown({ atRisk, onFilter, activeFilter }) {
  const critical = atRisk.filter(e => e.flags.length >= 3 || e.riskScore >= 60);
  const moderate = atRisk.filter(e => (e.flags.length === 2 || (e.riskScore >= 30 && e.riskScore < 60)) && !(e.flags.length >= 3 || e.riskScore >= 60));
  const watch = atRisk.filter(e => e.flags.length === 1 && e.riskScore < 30);

  const cols = [
    { key: 'critical', label: 'Critical Risk', emoji: '🔴', desc: 'Immediate attention needed', clients: critical, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    { key: 'moderate', label: 'Moderate Risk', emoji: '🟡', desc: 'Attention this week', clients: moderate, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    { key: 'watch', label: 'Watch List', emoji: '🔵', desc: 'Keep an eye on', clients: watch, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {cols.map(col => (
        <button key={col.key} onClick={() => onFilter(activeFilter === col.key ? 'all' : col.key)}
          className={cn('p-3 rounded-xl border text-left transition-all', col.bg, col.border,
            activeFilter === col.key && 'ring-2 ring-offset-1 ring-primary/40')}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-base">{col.emoji}</span>
            <span className={cn('text-xs font-bold', col.text)}>{col.label}</span>
          </div>
          <p className="text-2xl font-bold text-[#111827] mb-1">{col.clients.length}</p>
          <p className="text-[10px] text-[#6B7280] mb-2">{col.desc}</p>
          {/* Stacked avatars */}
          <div className="flex -space-x-1.5">
            {col.clients.slice(0, 5).map((e, i) => (
              <div key={e.client.id} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #374151, #111827)', zIndex: 5 - i }}>
                {e.client.name?.[0]?.toUpperCase()}
              </div>
            ))}
            {col.clients.length > 5 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-[#F3F4F6] flex items-center justify-center text-[8px] font-bold text-[#6B7280]">
                +{col.clients.length - 5}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

/* ── Bulk Action Bar ── */
function BulkActionBar({ selectedIds, clients, atRisk, onClear }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const sendBulkMutation = useMutation({
    mutationFn: ({ ids, message }) =>
      Promise.all(ids.map(id => {
        const c = clients.find(c => c.id === id);
        return base44.entities.Message.create({ client_id: id, client_name: c?.name, sender: 'coach', content: message });
      })),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['messages'] }); toast.success(`Message sent to ${selectedIds.length} clients`); onClear(); }
  });

  const exportCSV = () => {
    const selected = atRisk.filter(e => selectedIds.includes(e.client.id));
    const rows = selected.map(e => [
      e.client.name, e.riskScore, e.flags.length,
      e.flags.map(f => f.label).join(' | '),
      e.lastCheckInDate || 'Never'
    ]);
    const csv = [['Name', 'Risk Score', 'Flag Count', 'Flags', 'Last Check-in'], ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'at-risk-clients.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#111827] rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl border border-white/10">
      <span className="text-xs font-bold text-white">{selectedIds.length} selected</span>
      <div className="w-px h-4 bg-white/20" />
      <button onClick={() => {
        const msg = "Hey, I wanted to check in with you personally. Let's connect this week 💪";
        sendBulkMutation.mutate({ ids: selectedIds, message: msg });
      }} className="flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-blue-200">
        <MessageSquare className="w-3.5 h-3.5" /> Bulk Message
      </button>
      <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-semibold text-[#9CA3AF] hover:text-white">
        Export CSV
      </button>
      <button onClick={onClear} className="text-xs text-[#6B7280] hover:text-white"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

/* ── Main page ── */
export default function AtRiskClients() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list('name') });
  const { data: checkIns = [], isLoading, refetch } = useQuery({ queryKey: ['checkins-risk'], queryFn: () => base44.entities.CheckIn.list('-date', 400) });
  const { data: messages = [] } = useQuery({ queryKey: ['messages'], queryFn: () => base44.entities.Message.list('-created_date', 500) });

  const atRisk = useMemo(() => getAtRiskClients(clients, checkIns), [clients, checkIns]);

  const sorted = useMemo(() => [...atRisk].sort((a, b) => b.riskScore - a.riskScore), [atRisk]);

  const filtered = useMemo(() => {
    let list = sorted;
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(e => e.client.name?.toLowerCase().includes(q)); }
    if (riskFilter === 'critical') list = list.filter(e => e.flags.length >= 3 || e.riskScore >= 60);
    if (riskFilter === 'moderate') list = list.filter(e => (e.flags.length === 2 || (e.riskScore >= 30 && e.riskScore < 60)) && !(e.flags.length >= 3 || e.riskScore >= 60));
    if (riskFilter === 'watch') list = list.filter(e => e.flags.length === 1 && e.riskScore < 30);
    return list;
  }, [sorted, search, riskFilter]);

  // Stat cards
  const stats = useMemo(() => {
    const now = new Date();
    const newlyFlagged = atRisk.filter(e => {
      const ci = e.clientCheckIns[0];
      return ci && differenceInDays(now, parseISO(ci.date)) <= 7;
    }).length;
    const resolved = clients.filter(c => c.lifecycle_status === 'active' && c.status === 'active').length;
    return {
      total: atRisk.length,
      newlyFlagged,
      successRate: atRisk.length > 0 ? Math.round((resolved / (resolved + atRisk.length)) * 100) : 100,
      avgDaysAtRisk: atRisk.length > 0 ? Math.round(atRisk.reduce((s, e) => {
        const ci = e.clientCheckIns[e.clientCheckIns.length - 1];
        return s + (ci ? differenceInDays(now, parseISO(ci.date)) : 0);
      }, 0) / atRisk.length) : 0,
    };
  }, [atRisk, clients]);

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleNudge = (clientId, clientName) => navigate(`/messages?clientId=${clientId}&clientName=${clientName}`);
  const handleResolve = (clientId) => { toast.success('Client marked as resolved'); };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* ── Header ── */}
      <div className="rounded-2xl p-4 sm:p-5 mb-5 flex items-center justify-between gap-3"
        style={{ background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <h1 className="text-xl font-bold text-white">At-Risk Clients</h1>
          <p className="text-xs mt-0.5 text-white/50">{atRisk.length} client{atRisk.length !== 1 ? 's' : ''} need{atRisk.length === 1 ? 's' : ''} attention</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <RefreshCw className="w-4 h-4 text-white/70" />
          </button>
          <button onClick={() => setShowSettings(s => !s)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <Settings className="w-4 h-4 text-white/70" />
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-red-100 p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.total}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">Total At-Risk</p>
        </div>
        <div className="bg-white rounded-xl border border-orange-100 p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <Zap className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.newlyFlagged}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">Newly Flagged (7d)</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.successRate}%</p>
          <p className="text-xs text-[#6B7280] mt-0.5">Intervention Success</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.avgDaysAtRisk}d</p>
          <p className="text-xs text-[#6B7280] mt-0.5">Avg Days At-Risk</p>
        </div>
      </div>

      {/* ── Risk Breakdown ── */}
      {atRisk.length > 0 && <RiskBreakdown atRisk={atRisk} onFilter={setRiskFilter} activeFilter={riskFilter} />}

      {/* ── Search ── */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-[#9CA3AF]" /></button>}
      </div>

      {/* ── Client List ── */}
      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <ShieldCheck className="w-14 h-14 text-emerald-400 opacity-60" />
          <p className="font-semibold text-sm">{search || riskFilter !== 'all' ? 'No clients match this filter' : 'All clients are on track! 🎉'}</p>
          <p className="text-xs text-[#9CA3AF]">No risk flags detected based on recent check-ins.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <RiskCard key={entry.client.id} entry={entry} messages={messages}
              onSendNudge={handleNudge} onResolve={handleResolve}
              selected={selectedIds.includes(entry.client.id)} onSelect={toggleSelect} />
          ))}
        </div>
      )}

      {/* ── Bulk action bar ── */}
      {selectedIds.length > 0 && (
        <BulkActionBar selectedIds={selectedIds} clients={clients} atRisk={atRisk} onClear={() => setSelectedIds([])} />
      )}

      <div className="mt-6 pt-5 border-t border-[#E7EAF3]">
        <Link to="/checkin-review">
          <Button variant="outline" className="w-full gap-2">
            View Check-in Dashboard <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        </Link>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowSettings(false)}>
          <div className="w-72 h-full bg-white shadow-2xl p-5 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#111827]">Risk Settings</h3>
              <button onClick={() => setShowSettings(false)}><X className="w-4 h-4 text-[#6B7280]" /></button>
            </div>
            <div className="space-y-4 text-sm">
              <p className="text-xs text-[#9CA3AF]">Risk factors and thresholds are automatically calculated. Customization coming soon.</p>
              {[
                { label: 'Missed check-in threshold', value: '14 days' },
                { label: 'Low adherence threshold', value: '< 70%' },
                { label: 'Critical: flag count', value: '3+ factors' },
                { label: 'Moderate: flag count', value: '2 factors' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-[#F3F4F6]">
                  <span className="text-xs text-[#374151]">{label}</span>
                  <span className="text-xs font-semibold text-[#111827]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}