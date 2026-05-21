import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle, ChevronDown, ChevronUp, ClipboardList,
  MessageSquare, Settings, ArrowRight, ShieldCheck, Search, X, TrendingUp, TrendingDown, Zap, Heart, Briefcase, Calendar
} from 'lucide-react';
import { formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { averageAdherenceScore, scoreColor, calculateStreak } from '@/lib/adherence';
import { getAtRiskClients, SEVERITY_CONFIG, FLAG_ICONS } from '@/lib/riskEngine';
import { toast } from 'sonner';

/* ── Priority & color helpers ── */
function getPriority(entry, messages = []) {
  const daysNoContact = messages.length > 0 ? Math.max(...messages.map(m => differenceInDays(new Date(), parseISO(m.created_date)))) : 999;
  if (daysNoContact > 14) return { level: 'Critical', color: 'bg-red-600 text-white', icon: '🚨' };
  if (entry.riskScore >= 60) return { level: 'High', color: 'bg-destructive text-white', icon: '⚠️' };
  if (entry.riskScore >= 40) return { level: 'Medium', color: 'bg-amber-500 text-white', icon: '⏱️' };
  return { level: 'Low', color: 'bg-emerald-600 text-white', icon: '✓' };
}

function getRiskTrend(checkIns) {
  if (checkIns.length < 2) return { icon: ChevronUp, color: 'text-gray-400', label: '→' };
  const recent = checkIns.slice(0, 7).map(c => averageAdherenceScore([c])).filter(s => s !== null);
  const older = checkIns.slice(7, 14).map(c => averageAdherenceScore([c])).filter(s => s !== null);
  if (recent.length === 0 || older.length === 0) return { icon: ChevronUp, color: 'text-gray-400', label: '→' };
  const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b) / older.length;
  if (recentAvg > olderAvg + 5) return { icon: TrendingUp, color: 'text-emerald-500', label: '↑ Improving' };
  if (recentAvg < olderAvg - 5) return { icon: TrendingDown, color: 'text-red-500', label: '↓ Declining' };
  return { icon: ChevronUp, color: 'text-gray-400', label: '→ Stable' };
}

/* ── Individual client risk card ── */
function RiskCard({ entry, lastMessages, onSendNudge }) {
  const navigate = useNavigate();
  const { client, flags, riskScore, lastCheckIn, lastCheckInDate, clientCheckIns } = entry;
  const avgScore = averageAdherenceScore(clientCheckIns, 3);

  const priority = getPriority(entry, lastMessages.filter(m => m.client_id === client.id));
  const trend = getRiskTrend(clientCheckIns);
  const TrendIcon = trend.icon;

  // Last contact
  const lastMsg = lastMessages.filter(m => m.client_id === client.id).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
  const daysNoMsg = lastMsg ? differenceInDays(new Date(), parseISO(lastMsg.created_date)) : null;
  const msgColor = daysNoMsg && daysNoMsg > 7 ? 'text-red-500' : 'text-[#6B7280]';

  const topFlag = flags[0];

  return (
    <div className={cn(
      'bg-white border rounded-2xl overflow-hidden transition-all shadow-sm',
      priority.level === 'Critical' ? 'border-red-300 ring-1 ring-red-200' : 
      riskScore >= 60 ? 'border-destructive/30' : riskScore >= 30 ? 'border-amber-500/20' : 'border-border'
    )}>
      {/* Header with priority + trend */}
      <div className="flex items-center gap-3 p-4 border-b border-[#E7EAF3] bg-gradient-to-r from-[#F9FAFB] to-white">
        <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', priority.color)}>
          {priority.icon} {priority.level}
        </span>
        <div className="flex-1" />
        <div className={cn('flex items-center gap-1.5 text-xs font-semibold', trend.color)}>
          <TrendIcon className="w-3.5 h-3.5" />
          {trend.label}
        </div>
      </div>

      {/* Main card content */}
      <div className="p-4 space-y-3">
        {/* Client info row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-sm">{client.name}</p>
            <p className="text-xs text-[#6B7280] mt-1">Goal: {client.goal?.replace(/_/g, ' ') || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p className={cn('text-lg font-bold tabular-nums', scoreColor(avgScore || 0))}>{avgScore ?? '—'}%</p>
            <p className="text-[10px] text-[#6B7280]">compliance</p>
          </div>
        </div>

        {/* Risk flags */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-[#374151] uppercase tracking-wide">Why at Risk</p>
          {flags.slice(0, 3).map(f => (
            <div key={f.key} className={cn('flex items-start gap-2 px-3 py-2 rounded-lg border text-xs', 
              SEVERITY_CONFIG[f.severity].color)}>
              <span className="text-base flex-shrink-0 leading-none">{FLAG_ICONS[f.icon] || '⚠️'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{f.label}</p>
                {f.detail && <p className="text-[11px] opacity-70 mt-0.5">{f.detail}</p>}
              </div>
            </div>
          ))}
          {flags.length > 3 && (
            <p className="text-[10px] text-[#6B7280] px-3">+{flags.length - 3} more issue{flags.length - 3 > 1 ? 's' : ''}</p>
          )}
        </div>

        {/* Last contact info */}
        {lastMsg && (
          <div className={cn('text-xs px-3 py-2 rounded-lg border border-[#E7EAF3] bg-[#F6F7FB]', msgColor)}>
            Last message: <span className="font-semibold">{daysNoMsg} days ago</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => onSendNudge(client.id, client.name)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Send Nudge
          </button>
          <button
            onClick={() => navigate(`/client-profile?id=${client.id}`)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 border border-[#E5E7EB] text-[#374151] text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5" /> Profile
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function AtRiskClients() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ['checkins-risk'],
    queryFn: () => base44.entities.CheckIn.list('-date', 400),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 500),
  });

  const sendMutation = useMutation({
    mutationFn: ({ clientIds, message }) => 
      Promise.all(clientIds.map(id => base44.entities.Message.create({
        client_id: id,
        client_name: clients.find(c => c.id === id)?.name,
        content: message,
        sender: 'coach'
      }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Message sent to at-risk clients');
    },
  });

  const atRisk = useMemo(() => getAtRiskClients(clients, checkIns), [clients, checkIns]);
  
  // Sort by priority
  const sorted = useMemo(() => {
    const list = [...atRisk];
    return list.sort((a, b) => {
      const prioA = getPriority(a, messages);
      const prioB = getPriority(b, messages);
      const prioOrder = { 'Critical': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
      return prioOrder[prioB.level] - prioOrder[prioA.level];
    });
  }, [atRisk, messages]);

  const filtered = useMemo(() => {
    let list = sorted;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.client.name?.toLowerCase().includes(q));
    }
    if (severityFilter === 'high') list = list.filter(e => e.riskScore >= 60);
    if (severityFilter === 'medium') list = list.filter(e => e.riskScore >= 30 && e.riskScore < 60);
    if (severityFilter === 'low') list = list.filter(e => e.riskScore < 30);
    return list;
  }, [sorted, search, severityFilter]);

  const counts = useMemo(() => ({
    high: atRisk.filter(e => e.riskScore >= 60).length,
    medium: atRisk.filter(e => e.riskScore >= 30 && e.riskScore < 60).length,
    low: atRisk.filter(e => e.riskScore < 30).length,
  }), [atRisk]);

  const interventionTemplates = [
    { label: 'Missed check-in reminder', message: 'Hey! I noticed you haven\'t submitted your check-in this week. Quick 2 mins to update me on how things are going? 💪' },
    { label: 'Low compliance follow-up', message: 'Your adherence dipped this week. What\'s going on? Let\'s troubleshoot together — reply with any obstacles you\'re facing.' },
    { label: 'Motivational check-in', message: 'You\'ve got this! Sometimes weeks are tougher — lean on your progress from before. Let\'s reset and get back on track together. 🔥' },
    { label: 'Schedule a call', message: 'I want to check in with you directly. Let\'s hop on a quick call this week — what time works best for you?' },
  ];

  const handleSendNudge = (clientId, clientName) => {
    navigate(`/messages?clientId=${clientId}&clientName=${clientName}`);
  };

  const handleBroadcastTemplate = (template) => {
    const atRiskIds = atRisk.map(e => e.client.id);
    if (atRiskIds.length === 0) {
      toast.error('No at-risk clients to message');
      return;
    }
    sendMutation.mutate({
      clientIds: atRiskIds,
      message: template.message,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="bg-[#111827] rounded-xl p-4 sm:p-5 mb-5">
        <h1 className="text-lg sm:text-xl font-semibold text-white">At-Risk Clients</h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {atRisk.length} client{atRisk.length !== 1 ? 's' : ''} need{atRisk.length === 1 ? 's' : ''} immediate attention
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { key: 'high', label: 'High Risk', color: counts.high > 0 ? 'text-destructive' : 'text-muted-foreground', bg: counts.high > 0 ? 'bg-[#111827]' : 'bg-white' },
          { key: 'medium', label: 'Medium Risk', color: counts.medium > 0 ? 'text-amber-400' : 'text-muted-foreground', bg: 'bg-white' },
          { key: 'low', label: 'Low Risk', color: 'text-muted-foreground', bg: 'bg-white' },
        ].map(({ key, label, color, bg }) => (
          <button
            key={key}
            onClick={() => setSeverityFilter(severityFilter === key ? 'all' : key)}
            className={cn(
              'border rounded-xl p-3 text-center transition-all active:scale-[0.97] shadow-sm',
              bg,
              severityFilter === key ? 'ring-1 ring-primary/30' : 'border-[#E7EAF3]',
              key === 'high' && counts.high > 0 ? 'border-red-400' : 'border-[#E7EAF3]'
            )}
          >
            <p className={cn('text-2xl font-bold font-heading', key === 'high' && counts.high > 0 ? 'text-red-400' : color)}>{counts[key]}</p>
            <p className={cn('text-[11px] mt-0.5', key === 'high' && counts.high > 0 ? 'text-[#9CA3AF]' : 'text-[#374151]')}>{label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 flex-nowrap mb-5">
        {['all', 'high', 'medium', 'low'].map(key => (
          <button
            key={key}
            onClick={() => setSeverityFilter(key)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize',
              severityFilter === key ? 'bg-primary text-primary-foreground' : 'bg-white border border-[#E7EAF3] text-[#374151] hover:text-[#1F2A44]'
            )}
          >
            {key === 'all' ? 'All' : `${key} risk`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Intervention Templates */}
      {atRisk.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-bold text-blue-900">Quick Interventions</p>
            <p className="text-xs text-blue-700 ml-auto">Send to {atRisk.length} at-risk client{atRisk.length > 1 ? 's' : ''}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {interventionTemplates.map((t, i) => (
              <button
                key={i}
                onClick={() => handleBroadcastTemplate(t)}
                disabled={sendMutation.isPending}
                className="text-xs font-semibold px-3 py-2.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <ShieldCheck className="w-14 h-14 text-emerald-400 opacity-60" />
          <p className="font-semibold text-sm">
            {search || severityFilter !== 'all' ? 'No clients match this filter' : 'All clients are on track! 🎉'}
          </p>
          <p className="text-xs text-muted-foreground">No risk flags detected based on recent check-ins.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <RiskCard 
              key={entry.client.id} 
              entry={entry} 
              lastMessages={messages}
              onSendNudge={handleSendNudge}
            />
          ))}
        </div>
      )}

      {/* Link to check-in dashboard */}
      <div className="mt-6 pt-5 border-t border-[#E7EAF3]">
        <Link to="/checkin-review">
          <Button variant="outline" className="w-full gap-2">
            <ClipboardList className="w-4 h-4" />
            View Check-in Dashboard
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        </Link>
      </div>
    </div>
  );
}