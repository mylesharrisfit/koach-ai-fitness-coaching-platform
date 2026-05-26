import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInDays, parseISO } from 'date-fns';
import { Plus, Search, X, ClipboardList, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import CheckInStatsCards from '@/components/checkin/CheckInStatsCards';
import CheckInReviewRow from '@/components/checkin/CheckInReviewRow';
import CheckInReviewDrawer from '@/components/checkin/CheckInReviewDrawer';
import FormBuilderTab from '@/components/checkin/FormBuilderTab';
import CheckInFormBuilderModal from '@/components/checkin/CheckInFormBuilderModal';

const REVIEW_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'pending', label: 'Pending' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'flagged', label: 'Needs Follow-up' },
];

export default function CheckInReview() {
  const [activeTab, setActiveTab] = useState('pending'); // pending | forms
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [drawerCheckIn, setDrawerCheckIn] = useState(null);
  const [drawerIndex, setDrawerIndex] = useState(0);
  const [newFormOpen, setNewFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Real-time subscription
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
    queryFn: () => base44.entities.CheckIn.list('-date', 500),
  });

  const clientMap = useMemo(
    () => Object.fromEntries(clients.map(c => [c.id, c])),
    [clients]
  );

  // Latest check-in per client
  const latestPerClient = useMemo(() => {
    const seen = new Map();
    for (const ci of checkIns) {
      if (!seen.has(ci.client_id)) seen.set(ci.client_id, ci);
    }
    return Array.from(seen.values());
  }, [checkIns]);

  // All check-ins grouped by client
  const cisByClient = useMemo(() => {
    const map = {};
    for (const ci of checkIns) {
      if (!map[ci.client_id]) map[ci.client_id] = [];
      map[ci.client_id].push(ci);
    }
    return map;
  }, [checkIns]);

  // Filtered + sorted list for review tab
  const visible = useMemo(() => {
    let list = [...checkIns];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(ci => {
        const name = (clientMap[ci.client_id]?.name || ci.client_name || '').toLowerCase();
        return name.includes(q);
      });
    }

    if (filter === 'new') {
      list = list.filter(ci => !ci.coach_responded && ci.review_status !== 'reviewed' && ci.review_status !== 'flagged');
    } else if (filter === 'pending') {
      list = list.filter(ci => !ci.coach_responded && ci.review_status !== 'reviewed');
    } else if (filter === 'reviewed') {
      list = list.filter(ci => ci.coach_responded || ci.review_status === 'reviewed');
    } else if (filter === 'flagged') {
      list = list.filter(ci => ci.review_status === 'flagged');
    }

    // Sort: unreviewed first, then by date desc
    return list.sort((a, b) => {
      const aReviewed = a.coach_responded || a.review_status === 'reviewed' ? 1 : 0;
      const bReviewed = b.coach_responded || b.review_status === 'reviewed' ? 1 : 0;
      if (aReviewed !== bReviewed) return aReviewed - bReviewed;
      return new Date(b.date) - new Date(a.date);
    });
  }, [checkIns, filter, search, clientMap]);

  const filterCounts = useMemo(() => ({
    new: checkIns.filter(ci => !ci.coach_responded && ci.review_status !== 'reviewed' && ci.review_status !== 'flagged').length,
    pending: checkIns.filter(ci => !ci.coach_responded && ci.review_status !== 'reviewed').length,
    reviewed: checkIns.filter(ci => ci.coach_responded || ci.review_status === 'reviewed').length,
    flagged: checkIns.filter(ci => ci.review_status === 'flagged').length,
  }), [checkIns]);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div
        className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)' }}
      >
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Check-ins</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {checkIns.length} total · {filterCounts.pending} pending review
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/messages?message=${encodeURIComponent("Hey! Just a reminder to submit your weekly check-in 📋")}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Bell className="w-3.5 h-3.5" /> Bulk Reminder
          </button>
          <button
            onClick={() => setNewFormOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: '#fff' }}
          >
            <Plus className="w-3.5 h-3.5" /> New Check-in Form
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <CheckInStatsCards
        checkIns={checkIns}
        clients={clients}
        latestPerClient={latestPerClient}
      />

      {/* ── Main Tabs ── */}
      <div className="flex border-b border-[#E5E7EB] mb-6">
        {[
          { key: 'pending', label: 'Pending Review', badge: filterCounts.pending },
          { key: 'forms', label: 'Form Builder', badge: null },
        ].map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'px-5 py-3 text-sm font-semibold transition-colors relative flex items-center gap-2',
              activeTab === key
                ? 'text-primary border-b-2 border-primary'
                : 'text-[#6B7280] hover:text-[#374151]'
            )}
          >
            {label}
            {badge != null && badge > 0 && (
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                activeTab === key ? 'bg-primary/10 text-primary' : 'bg-[#F3F4F6] text-[#6B7280]'
              )}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Pending Review Tab ── */}
      {activeTab === 'pending' && (
        <div>
          {/* Sub-filters + search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-shrink-0">
              {REVIEW_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap',
                    filter === f.key
                      ? 'bg-primary text-white'
                      : 'bg-white border border-[#E5E7EB] text-[#374151] hover:border-[#D1D5DB]'
                  )}
                >
                  {f.label}
                  {f.key !== 'all' && filterCounts[f.key] > 0 && (
                    <span className={cn(
                      'ml-1.5 text-[10px] font-bold',
                      filter === f.key ? 'opacity-70' : 'text-[#6B7280]'
                    )}>
                      {filterCounts[f.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-sm ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-[#9CA3AF]" />
              </div>
              <p className="font-semibold text-[#374151] mb-1">
                {filter === 'pending' ? 'All caught up! 🎉' :
                 filter === 'flagged' ? 'No flagged check-ins' :
                 filter === 'reviewed' ? 'No reviewed check-ins' :
                 search ? 'No clients match your search' :
                 'No check-ins yet'}
              </p>
              <p className="text-sm text-[#9CA3AF]">
                {filter === 'pending' ? 'All check-ins have been reviewed' : 'Check-ins will appear here when clients submit them'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((ci, i) => (
                <motion.div
                  key={ci.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.2) }}
                >
                  <CheckInReviewRow
                    checkIn={ci}
                    client={clientMap[ci.client_id]}
                    onClick={() => openDrawer(ci, i)}
                  />
                </motion.div>
              ))}
              <p className="text-center text-xs text-[#9CA3AF] pt-2">{visible.length} check-in{visible.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Form Builder Tab ── */}
      {activeTab === 'forms' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-[#111827]">Check-in Forms</h2>
              <p className="text-xs text-[#6B7280]">Build custom forms to collect structured data from clients</p>
            </div>
            <Button
              onClick={() => setNewFormOpen(true)}
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
              size="sm"
            >
              <Plus className="w-4 h-4" /> New Form
            </Button>
          </div>
          <FormBuilderTab />
        </div>
      )}

      {/* ── Review Drawer ── */}
      {drawerCheckIn && (
        <CheckInReviewDrawer
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

      {/* ── New Form Modal (header button) ── */}
      {newFormOpen && (
        <CheckInFormBuilderModal
          open={newFormOpen}
          onOpenChange={setNewFormOpen}
          editingForm={null}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['checkin-forms'] });
            setNewFormOpen(false);
            toast.success('Form created! Switch to Form Builder tab to see it.');
          }}
        />
      )}
    </div>
  );
}