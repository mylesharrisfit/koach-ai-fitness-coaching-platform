import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ClipboardList, Search, X, AlertCircle, MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkInScore, averageAdherenceScore } from '@/lib/adherence';
import CheckInClientCard from '../components/checkin/CheckInClientCard';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

/* ── helpers ── */
function getReviewStatus(ci) {
  return ci.review_status || (ci.coach_responded ? 'reviewed' : 'pending');
}
function isFlagged(ci) {
  if (getReviewStatus(ci) === 'flagged') return true;
  const s = checkInScore(ci);
  if (s !== null && s < 55) return true;
  if (ci.compliance_training != null && ci.compliance_training < 60) return true;
  if (ci.compliance_nutrition != null && ci.compliance_nutrition < 60) return true;
  if (ci.sleep_hours != null && ci.sleep_hours < 6) return true;
  if (ci.mood === 'stressed' || ci.mood === 'tired') return true;
  return false;
}
function isOverdue(ci) {
  return differenceInDays(new Date(), parseISO(ci.date)) > 14;
}
function isPending(ci) {
  return getReviewStatus(ci) === 'pending';
}
function isReviewed(ci) {
  return getReviewStatus(ci) === 'reviewed';
}

const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'flagged',  label: 'Flagged' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'overdue',  label: 'Overdue' },
  { key: 'missed',   label: 'Missed' },
];

const STAT_COLORS = {
  pending:  'text-amber-500',
  flagged:  'text-destructive',
  reviewed: 'text-emerald-600',
  missed:   'text-orange-500',
};

export default function CheckInReview() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Real-time: refresh list when any check-in is updated (coach responds/reviews)
  useEffect(() => {
    const unsub = base44.entities.CheckIn.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['checkins-review'] });
    });
    return unsub;
  }, [queryClient]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ['checkins-review'],
    queryFn: () => base44.entities.CheckIn.list('-date', 400),
  });

  const clientMap = useMemo(
    () => Object.fromEntries(clients.map(c => [c.id, c])),
    [clients]
  );

  /* Latest check-in per client (for the dashboard view) */
  const latestPerClient = useMemo(() => {
    const seen = new Map();
    for (const ci of checkIns) {
      if (!seen.has(ci.client_id)) seen.set(ci.client_id, ci);
    }
    return Array.from(seen.values());
  }, [checkIns]);

  /* All CIs grouped by client (for adherence/trends) */
  const cisByClient = useMemo(() => {
    const map = {};
    for (const ci of checkIns) {
      if (!map[ci.client_id]) map[ci.client_id] = [];
      map[ci.client_id].push(ci);
    }
    return map;
  }, [checkIns]);

  /* Filter + search */
  const visible = useMemo(() => {
    let list = latestPerClient;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(ci => {
        const name = (clientMap[ci.client_id]?.name || ci.client_name || '').toLowerCase();
        return name.includes(q);
      });
    }

    if (filter === 'pending')  list = list.filter(isPending);
    if (filter === 'flagged')  list = list.filter(isFlagged);
    if (filter === 'reviewed') list = list.filter(isReviewed);
    if (filter === 'overdue')  list = list.filter(isOverdue);

    // Sort: at-risk first, then by date desc
    return [...list].sort((a, b) => {
      const aFlag = isFlagged(a) ? 1 : 0;
      const bFlag = isFlagged(b) ? 1 : 0;
      if (bFlag !== aFlag) return bFlag - aFlag;
      return new Date(b.date) - new Date(a.date);
    });
  }, [latestPerClient, filter, search, clientMap]);

  /* Missed check-ins: active clients with no check-in in 7+ days */
  const missedClients = useMemo(() => {
    const activeClients = clients.filter(c => c.status === 'active' || c.lifecycle_status === 'active');
    return activeClients.filter(client => {
      const clientCIs = checkIns.filter(ci => ci.client_id === client.id);
      if (!clientCIs.length) return true;
      const latest = clientCIs.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      return differenceInDays(new Date(), parseISO(latest.date)) >= 7;
    }).map(client => {
      const clientCIs = checkIns.filter(ci => ci.client_id === client.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
      const lastCI = clientCIs[0];
      const daysAgo = lastCI ? differenceInDays(new Date(), parseISO(lastCI.date)) : null;
      return { client, lastCI, daysAgo };
    }).sort((a, b) => (b.daysAgo ?? 999) - (a.daysAgo ?? 999));
  }, [clients, checkIns]);

  const counts = useMemo(() => ({
    pending:  latestPerClient.filter(isPending).length,
    flagged:  latestPerClient.filter(isFlagged).length,
    reviewed: latestPerClient.filter(isReviewed).length,
    missed:   missedClients.length,
  }), [latestPerClient, missedClients]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 fade-up">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-[#1F2A44]">Check-in Dashboard</h1>
        <p className="text-sm text-[#374151] mt-1">
          {latestPerClient.length} client{latestPerClient.length !== 1 ? 's' : ''} checked in
          {counts.pending > 0 && ` · ${counts.pending} awaiting review`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-5 fade-up fade-up-delay-1">
        {(['pending', 'flagged', 'reviewed', 'missed']).map(k => (
          <button
            key={k}
            onClick={() => setFilter(filter === k ? 'all' : k)}
            className={cn(
              'bg-white border rounded-xl p-3 text-center transition-all active:scale-[0.97] shadow-sm',
              filter === k ? 'border-primary ring-1 ring-primary/30' : 'border-[#E7EAF3]'
            )}
          >
            <p className={cn('text-2xl font-bold font-heading', counts[k] > 0 ? (STAT_COLORS[k] || 'text-amber-500') : 'text-[#374151]')}>
              {counts[k]}
            </p>
            <p className="text-[11px] text-[#374151] mt-0.5 capitalize">{k}</p>
          </button>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div className="space-y-3 mb-5 fade-up fade-up-delay-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                filter === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white border border-[#E7EAF3] text-[#374151] hover:text-[#1F2A44]'
              )}
            >
              {f.label}
              {f.key !== 'all' && counts[f.key] > 0 && (
                <span className={cn(
                  'ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  filter === f.key ? 'bg-white/20 text-white' : 'bg-secondary-foreground/10'
                )}>
                  {counts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
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
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filter === 'missed' ? (
        /* ── Missed check-ins panel ── */
        missedClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <ClipboardList className="w-12 h-12 opacity-30" />
            <p className="text-sm font-medium">All active clients checked in this week 🎉</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              {missedClients.length} active client{missedClients.length !== 1 ? 's' : ''} haven't checked in this week
            </p>
            {missedClients.map(({ client, lastCI, daysAgo }, i) => (
              <div
                key={client.id}
                className="bg-white border border-[#E7EAF3] rounded-2xl p-4 flex items-center gap-3 shadow-sm fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-sm flex-shrink-0">
                  {client.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{client.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {daysAgo !== null
                      ? `Last check-in ${daysAgo}d ago · ${lastCI ? format(parseISO(lastCI.date), 'MMM d') : ''}`
                      : 'No check-ins yet'}
                  </p>
                </div>
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0',
                  daysAgo === null || daysAgo > 21 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                )}>
                  {daysAgo !== null ? `${daysAgo}d` : 'Never'}
                </span>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => navigate(`/messages?clientId=${client.id}&message=${encodeURIComponent("Hey! Just a reminder to submit your weekly check-in when you get a chance 📋")}`)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    Remind
                  </button>
                  <button
                    onClick={() => navigate(`/messages?clientId=${client.id}`)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F6F7FB] border border-[#E7EAF3] text-[#374151] hover:bg-[#ECEEF4] transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <ClipboardList className="w-12 h-12 opacity-30" />
          <p className="text-sm font-medium">
            {filter === 'pending' ? 'All check-ins responded to 🎉' :
             filter === 'flagged' ? 'No flagged check-ins' :
             filter === 'overdue' ? 'No overdue check-ins' :
             search ? 'No clients found' : 'No check-ins yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((ci, i) => (
            <div key={ci.id} className="fade-up" style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}>
              <CheckInClientCard
                checkIn={ci}
                client={clientMap[ci.client_id]}
                allClientCIs={cisByClient[ci.client_id] || []}
                defaultOpen={filter === 'flagged' && visible.length <= 3}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}