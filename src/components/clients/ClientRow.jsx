import React, { useState } from 'react';
import {
  MoreHorizontal, Edit, Trash2, ArrowRight, CheckSquare, Square,
  MessageCircle, ClipboardList, Dumbbell, AlertTriangle, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LifecycleBadge, { LIFECYCLE_CONFIG } from './LifecycleBadge';
import { AdherencePill } from '@/components/adherence/AdherenceScore';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import QuickMessageModal from './QuickMessageModal';
import QuickCheckInPanel from './QuickCheckInPanel';

const LIFECYCLE_ORDER = ['lead', 'active', 'at_risk', 'completed', 'alumni'];

function OnboardingDots({ client, checkIns }) {
  const steps = [
    !!client.goal || !!client.height,
    !!client.assigned_program_id,
    !!client.assigned_nutrition_id,
    checkIns > 0,
  ];
  const done = steps.filter(Boolean).length;
  if (done === steps.length) return null;
  return (
    <div className="flex items-center gap-0.5 ml-1" title={`Onboarding: ${done}/${steps.length} steps`}>
      {steps.map((s, i) => (
        <div key={i} className={cn('w-1.5 h-1.5 rounded-full', s ? 'bg-emerald-400' : 'bg-[#D1D5DB]')} />
      ))}
    </div>
  );
}

const STAGE_COLORS = {
  new_lead: 'text-gray-500', dmd: 'text-blue-500', call_booked: 'text-amber-500',
  proposal_sent: 'text-purple-500', closed: 'text-emerald-600', lost: 'text-red-500',
};
const STAGE_LABELS = {
  new_lead: 'New', dmd: "DM'd", call_booked: 'Call', proposal_sent: 'Proposal', closed: 'Closed', lost: 'Lost',
};
const GOAL_LABELS = {
  weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', strength: 'Strength',
  endurance: 'Endurance', flexibility: 'Flexibility', general_fitness: 'General Fitness',
};
const AVATAR_COLORS = [
  ['bg-blue-100', 'text-blue-700'], ['bg-violet-100', 'text-violet-700'],
  ['bg-emerald-100', 'text-emerald-700'], ['bg-amber-100', 'text-amber-700'],
  ['bg-rose-100', 'text-rose-700'], ['bg-cyan-100', 'text-cyan-700'],
];

function getAvatarColor(name = '') {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function CheckInAge({ lastCheckIn }) {
  if (!lastCheckIn) return <span className="text-[10px] text-[#9CA3AF]">No check-ins yet</span>;
  const days = Math.floor((Date.now() - new Date(lastCheckIn.date)) / 86400000);
  const label = days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`;
  const color = days <= 7 ? 'text-emerald-600' : days <= 14 ? 'text-amber-500' : 'text-red-500';
  return <span className={cn('text-[10px] font-medium', color)}>{label}</span>;
}

/* ── Inline program assign dropdown (for quick action) ── */
function QuickAssignProgram({ client, onClose }) {
  const [selected, setSelected] = useState('');
  const queryClient = useQueryClient();

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.WorkoutProgram.list('-created_date', 20),
  });

  const assignMutation = useMutation({
    mutationFn: () => base44.entities.Client.update(client.id, { assigned_program_id: selected }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`Program assigned to ${client.name} ✓`);
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/10" />
      <div
        className="relative bg-white rounded-2xl shadow-xl p-4 w-72 space-y-3"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-sm font-bold text-[#1F2A44]">Assign Program</p>
        <p className="text-xs text-[#6B7280]">to {client.name}</p>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="border-[#E7EAF3] bg-[#F6F7FB] text-sm">
            <SelectValue placeholder="Choose a program…" />
          </SelectTrigger>
          <SelectContent>
            {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="flex-1 text-xs" disabled={!selected || assignMutation.isPending}
            onClick={() => assignMutation.mutate()}>
            {assignMutation.isPending ? '…' : 'Assign'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ClientRow ── */
export default function ClientRow({ client, score, lastCheckIn, checkInCount = 0, onEdit, onDelete, onStatusChange, onView, selected, onSelect }) {
  const [quickMsg, setQuickMsg] = useState(false);
  const [quickCheckIn, setQuickCheckIn] = useState(false);
  const [quickAssign, setQuickAssign] = useState(false);
  const queryClient = useQueryClient();

  const initials = (client.name || '?').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
  const [avatarBg, avatarText] = getAvatarColor(client.name);
  const scoreColor = score === null ? '' : score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500';
  const isLead = (client.lifecycle_status || 'lead') === 'lead';

  const markAtRisk = (e) => {
    e.stopPropagation();
    onStatusChange('at_risk');
    toast.success(`${client.name} marked as At Risk ⚠️`);
  };

  // Quick action icon buttons (desktop hover)
  const quickActions = (
    <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
      <button
        title="Quick Message"
        onClick={e => { e.stopPropagation(); setQuickMsg(true); }}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#EEF4FF] hover:text-primary transition-colors"
      >
        <MessageCircle className="w-3.5 h-3.5" />
      </button>
      <button
        title="Log Check-in"
        onClick={e => { e.stopPropagation(); setQuickCheckIn(true); }}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F0FDF4] hover:text-emerald-600 transition-colors"
      >
        <ClipboardList className="w-3.5 h-3.5" />
      </button>
      <button
        title="Assign Program"
        onClick={e => { e.stopPropagation(); setQuickAssign(true); }}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#EEF4FF] hover:text-blue-600 transition-colors"
      >
        <Dumbbell className="w-3.5 h-3.5" />
      </button>
      {(client.lifecycle_status !== 'at_risk') && (
        <button
          title="Mark At-Risk"
          onClick={markAtRisk}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 bg-white border-b border-[#F0F2F8] hover:bg-[#F8F9FD] transition-colors cursor-pointer group',
          selected && 'bg-[#EEF4FF] hover:bg-[#E4EDFF]'
        )}
        onClick={onView}
      >
        {/* Checkbox */}
        <div className="flex-shrink-0" onClick={e => { e.stopPropagation(); onSelect && onSelect(); }}>
          {selected
            ? <CheckSquare className="w-4 h-4 text-primary" />
            : <Square className="w-4 h-4 text-[#D1D5DB] opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>

        {/* Avatar */}
        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden', client.avatar_url ? '' : `${avatarBg} ${avatarText}`)}>
          {client.avatar_url
            ? <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
            : initials}
        </div>

        {/* Name + email + goal + tags */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-[#1F2A44] truncate leading-tight">{client.name}</p>
            <OnboardingDots client={client} checkIns={checkInCount} />
            {isLead && client.pipeline_stage && client.pipeline_stage !== 'new_lead' && (
              <span className={cn('text-[10px] font-bold flex-shrink-0', STAGE_COLORS[client.pipeline_stage])}>
                · {STAGE_LABELS[client.pipeline_stage]}
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B7280] truncate leading-tight">{client.email}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {client.goal ? (
              <span className="text-[10px] font-medium px-1.5 py-0 rounded-md bg-[#F0FDF4] text-emerald-700 flex-shrink-0">
                {GOAL_LABELS[client.goal] || client.goal}
              </span>
            ) : (
              <span className="text-[10px] text-[#C4C9D8] flex-shrink-0">No goal set</span>
            )}
            {(client.tags || []).slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] font-medium px-1.5 py-0 rounded-md bg-[#EEF4FF] text-primary flex-shrink-0">#{tag}</span>
            ))}
            {(client.tags || []).length > 2 && (
              <span className="text-[10px] text-[#9CA3AF]">+{client.tags.length - 2}</span>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="hidden sm:block flex-shrink-0">
          <LifecycleBadge status={client.lifecycle_status || 'lead'} />
        </div>

        {/* Adherence */}
        <div className="hidden md:flex flex-col items-end flex-shrink-0 w-20">
          {score !== null ? (
            <>
              <span className={cn('text-sm font-bold tabular-nums leading-tight', scoreColor)}>{score}%</span>
              <span className="text-[10px] text-[#9CA3AF]">adherence</span>
            </>
          ) : (
            <span className="text-xs text-[#C4C9D8]">—</span>
          )}
        </div>

        {/* Last check-in */}
        <div className="hidden lg:flex flex-col items-end flex-shrink-0 w-24">
          <CheckInAge lastCheckIn={lastCheckIn} />
          <span className="text-[10px] text-[#9CA3AF]">check-in</span>
        </div>

        {/* Quick actions (desktop hover) + more menu */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-1" onClick={e => e.stopPropagation()}>
          {quickActions}

          {/* View arrow (desktop only) */}
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-[#374151] hidden md:flex"
            onClick={onView}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>

          {/* Three-dot menu — always visible on mobile, also on desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-[#374151] md:flex">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setQuickMsg(true)}>
                <MessageCircle className="w-4 h-4 mr-2 text-primary" /> Quick Message
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickCheckIn(true)}>
                <ClipboardList className="w-4 h-4 mr-2 text-emerald-600" /> Log Check-in
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQuickAssign(true)}>
                <Dumbbell className="w-4 h-4 mr-2 text-blue-600" /> Assign Program
              </DropdownMenuItem>
              {client.lifecycle_status !== 'at_risk' && (
                <DropdownMenuItem onClick={markAtRisk}>
                  <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" /> Mark At-Risk
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1 text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wide">Move to Stage</div>
              {LIFECYCLE_ORDER.filter(s => s !== (client.lifecycle_status || 'lead')).map(s => (
                <DropdownMenuItem key={s} onClick={() => onStatusChange(s)}>
                  <span className={cn('w-2 h-2 rounded-full mr-2 flex-shrink-0 inline-block', {
                    'bg-amber-400': s === 'lead',
                    'bg-emerald-400': s === 'active',
                    'bg-red-400': s === 'at_risk',
                    'bg-blue-400': s === 'completed',
                    'bg-purple-400': s === 'alumni',
                  })} />
                  {LIFECYCLE_CONFIG[s].label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500" onClick={onDelete}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Modals / panels — rendered outside row to avoid z-index issues */}
      {quickMsg && (
        <QuickMessageModal
          clients={[client]}
          onClose={() => setQuickMsg(false)}
        />
      )}
      {quickCheckIn && (
        <QuickCheckInPanel
          client={client}
          onClose={() => setQuickCheckIn(false)}
        />
      )}
      {quickAssign && (
        <QuickAssignProgram
          client={client}
          onClose={() => setQuickAssign(false)}
        />
      )}
    </>
  );
}