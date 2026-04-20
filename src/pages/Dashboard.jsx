import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Zap } from 'lucide-react';

import RevenueSnapshot from '../components/dashboard/RevenueSnapshot';
import AtRiskClients from '../components/dashboard/AtRiskClients';
import NeedsAttentionWidget from '../components/dashboard/NeedsAttentionWidget';
import HotLeads from '../components/dashboard/HotLeads';
import ClientAlerts from '../components/dashboard/ClientAlerts';
import DailyChecklist from '../components/dashboard/DailyChecklist';
import BehaviorNudge from '@/components/subscription/BehaviorNudge';
import { getActiveNudges } from '@/lib/upgradeNudges';
import { useUpgradeModal } from '@/components/layout/AppLayout';
import UsageSummaryCard from '@/components/dashboard/UsageSummaryCard';

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const { openUpgradeModal } = useUpgradeModal();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkins'],
    queryFn: () => base44.entities.CheckIn.list('-date', 100),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages-unread'],
    queryFn: () => base44.entities.Message.filter({ is_read: false }, '-created_date', 30),
  });

  const today = format(new Date(), 'EEEE, MMMM d');

  const activeNudges = getActiveNudges({
    user: currentUser,
    clientCount: clients.filter(c => c.status === 'active').length,
    checkInCount: checkIns.length,
  });
  const topNudge = activeNudges[0] || null;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-10 fade-up">
        <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center glow-sm shadow-inner-top ring-1 ring-primary/20">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Coach Command Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
      </div>

      {/* Behavior-based upgrade nudge */}
      {topNudge && (
        <BehaviorNudge nudge={topNudge} onUpgrade={openUpgradeModal} className="mb-6 fade-up" />
      )}

      <div className="flex flex-col gap-5">
        {/* Checklist — most actionable, show first */}
        <DailyChecklist checkIns={checkIns} messages={messages} clients={clients} />

        {/* Revenue snapshot */}
        <RevenueSnapshot clients={clients} />

        {/* Needs Attention (full width, most critical) */}
        <NeedsAttentionWidget clients={clients} checkIns={checkIns} />

        {/* Hot Leads */}
        <HotLeads clients={clients} />

        {/* Usage meter (only shown when on limited plan) */}
        <UsageSummaryCard user={currentUser} />

        {/* AI Alerts */}
        <ClientAlerts clients={clients} checkIns={checkIns} />
      </div>
    </div>
  );
}