import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Zap } from 'lucide-react';

import RevenueSnapshot from '../components/dashboard/RevenueSnapshot';
import AtRiskClients from '../components/dashboard/AtRiskClients';
import HotLeads from '../components/dashboard/HotLeads';
import ClientAlerts from '../components/dashboard/ClientAlerts';
import DailyChecklist from '../components/dashboard/DailyChecklist';

export default function Dashboard() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkins'],
    queryFn: () => base44.entities.CheckIn.list('-date', 50),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages-unread'],
    queryFn: () => base44.entities.Message.filter({ is_read: false }, '-created_date', 30),
  });

  const today = format(new Date(), 'EEEE, MMMM d');

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Coach Command Center</h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
      </div>

      {/* Row 1: Revenue + Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <RevenueSnapshot clients={clients} />
        </div>
        <div className="lg:col-span-2">
          <DailyChecklist checkIns={checkIns} messages={messages} clients={clients} />
        </div>
      </div>

      {/* Row 2: At-Risk + Hot Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AtRiskClients clients={clients} checkIns={checkIns} />
        <HotLeads clients={clients} />
      </div>

      {/* Row 3: AI Alerts full width */}
      <ClientAlerts clients={clients} checkIns={checkIns} />
    </div>
  );
}