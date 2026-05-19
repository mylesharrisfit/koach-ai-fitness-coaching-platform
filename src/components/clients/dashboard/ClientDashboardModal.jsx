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

const TABS_BASE = [
  { key: 'summary', label: 'Summary' },
  { key: 'notes', label: 'Notes' },
  { key: 'consultation', label: 'Consultation' },
  { key: 'nutrition',    label: 'Nutrition' },
  { key: 'programs',     label: 'Programs' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'sales', label: 'Sales' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'forms', label: 'Forms' },
];

const AVATAR_COLORS = [
  ['#3b82f6', '#dbeafe'],
  ['#8b5cf6', '#ede9fe'],
  ['#10b981', '#d1fae5'],
  ['#f59e0b', '#fef3c7'],
  ['#ef4444', '#fee2e2'],
];
function getAvatarColor(name = '') {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

const STATUS_RING = {
  active:    '#00ff88',
  at_risk:   '#ff6b35',
  lead:      '#00d4ff',
  completed: '#9ca3af',
  alumni:    '#a78bfa',
};

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
  const [ringColor, avatarBg] = getAvatarColor(client.name);
  const statusRingColor = STATUS_RING[client.lifecycle_status || 'lead'] || '#00d4ff';

  const tabs = [
    ...(isLead ? [{ key: 'pipeline', label: 'Pipeline' }] : []),
    ...TABS_BASE,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[90vw] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: '#111827' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Power bar accent ── */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #00d4ff 0%, #00ff88 50%, #6366f1 100%)', flexShrink: 0 }} />

        {/* ── Gradient header ── */}
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)', flexShrink: 0 }}>
          {/* Client info row */}
          <div className="flex items-center gap-4 px-6 pt-4 pb-3">
            {/* Avatar with status ring */}
            <div className="relative flex-shrink-0">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-base overflow-hidden"
                style={{
                  background: client.avatar_url ? 'transparent' : `linear-gradient(135deg, ${avatarBg}, ${ringColor}33)`,
                  color: ringColor,
                  boxShadow: `0 0 0 3px ${statusRingColor}, 0 0 12px ${statusRingColor}55`,
                }}
              >
                {client.avatar_url
                  ? <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
                  : <span style={{ color: ringColor }}>{initials}</span>
                }
              </div>
            </div>

            {/* Name + email + badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-white font-bold text-xl leading-tight tracking-tight">{client.name}</h2>
                <LifecycleBadge status={client.lifecycle_status || 'lead'} />
              </div>
              <p className="text-white/40 text-sm mt-0.5">{client.email}</p>
            </div>

            {/* Icon-only action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={onEdit}
                title="Edit client"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(`/client-profile?id=${client.id}`)}
                title="Full Profile"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pill tabs */}
          <div className="flex overflow-x-auto px-5 pb-3 gap-1.5">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap rounded-full transition-all flex-shrink-0',
                  tab === t.key
                    ? 'text-[#0a0a14]'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/8'
                )}
                style={tab === t.key ? {
                  background: 'linear-gradient(135deg, #00d4ff, #6366f1)',
                  boxShadow: '0 0 12px #00d4ff55',
                } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-hidden" style={{ background: '#f8f9fa' }}>
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

          {tab === 'nutrition' && (
            <NutritionTab client={client} />
          )}

          {tab === 'programs' && (
            <ProgramsTab client={client} />
          )}

          {(tab === 'consultation' || tab === 'attachments' || tab === 'sales' || tab === 'invoices' || tab === 'forms') && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <p className="text-gray-700 font-semibold capitalize">{tab}</p>
                <p className="text-gray-400 text-sm mt-1">Coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}