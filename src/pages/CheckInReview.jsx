import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInDays, parseISO, format } from 'date-fns';
import {
  ClipboardList, Search, X, AlertCircle, MessageSquare, Send,
  Clock, Flag, CheckCircle2, UserX, Download, Bell, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkInScore, averageAdherenceScore } from '@/lib/adherence';
import CheckInClientCard from '../components/checkin/CheckInClientCard';
import CheckInAnalyticsSidebar from '../components/checkin/CheckInAnalyticsSidebar';
import CheckInDetailDrawer from '../components/checkin/CheckInDetailDrawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
function isPending(ci) { return getReviewStatus(ci) === 'pending'; }
function isReviewed(ci) { return getReviewStatus(ci) === 'reviewed'; }

const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'flagged',  label: 'Flagged' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'overdue',  label: 'Overdue' },
  { key: 'missed',   label: 'Missed' },
];

const STAT_CARDS = [
  { key: 'pending',  label: 'Pending',  icon: Clock,        dotColor: 'bg-amber-400',   numColor: 'text-[#111827]', dark: true  },
  { key: 'flagged',  label: 'Flagged',  icon: Flag,         dotColor: 'bg-red-500',     numColor: 'text-[#111827]', dark: false },
  { key: 'reviewed', label: 'Reviewed', icon: CheckCircle2, dotColor: 'bg-emerald-500', numColor: 'text-[#111827]', dark: false },
  { key: 'missed',   label: 'Missed',   icon: UserX,        dotColor: 'bg-orange-400',  numColor: 'text-[#111827]', dark: true  },
];

export default function CheckInReview() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [drawerCheckIn, setDrawerCheckIn] = useState(null);
  const [drawerIndex, setDrawerIndex] = useState(0);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const latestPerClient = useMemo(() => {
    const seen = new Map();
    for (const ci of checkIns) {
      if (!seen.has(ci.client_id)) seen.set(ci.client_id, ci);
    }
    return Array.from(seen.values());
  }, [checkIns]);

  const cisByClient = useMemo(() => {
    const map = {};
    for (const ci of checkIns) {
      if (!map[ci.client_id]) map[ci.client_id] = [];
      map[ci.client_id].push(ci);
    }
    return map;
  }, [checkIns]);

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
    return [...list].sort((a, b) => {
      const aFlag = isFlagged(a) ? 1 : 0;
      const bFlag = isFlagged(b) ? 1 : 0;
      if (bFlag !== aFlag) return bFlag - aFlag;
      return new Date(b.date) - new Date(a.date);
    });
  }, [latestPerClient, filter, search, clientMap]);

  const missedClients = useMemo(() => {
    const activeClients = clients.filter(c => c.status === 'active' || c.lifecycle_status === 'active');
    return activeClients.filter(client => {
      const clientCIs = checkIns.filter(ci => ci.client_id === client.id);
      if (!clientCIs.length) return true;
      const latest = clientCIs.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      return differenceInDays(new Date(), parseISO(latest.date)) >= 7;
    }).map(client => {
      const clientCIs = checkIns.filter(ci => ci.client_id === client.id).sort((a, b) => new Date(b.date) - new Date(a.date));
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

  // Drawer navigation — navigates within the current visible list
  const openDrawer = (ci, idx) => {
    setDrawerCheckIn(ci);
    setDrawerIndex(idx);
  };
  const navigateDrawer = (newIdx) => {
    if (newIdx >= 0 && newIdx < visible.length) {
      setDrawerCheckIn(visible[newIdx]);
      setDrawerIndex(newIdx);
    }
  };

  const pendingClients = latestPerClient.filter(isPending);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl p-4 sm:p-5" style={{ background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)' }}>
        <div>
          <h1 className="text-base sm:text-xl font-heading font-bold text-white tracking-tight">Check-in Dashboard</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {format(new Date(), 'EEE, MMM d')} · {latestPerClient.length} checked in
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
            onClick={() => navigate(`/messages?message=${encodeURIComponent("Hey! Just a reminder to submit your weekly check-in when you get a chance 📋")}`)}
          >
            <Bell className="w-3.5 h-3.5" /> Send Bulk Reminder
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
            onClick={() => toast.info('Export feature coming soon!')}
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, dotColor, numColor, dark }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.97 }}
            onClick={() => setFilter(filter === key ? 'all' : key)}
            className={cn(
              'rounded-xl p-4 text-left transition-all',
              dark
                ? 'bg-[#111827]'
                : 'bg-white border border-[#E5E7EB] hover:border-[#D1D5DB]',
              filter === key && !dark && 'ring-2 ring-[#2563EB]/20 border-[#2563EB]/40',
              filter === key && dark && 'ring-2 ring-white/20'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-2 h-2 rounded-full', dark ? 'bg-white/30' : dotColor)} />
              <Icon className={cn('w-4 h-4', dark ? 'text-white/40' : 'text-[#9CA3AF]')} />
            </div>
            <p className={cn('text-2xl font-semibold', dark ? 'text-white' : counts[key] > 0 ? numColor : 'text-[#111827]')}>
              {counts[key]}
            </p>
            <p className={cn('text-xs mt-0.5 capitalize', dark ? 'text-white/50' : 'text-[#6B7280]')}>{label}</p>
          </motion.button>
        ))}
      </div>

      {/* ── Quick Actions Bar ── */}
      <div className="flex gap-2 flex-wrap mb-5">
        {[
          { label: 'Pending', action: () => setFilter('pending'), count: counts.pending },
          { label: 'Flagged', action: () => setFilter('flagged'), count: counts.flagged },
          { label: 'Reminders', action: () => navigate('/messages'), count: 0 },
          { label: 'Export', action: () => toast.info('Export coming soon'), count: 0 },
        ].map(({ label, action, count }) => (
          <button
            key={label}
            onClick={action}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-colors"
          >
            {label}
            {count > 0 && (
              <span className="bg-[#F3F4F6] text-[#374151] text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Left: Check-in list (65%) ── */}
        <div className="flex-1 min-w-0" style={{ flexBasis: '65%' }}>

          {/* Filter tabs + search */}
          <div className="space-y-3 mb-5">
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
                        <Send className="w-3 h-3" /> Remind
                      </button>
                      <button
                        onClick={() => navigate(`/messages?clientId=${client.id}`)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F6F7FB] border border-[#E7EAF3] text-[#374151] hover:bg-[#ECEEF4] transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" /> Chat
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
                <div
                  key={ci.id}
                  className="fade-up cursor-pointer"
                  style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}
                  onClick={() => openDrawer(ci, i)}
                >
                  <CheckInClientCard
                    checkIn={ci}
                    client={clientMap[ci.client_id]}
                    allClientCIs={cisByClient[ci.client_id] || []}
                    defaultOpen={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Analytics Sidebar (35%) ── */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
          <CheckInAnalyticsSidebar
            checkIns={checkIns}
            clients={clients}
            latestPerClient={latestPerClient}
            clientMap={clientMap}
          />
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      {drawerCheckIn && (
        <CheckInDetailDrawer
          checkIn={drawerCheckIn}
          client={clientMap[drawerCheckIn.client_id]}
          allCheckIns={cisByClient[drawerCheckIn.client_id] || []}
          currentIndex={drawerIndex}
          total={visible.length}
          onNavigate={navigateDrawer}
          open={!!drawerCheckIn}
          onOpenChange={(v) => { if (!v) setDrawerCheckIn(null); }}
        />
      )}
    </div>
  );
}