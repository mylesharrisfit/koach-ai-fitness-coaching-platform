import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { subDays, differenceInDays, parseISO } from 'date-fns';
import { ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageHeader from '../components/shared/PageHeader';
import CheckInFilters from '../components/checkin/CheckInFilters';
import CheckInCard from '../components/checkin/CheckInCard';
import { checkInScore } from '@/lib/adherence';
import BehaviorNudge from '@/components/subscription/BehaviorNudge';
import { getActiveNudges } from '@/lib/upgradeNudges';
import { useUpgradeModal } from '@/components/layout/AppLayout';
import { hasFeature } from '@/lib/subscription';

function isFlagged(checkIn) {
  const score = checkInScore(checkIn);
  if (score !== null && score < 55) return true;
  if (checkIn.compliance_training != null && checkIn.compliance_training < 60) return true;
  if (checkIn.compliance_nutrition != null && checkIn.compliance_nutrition < 60) return true;
  if (checkIn.sleep_hours != null && checkIn.sleep_hours < 6) return true;
  if (checkIn.mood === 'stressed' || checkIn.mood === 'tired') return true;
  return false;
}

function isOverdue(checkIn) {
  return differenceInDays(new Date(), parseISO(checkIn.date)) > 14;
}

export default function CheckInReview() {
  const [timeFilter, setTimeFilter] = useState('month');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const { openUpgradeModal } = useUpgradeModal();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ['checkins-review'],
    queryFn: () => base44.entities.CheckIn.list('-date', 300),
  });

  const clientMap = useMemo(
    () => Object.fromEntries(clients.map(c => [c.id, c])),
    [clients]
  );

  // Time cutoff
  const cutoff = useMemo(() => {
    if (timeFilter === 'week') return subDays(new Date(), 7);
    if (timeFilter === 'month') return subDays(new Date(), 30);
    return new Date(0);
  }, [timeFilter]);

  // Pre-filter by time + search
  const baseFiltered = useMemo(() => {
    return checkIns.filter(ci => {
      if (new Date(ci.date) < cutoff) return false;
      if (search.trim()) {
        const name = (clientMap[ci.client_id]?.name || ci.client_name || '').toLowerCase();
        if (!name.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [checkIns, cutoff, search, clientMap]);

  // Sort / filter by mode
  const sorted = useMemo(() => {
    if (sort === 'flagged') return baseFiltered.filter(isFlagged).sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sort === 'overdue') return baseFiltered.filter(isOverdue).sort((a, b) => new Date(a.date) - new Date(b.date));
    if (sort === 'unresponded') return baseFiltered.filter(ci => !ci.notes).sort((a, b) => new Date(b.date) - new Date(a.date));
    // newest
    return [...baseFiltered].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [baseFiltered, sort]);

  // Badge counts for filter tabs
  const counts = useMemo(() => ({
    flagged: baseFiltered.filter(isFlagged).length,
    overdue: baseFiltered.filter(isOverdue).length,
    unresponded: baseFiltered.filter(ci => !ci.notes).length,
  }), [baseFiltered]);

  const hasAI = hasFeature(currentUser, 'ai_checkin_responses');
  const aiNudge = !hasAI
    ? getActiveNudges({ user: currentUser, clientCount: clients.length, checkInCount: checkIns.length })
        .find(n => n.id?.startsWith('checkin_ai'))
    : null;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Check-in Dashboard"
        subtitle={`${baseFiltered.length} check-in${baseFiltered.length !== 1 ? 's' : ''} · ${counts.unresponded} need${counts.unresponded === 1 ? 's' : ''} response`}
      />

      {aiNudge && (
        <BehaviorNudge nudge={aiNudge} onUpgrade={openUpgradeModal} className="mb-6" />
      )}

      <CheckInFilters
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        sort={sort}
        setSort={setSort}
        search={search}
        setSearch={setSearch}
        counts={counts}
      />

      {/* Summary stats */}
      {baseFiltered.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total', value: baseFiltered.length, color: 'text-foreground' },
            { label: 'Flagged', value: counts.flagged, color: counts.flagged > 0 ? 'text-destructive' : 'text-muted-foreground' },
            { label: 'Unresponded', value: counts.unresponded, color: counts.unresponded > 0 ? 'text-primary' : 'text-muted-foreground' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className={cn('text-2xl font-bold font-heading', s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <ClipboardList className="w-12 h-12 opacity-30" />
          <p className="text-sm font-medium">
            {sort === 'flagged' ? 'No flagged check-ins' :
             sort === 'overdue' ? 'No overdue check-ins' :
             sort === 'unresponded' ? 'All check-ins have been responded to 🎉' :
             'No check-ins in this period'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(ci => (
            <CheckInCard
              key={ci.id}
              checkIn={ci}
              client={clientMap[ci.client_id]}
              defaultOpen={sort === 'flagged' && sorted.length <= 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}