import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO, format } from 'date-fns';
import {
  ChevronDown, ChevronUp, MessageSquare, User, Calendar, CheckSquare,
  Sparkles, ArrowUp, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { averageAdherenceScore, checkInScore } from '@/lib/adherence';
import { SEVERITY_CONFIG, FLAG_ICONS } from '@/lib/riskEngine';
import { getRiskLevel } from './RiskBreakdown';
import { toast } from 'sonner';

const RISK_LEVEL_STYLES = {
  critical: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200', border: 'border-red-200 ring-1 ring-red-100', label: 'Critical' },
  moderate: { dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', border: 'border-amber-200', label: 'Moderate' },
  watch:    { dot: 'bg-blue-400',  badge: 'bg-blue-50 text-blue-700 border-blue-200',   border: 'border-blue-200',  label: 'Watch' },
};

const RECOMMENDED_ACTIONS = {
  missed_checkin: '📋 Send check-in reminder',
  low_adherence:  '📞 Schedule a call',
  low_nutrition:  '🥗 Review nutrition plan',
  missed_workouts:'💪 Adjust workout program',
  negative_notes: '💬 Personal check-in message',
  mood_low:       '❤️ Wellness check-in',
  declining_trend:'📊 Review program difficulty',
  no_progress:    '⚖️ Reassess goals & plan',
  low_sleep:      '😴 Sleep coaching session',
};

export default function RiskClientCard({ entry, lastMessages, selected, onToggleSelect, onResolve }) {
  const { client, flags, riskScore, clientCheckIns } = entry;
  const [expanded, setExpanded] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [coachNote, setCoachNote] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const riskLevel = getRiskLevel(flags.length);
  const styles = RISK_LEVEL_STYLES[riskLevel];

  const avgScore = averageAdherenceScore(clientCheckIns, 3);
  const lastMsg = lastMessages.filter(m => m.client_id === client.id)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
  const daysNoMsg = lastMsg ? differenceInDays(new Date(), parseISO(lastMsg.created_date)) : null;
  const lastCheckIn = clientCheckIns[0];
  const daysNoCheckIn = lastCheckIn ? differenceInDays(new Date(), parseISO(lastCheckIn.date)) : null;

  const topFlag = flags[0];
  const recommendedAction = RECOMMENDED_ACTIONS[topFlag?.key] || '💬 Check in with client';

  const messageMutation = useMutation({
    mutationFn: (content) => base44.entities.Message.create({ client_id: client.id, client_name: client.name, sender: 'coach', content }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['messages'] }); toast.success('Message sent!'); },
  });

  const updateClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(client.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); },
  });

  const handleAISuggest = async () => {
    setLoadingAI(true);
    try {
      const factStr = flags.map(f => f.label + (f.detail ? ': ' + f.detail : '')).join('; ');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a fitness coach AI advisor. Client "${client.name}" has these risk factors: ${factStr}. 
Their avg adherence is ${avgScore ?? 'unknown'}%. Goal: ${client.goal?.replace(/_/g, ' ') || 'general fitness'}.

Generate a personalized intervention plan as JSON:
{
  "immediate_action": "specific action to take today (1 sentence)",
  "message_script": "personalized message to send the client (2-3 sentences, warm and motivating)",
  "program_adjustment": "program change to consider (1 sentence or null)",
  "followup": "follow-up timeline and action (1 sentence)"
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            immediate_action: { type: 'string' },
            message_script: { type: 'string' },
            program_adjustment: { type: 'string' },
            followup: { type: 'string' },
          }
        }
      });
      setAiSuggestion(result);
    } catch { toast.error('AI suggestion failed'); }
    setLoadingAI(false);
  };

  const handleSendAIMessage = () => {
    if (!aiSuggestion?.message_script) return;
    messageMutation.mutate(aiSuggestion.message_script);
    setAiSuggestion(null);
  };

  const handleMarkImproving = () => {
    updateClientMutation.mutate({ lifecycle_status: 'active' });
    toast.success(`${client.name} marked as improving`);
    onResolve(client.id);
  };

  const handleMarkResolved = () => {
    updateClientMutation.mutate({ lifecycle_status: 'active' });
    toast.success(`${client.name} resolved from at-risk`);
    onResolve(client.id);
  };

  const handleEscalate = () => {
    updateClientMutation.mutate({ lifecycle_status: 'at_risk', lifecycle_notes: 'Escalated: ' + flags.map(f => f.label).join(', ') });
    toast.warning(`${client.name} escalated to critical`);
  };

  return (
    <div className={cn('bg-white border-2 rounded-xl overflow-hidden transition-all', styles.border)}>
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <input type="checkbox" checked={selected} onChange={onToggleSelect}
            className="mt-1 w-4 h-4 rounded accent-primary flex-shrink-0" onClick={e => e.stopPropagation()} />

          {/* Avatar with pulsing dot */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #374151, #1F2937)' }}>
              {client.name?.[0]?.toUpperCase()}
            </div>
            <div className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white animate-pulse', styles.dot)} />
          </div>

          {/* Client info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-[#111827]">{client.name}</span>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', styles.badge)}>
                {styles.label}
              </span>
            </div>
            <p className="text-[10px] text-[#6B7280] mt-0.5">
              {client.goal?.replace(/_/g, ' ') || 'General fitness'}
              {daysNoCheckIn !== null && ` · No check-in: ${daysNoCheckIn}d`}
            </p>
            {/* Risk factors summary */}
            <p className="text-[10px] text-[#374151] mt-1 leading-relaxed">
              {flags.slice(0, 3).map(f => f.detail || f.label).join(' · ')}
              {flags.length > 3 && ` · +${flags.length - 3} more`}
            </p>
          </div>

          {/* Score + expand */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {avgScore !== null && (
              <span className={cn('text-sm font-bold', avgScore >= 80 ? 'text-emerald-600' : avgScore >= 50 ? 'text-amber-600' : 'text-red-500')}>
                {avgScore}%
              </span>
            )}
            <button onClick={() => setExpanded(e => !e)}
              className="p-1 rounded hover:bg-[#F3F4F6] transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4 text-[#6B7280]" /> : <ChevronDown className="w-4 h-4 text-[#6B7280]" />}
            </button>
          </div>
        </div>

        {/* Info row */}
        <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-[#6B7280]">
          {daysNoMsg !== null && (
            <span className={cn(daysNoMsg > 7 ? 'text-red-500' : '')}>
              Last contact: {daysNoMsg}d ago
            </span>
          )}
          {client.lifecycle_status === 'at_risk' && (
            <span className="text-orange-500">Manually flagged</span>
          )}
        </div>

        {/* Recommended action + quick buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-[10px] bg-[#F3F4F6] px-2 py-1 rounded-full text-[#374151] font-medium flex-shrink-0">
            {recommendedAction}
          </span>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          <button onClick={() => navigate(`/messages?clientId=${client.id}`)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100">
            <MessageSquare className="w-3 h-3" /> Message
          </button>
          <button onClick={() => navigate(`/schedule?clientId=${client.id}`)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]">
            <Calendar className="w-3 h-3" /> Schedule Call
          </button>
          <button onClick={() => navigate(`/client-profile?clientId=${client.id}`)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]">
            <User className="w-3 h-3" /> Profile
          </button>
          <button onClick={handleMarkResolved}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
            <CheckSquare className="w-3 h-3" /> Resolve
          </button>
          <button onClick={handleAISuggest} disabled={loadingAI}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50 ml-auto">
            {loadingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            ✨ AI Suggest
          </button>
        </div>

        {/* AI Suggestion panel */}
        {aiSuggestion && (
          <div className="mt-3 p-3 rounded-xl border border-purple-200 bg-purple-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">AI Intervention Plan</span>
              <button onClick={() => setAiSuggestion(null)} className="text-[10px] text-purple-400 hover:text-purple-600">✕</button>
            </div>
            <div className="space-y-1.5 text-[10px] text-[#374151]">
              <div><span className="font-semibold">Immediate:</span> {aiSuggestion.immediate_action}</div>
              {aiSuggestion.program_adjustment && <div><span className="font-semibold">Program:</span> {aiSuggestion.program_adjustment}</div>}
              <div><span className="font-semibold">Follow-up:</span> {aiSuggestion.followup}</div>
            </div>
            <div className="border border-purple-200 rounded-lg p-2 bg-white">
              <p className="text-[10px] font-semibold text-purple-600 mb-1">Suggested Message:</p>
              <textarea defaultValue={aiSuggestion.message_script} rows={2}
                className="w-full text-[10px] resize-none focus:outline-none bg-transparent text-[#374151]"
                onChange={e => setAiSuggestion({ ...aiSuggestion, message_script: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSendAIMessage}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold bg-purple-600 text-white hover:bg-purple-700">
                Send Message
              </button>
              <button onClick={() => setAiSuggestion(null)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-purple-200 text-purple-700">
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#F3F4F6] px-4 pb-4 pt-3 space-y-4 bg-[#FAFAFA]">
          {/* All risk flags */}
          <div>
            <p className="text-[10px] font-bold text-[#374151] uppercase tracking-wide mb-2">Risk Factors</p>
            <div className="space-y-1.5">
              {flags.map(f => (
                <div key={f.key} className={cn('flex items-start gap-2 px-3 py-2 rounded-lg border text-[10px]', SEVERITY_CONFIG[f.severity].color)}>
                  <span className="flex-shrink-0">{FLAG_ICONS[f.icon] || '⚠️'}</span>
                  <div><span className="font-semibold">{f.label}</span>{f.detail && <span className="ml-1 opacity-70">— {f.detail}</span>}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent check-ins */}
          {clientCheckIns.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#374151] uppercase tracking-wide mb-2">Recent Check-ins</p>
              <div className="space-y-1.5">
                {clientCheckIns.slice(0, 3).map((ci, i) => {
                  const s = checkInScore(ci);
                  return (
                    <div key={i} className="flex items-center gap-2 text-[10px] bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5">
                      <span className="text-[#9CA3AF] w-16 flex-shrink-0">{format(parseISO(ci.date), 'MMM d')}</span>
                      <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s ?? 0}%`, background: s >= 80 ? '#10B981' : s >= 50 ? '#F59E0B' : '#EF4444' }} />
                      </div>
                      <span className="font-semibold w-8 text-right">{s ?? '—'}{s !== null ? '%' : ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adherence mini chart */}
          {clientCheckIns.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#374151] uppercase tracking-wide mb-2">4-Week Trend</p>
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-3">
                <MiniAdherenceChart checkIns={clientCheckIns} />
              </div>
            </div>
          )}

          {/* Coach note */}
          <div>
            <p className="text-[10px] font-bold text-[#374151] uppercase tracking-wide mb-1.5">Private Notes</p>
            <textarea value={coachNote} onChange={e => setCoachNote(e.target.value)} rows={2}
              placeholder="Add a private coaching note..."
              className="w-full text-xs border border-[#E5E7EB] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary bg-white" />
          </div>

          {/* Resolution options */}
          <div>
            <p className="text-[10px] font-bold text-[#374151] uppercase tracking-wide mb-2">Resolution</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleMarkImproving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                <ArrowUp className="w-3 h-3" /> Mark as Improving
              </button>
              <button onClick={handleMarkResolved}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100">
                ✓ Mark as Resolved
              </button>
              <button onClick={handleEscalate}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100">
                🚨 Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniAdherenceChart({ checkIns }) {
  const recent = checkIns.slice(0, 4).reverse();
  if (!recent.length) return null;
  return (
    <div className="flex items-end gap-1 h-10">
      {recent.map((ci, i) => {
        const score = checkInScore(ci) ?? 0;
        const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t" style={{ height: `${Math.max(4, score * 0.34)}px`, background: color }} />
            <span className="text-[8px] text-[#9CA3AF]">W{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}