import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { subDays, differenceInDays, parseISO } from 'date-fns';
import { ClipboardList, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkInScore, averageAdherenceScore } from '@/lib/adherence';
import CheckInClientCard from '../components/checkin/CheckInClientCard';
import { Input } from '@/components/ui/input';

/* ── helpers ── */
function isFlagged(ci) {
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
  return !ci.coach_notes && !ci.coach_responded;
}

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'flagged',   label: 'Flagged' },
  { key: 'overdue',   label: 'Overdue' },
];

const STAT_COLORS = {
  pending: 'text-primary',
  flagged: 'text-destructive',
  overdue: 'text-amber-400',
};

export default function CheckInReview() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

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

    if (filter === 'pending') list = list.filter(isPending);
    if (filter === 'flagged') list = list.filter(isFlagged);
    if (filter === 'overdue') list = list.filter(isOverdue);

    // Sort: at-risk first, then by date desc
    return [...list].sort((a, b) => {
      const aFlag = isFlagged(a) ? 1 : 0;
      const bFlag = isFlagged(b) ? 1 : 0;
      if (bFlag !== aFlag) return bFlag - aFlag;
      return new Date(b.date) - new Date(a.date);
    });
  }, [latestPerClient, filter, search, clientMap]);

  const counts = useMemo(() => ({
    pending: latestPerClient.filter(isPending).length,
    flagged: latestPerClient.filter(isFlagged).length,
    overdue: latestPerClient.filter(isOverdue).length,
  }), [latestPerClient]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 fade-up">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Check-in Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {latestPerClient.length} client{latestPerClient.length !== 1 ? 's' : ''} checked in
          {counts.pending > 0 && ` · ${counts.pending} need${counts.pending === 1 ? 's' : ''} response`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5 fade-up fade-up-delay-1">
        {(['pending', 'flagged', 'overdue']).map(k => (
          <button
            key={k}
            onClick={() => setFilter(filter === k ? 'all' : k)}
            className={cn(
              'bg-card border rounded-xl p-3 text-center transition-all active:scale-[0.97]',
              filter === k ? 'border-primary ring-1 ring-primary/30' : 'border-border'
            )}
          >
            <p className={cn('text-2xl font-bold font-heading', counts[k] > 0 ? STAT_COLORS[k] : 'text-muted-foreground')}>
              {counts[k]}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{k}</p>
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
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
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
          {visible.map(ci => (
            <CheckInClientCard
              key={ci.id}
              checkIn={ci}
              client={clientMap[ci.client_id]}
              allClientCIs={cisByClient[ci.client_id] || []}
              defaultOpen={filter === 'flagged' && visible.length <= 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}