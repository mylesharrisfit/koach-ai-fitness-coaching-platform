import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Edit, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import LifecycleBadge from '../LifecycleBadge';
import LeadPipelinePanel from '../LeadPipelinePanel';
import SummaryTab from './SummaryTab';
import NotesTab from './NotesTab';
import NutritionTab from './NutritionTab';
import ProgramsTab from './ProgramsTab';
import { motion } from 'framer-motion';

const TABS_BASE = [
  { key: 'summary',       label: 'Summary' },
  { key: 'notes',         label: 'Notes' },
  { key: 'consultation',  label: 'Consultation' },
  { key: 'nutrition',     label: 'Nutrition' },
  { key: 'programs',      label: 'Programs' },
  { key: 'attachments',   label: 'Attachments' },
  { key: 'sales',         label: 'Sales' },
  { key: 'invoices',      label: 'Invoices' },
  { key: 'forms',         label: 'Forms' },
];

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
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

  const { data: earnedBadges = [] } = useQuery({
    queryKey: ['badges-modal', client?.id],
    queryFn: () => base44.entities.ClientBadge.filter({ client_id: client.id }),
    enabled: !!client?.id,
    select: d => [...d].sort((a, b) => new Date(b.earned_date) - new Date(a.earned_date)),
  });

  if (!client) return null;

  const initials = getInitials(client.name);

  const tabs = [
    ...(isLead ? [{ key: 'pipeline', label: 'Pipeline' }] : []),
    ...TABS_BASE,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full h-[95dvh] sm:h-[90vh] sm:max-w-[90vw] sm:rounded-xl rounded-t-2xl bg-white border border-[#E5E7EB] flex flex-col overflow-hidden"
        style={{ maxWidth: 1100 }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Clean header ── */}
        <div className="flex-shrink-0 border-b border-[#E5E7EB] bg-white">
          {/* Client info row */}
          <div className="flex items-center gap-4 px-6 pt-4 pb-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center font-semibold text-sm text-[#374151] flex-shrink-0 overflow-hidden">
              {client.avatar_url
                ? <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
                : <span>{initials}</span>
              }
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-[#111827] leading-tight">{client.name}</h2>
                <LifecycleBadge status={client.lifecycle_status || 'lead'} />
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{client.email}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={onEdit}
                title="Edit client"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(`/client-profile?id=${client.id}`)}
                title="Full Profile"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab bar — underline style */}
          <div className="flex overflow-x-auto px-6">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'relative px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0',
                  tab === t.key ? 'text-[#111827]' : 'text-[#6B7280] hover:text-[#374151]'
                )}
              >
                {t.label}
                {tab === t.key && (
                  <motion.div
                    layoutId="client-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2563EB] rounded-t-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-hidden bg-[#FAFAFA]">
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
              earnedBadges={earnedBadges}
            />
          )}

          {tab === 'notes' && <NotesTab client={client} />}
          {tab === 'nutrition' && <NutritionTab client={client} />}
          {tab === 'programs' && <ProgramsTab client={client} />}

          {(tab === 'consultation' || tab === 'attachments' || tab === 'sales' || tab === 'invoices' || tab === 'forms') && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">📋</span>
                </div>
                <p className="text-sm font-medium text-[#374151] capitalize">{tab}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}