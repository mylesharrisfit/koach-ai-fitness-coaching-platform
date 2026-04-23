import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Scale, TrendingUp, Activity, Calendar, Target, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { compositeAdherenceScore } from '@/lib/adherence';
import LifecycleBadge from '@/components/clients/LifecycleBadge';
import ClientForm from '@/components/clients/ClientForm';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

// Tab content components
import ProfileOverviewTab from '@/components/client-profile/ProfileOverviewTab';
import ProfileProgramsTab from '@/components/client-profile/ProfileProgramsTab';
import ProfileNutritionTab from '@/components/client-profile/ProfileNutritionTab';
import ProfileCheckInsTab from '@/components/client-profile/ProfileCheckInsTab';
import ProfileProgressTab from '@/components/client-profile/ProfileProgressTab';
import ProfileMessagesTab from '@/components/client-profile/ProfileMessagesTab';
import ProfileConnectedAppsTab from '@/components/client-profile/ProfileConnectedAppsTab';

const TABS = [
  { key: 'overview',       label: 'Overview' },
  { key: 'programs',       label: 'Programs' },
  { key: 'nutrition',      label: 'Nutrition' },
  { key: 'checkins',       label: 'Check-ins' },
  { key: 'progress',       label: 'Progress' },
  { key: 'messages',       label: 'Messages' },
  { key: 'connected_apps', label: 'Apps' },
];

const goalLabels = {
  weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', strength: 'Strength',
  endurance: 'Endurance', flexibility: 'Flexibility', general_fitness: 'General Fitness'
};

export default function ClientProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');
  const tabParam = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');
  const [showEdit, setShowEdit] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => base44.entities.Client.filter({ id: clientId }).then(r => r[0]),
    enabled: !!clientId,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkins', clientId],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: clientId }, '-date', 50),
    enabled: !!clientId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', clientId],
    queryFn: () => base44.entities.Message.filter({ client_id: clientId }, '-created_date', 50),
    enabled: !!clientId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(clientId, data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated');
    },
  });

  const score = useMemo(() => compositeAdherenceScore(checkIns), [checkIns]);
  const lastCI = checkIns[0];

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F6F7FB]">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!client) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <p className="text-[#374151] font-medium">Client not found.</p>
      <Button variant="outline" onClick={() => navigate('/clients')}>
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </Button>
    </div>
  );

  const initials = client.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
  const scoreColor = score === null ? 'text-[#9CA3AF]' : score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-500' : 'text-red-500';

  const handleEditSubmit = (data) => {
    updateMutation.mutate(data);
    setShowEdit(false);
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col">
      {/* ── Top bar ── */}
      <div className="bg-white border-b border-[#F0F2F8] px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 z-20">
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => navigate('/clients')}>
          <ArrowLeft className="w-4 h-4 text-[#374151]" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-[#1F2A44] truncate">{client.name}</h1>
          <p className="text-xs text-[#9CA3AF] truncate">{client.email}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}>
          <Edit className="w-4 h-4" /> Edit
        </Button>
      </div>

      {/* ── Profile hero ── */}
      <div className="bg-white border-b border-[#F0F2F8] px-4 sm:px-6 py-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-[#EEF4FF] text-primary flex items-center justify-center font-bold text-lg flex-shrink-0 overflow-hidden">
            {client.avatar_url
              ? <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#1F2A44]">{client.name}</h2>
              <LifecycleBadge status={client.lifecycle_status || 'lead'} />
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">{goalLabels[client.goal] || 'General Fitness'}</p>
            {client.start_date && (
              <p className="text-xs text-[#9CA3AF]">Started {format(new Date(client.start_date), 'MMM d, yyyy')}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          <div className="flex flex-col items-center bg-[#F6F7FB] rounded-xl p-3">
            <span className={cn('text-lg font-bold tabular-nums', scoreColor)}>{score !== null ? `${score}%` : '—'}</span>
            <span className="text-[10px] text-[#9CA3AF] mt-0.5">Adherence</span>
          </div>
          <div className="flex flex-col items-center bg-[#F6F7FB] rounded-xl p-3">
            <span className="text-lg font-bold text-[#1F2A44] tabular-nums">{checkIns.length}</span>
            <span className="text-[10px] text-[#9CA3AF] mt-0.5">Check-ins</span>
          </div>
          <div className="flex flex-col items-center bg-[#F6F7FB] rounded-xl p-3">
            <span className="text-lg font-bold text-[#1F2A44] tabular-nums">
              {client.current_weight ? `${client.current_weight}` : '—'}
            </span>
            <span className="text-[10px] text-[#9CA3AF] mt-0.5">Weight (lbs)</span>
          </div>
          <div className="hidden sm:flex flex-col items-center bg-[#F6F7FB] rounded-xl p-3">
            <span className="text-lg font-bold text-[#1F2A44] tabular-nums">
              {lastCI ? formatDistanceToNow(new Date(lastCI.date), { addSuffix: false }) : 'Never'}
            </span>
            <span className="text-[10px] text-[#9CA3AF] mt-0.5">Last Check-in</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-[#F0F2F8] sticky top-[57px] z-10 overflow-x-auto">
        <div className="flex px-4 sm:px-6 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-[#6B7280] hover:text-[#1F2A44]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 px-4 sm:px-6 py-5 max-w-3xl w-full mx-auto">
        {activeTab === 'overview'       && <ProfileOverviewTab client={client} checkIns={checkIns} />}
        {activeTab === 'programs'       && <ProfileProgramsTab client={client} />}
        {activeTab === 'nutrition'      && <ProfileNutritionTab client={client} />}
        {activeTab === 'checkins'       && <ProfileCheckInsTab client={client} checkIns={checkIns} />}
        {activeTab === 'progress'       && <ProfileProgressTab client={client} checkIns={checkIns} />}
        {activeTab === 'messages'       && <ProfileMessagesTab client={client} messages={messages} />}
        {activeTab === 'connected_apps' && <ProfileConnectedAppsTab client={client} />}
      </div>

      <ClientForm
        open={showEdit}
        onOpenChange={setShowEdit}
        onSubmit={(data) => handleEditSubmit(data)}
        client={client}
      />
    </div>
  );
}