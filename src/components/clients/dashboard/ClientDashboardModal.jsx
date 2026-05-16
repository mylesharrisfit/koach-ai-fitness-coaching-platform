import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Edit, ExternalLink, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import LifecycleBadge from '../LifecycleBadge';
import LeadPipelinePanel from '../LeadPipelinePanel';
import SummaryTab from './SummaryTab';
import NotesTab from './NotesTab';

const TABS_BASE = [
  { key: 'summary', label: 'Summary' },
  { key: 'notes', label: 'Notes' },
  { key: 'consultation', label: 'Consultation' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'sales', label: 'Sales' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'forms', label: 'Forms' },
];

const AVATAR_COLORS = [
  ['bg-blue-100', 'text-blue-700'],
  ['bg-violet-100', 'text-violet-700'],
  ['bg-emerald-100', 'text-emerald-700'],
  ['bg-amber-100', 'text-amber-700'],
  ['bg-rose-100', 'text-rose-700'],
];
function getAvatarColor(name = '') {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function ClientDashboardModal({ client, checkIns = [], onClose, onEdit }) {
  const isLead = (client?.lifecycle_status || 'lead') === 'lead';
  const [tab, setTab] = useState(isLead ? 'pipeline' : 'summary');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['messages-modal', client?.id],
    queryFn: () => base44.entities.Message.filter({ client_id: client.id }),
    enabled: !!client?.id,
    select: d => [...d].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
  });

  const { data: program } = useQuery({
    queryKey: ['program-modal', client?.assigned_program_id],
    queryFn: () => base44.entities.WorkoutProgram.filter({ id: client.assigned_program_id }),
    enabled: !!client?.assigned_program_id,
    select: d => d[0],
  });

  const { data: nutritionPlan } = useQuery({
    queryKey: ['nutrition-modal', client?.assigned_nutrition_id],
    queryFn: () => base44.entities.NutritionPlan.filter({ id: client.assigned_nutrition_id }),
    enabled: !!client?.assigned_nutrition_id,
    select: d => d[0],
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions-modal', client?.id],
    queryFn: () => base44.entities.Session.filter({ client_id: client.id }),
    enabled: !!client?.id,
    select: d => d.sort((a, b) => new Date(b.date) - new Date(a.date)),
  });

  const { data: workoutSessions = [] } = useQuery({
    queryKey: ['workout-sessions-modal', client?.id],
    queryFn: () => base44.entities.WorkoutSession.filter({ client_id: client.id }),
    enabled: !!client?.id,
  });

  if (!client) return null;

  const initials = (client.name || '?').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const [avatarBg, avatarText] = getAvatarColor(client.name);

  const tabs = [
    ...(isLead ? [{ key: 'pipeline', label: 'Pipeline' }] : []),
    ...TABS_BASE,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[90vw] h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Dark header ── */}
        <div className="bg-[#0F1523] flex-shrink-0">
          {/* Top strip: client info + actions */}
          <div className="flex items-center gap-4 px-6 py-4">
            {/* Avatar */}
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden',
              client.avatar_url ? '' : `${avatarBg} ${avatarText}`
            )}>
              {client.avatar_url
                ? <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
                : <span>{initials}</span>
              }
            </div>

            {/* Name + badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-white font-bold text-lg leading-tight">{client.name}</h2>
                <LifecycleBadge status={client.lifecycle_status || 'lead'} />
              </div>
              <p className="text-white/50 text-sm mt-0.5">{client.email}</p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                size="sm" variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 h-8"
                onClick={onEdit}
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button
                size="sm" variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 h-8"
                onClick={() => navigate(`/client-profile?id=${client.id}`)}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Full Profile
              </Button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto px-6 gap-0">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all flex-shrink-0',
                  tab === t.key
                    ? 'border-blue-400 text-white'
                    : 'border-transparent text-white/40 hover:text-white/70'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-hidden bg-[#F4F6FA]">
          {tab === 'pipeline' && (
            <div className="h-full overflow-y-auto p-6 max-w-lg">
              <LeadPipelinePanel
                client={client}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['clients'] })}
              />
            </div>
          )}

          {tab === 'summary' && (
            <SummaryTab
              client={client}
              checkIns={checkIns}
              messages={messages}
              program={program}
              nutritionPlan={nutritionPlan}
              workoutSessions={workoutSessions}
            />
          )}

          {tab === 'notes' && (
            <NotesTab client={client} />
          )}

          {(tab === 'consultation' || tab === 'attachments' || tab === 'sales' || tab === 'invoices' || tab === 'forms') && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <p className="text-[#374151] font-semibold capitalize">{tab}</p>
                <p className="text-[#9CA3AF] text-sm mt-1">Coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}