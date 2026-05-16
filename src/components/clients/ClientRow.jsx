import React from 'react';
import { MoreHorizontal, Edit, Trash2, ArrowRight, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LifecycleBadge, { LIFECYCLE_CONFIG } from './LifecycleBadge';
import { cn } from '@/lib/utils';

const LIFECYCLE_ORDER = ['lead', 'active', 'at_risk', 'completed', 'alumni'];

// Small onboarding progress indicator
function OnboardingDots({ client, checkIns }) {
  const steps = [
    !!client.goal || !!client.height,          // intake
    !!client.assigned_program_id,              // program
    !!client.assigned_nutrition_id,            // nutrition
    checkIns > 0,                              // first check-in
  ];
  const done = steps.filter(Boolean).length;
  if (done === steps.length) return null; // fully onboarded — don't clutter the row
  return (
    <div className="flex items-center gap-0.5 ml-1" title={`Onboarding: ${done}/${steps.length} steps`}>
      {steps.map((s, i) => (
        <div key={i} className={cn('w-1.5 h-1.5 rounded-full', s ? 'bg-emerald-400' : 'bg-[#D1D5DB]')} />
      ))}
    </div>
  );
}

// Lead pipeline stage badge
const STAGE_COLORS = {
  new_lead: 'text-gray-500',
  dmd: 'text-blue-500',
  call_booked: 'text-amber-500',
  proposal_sent: 'text-purple-500',
  closed: 'text-emerald-600',
  lost: 'text-red-500',
};
const STAGE_LABELS = {
  new_lead: 'New', dmd: "DM'd", call_booked: 'Call', proposal_sent: 'Proposal', closed: 'Closed', lost: 'Lost',
};

const GOAL_LABELS = {
  weight_loss: 'Weight Loss',
  muscle_gain: 'Muscle Gain',
  strength: 'Strength',
  endurance: 'Endurance',
  flexibility: 'Flexibility',
  general_fitness: 'General Fitness',
};

const AVATAR_COLORS = [
  ['bg-blue-100', 'text-blue-700'],
  ['bg-violet-100', 'text-violet-700'],
  ['bg-emerald-100', 'text-emerald-700'],
  ['bg-amber-100', 'text-amber-700'],
  ['bg-rose-100', 'text-rose-700'],
  ['bg-cyan-100', 'text-cyan-700'],
];

function getAvatarColor(name = '') {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function CheckInAge({ lastCheckIn }) {
  if (!lastCheckIn) return (
    <span className="text-[10px] text-[#9CA3AF]">No check-ins yet</span>
  );
  const days = Math.floor((Date.now() - new Date(lastCheckIn.date)) / 86400000);
  const label = days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`;
  const color = days <= 7 ? 'text-emerald-600' : days <= 14 ? 'text-amber-500' : 'text-red-500';
  return <span className={cn('text-[10px] font-medium', color)}>{label}</span>;
}

/* ── Adherence bar (expanded view) ── */
function AdherenceBar({ score }) {
  if (score === null) return <div className="h-1 w-full rounded-full bg-[#F0F2F8] mt-1" />;
  const color = score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="h-1 w-full rounded-full bg-[#F0F2F8] mt-1 overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(score, 100)}%` }} />
    </div>
  );
}

export default function ClientRow({ client, score, lastCheckIn, checkInCount = 0, compact = false, onEdit, onDelete, onStatusChange, onView, selected, onSelect }) {
  const initials = (client.name || '?').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
  const [avatarBg, avatarText] = getAvatarColor(client.name);
  const scoreColor = score === null ? '' : score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500';
  const isLead = (client.lifecycle_status || 'lead') === 'lead';

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 bg-white border-b border-[#F0F2F8] hover:bg-[#F8F9FD] transition-colors cursor-pointer group',
        compact ? 'py-2' : 'py-3',
        selected && 'bg-[#EEF4FF] hover:bg-[#E4EDFF]'
      )}
      onClick={onView}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0" onClick={e => { e.stopPropagation(); onSelect?.(); }}>
        {selected
          ? <CheckSquare className="w-4 h-4 text-primary" />
          : <Square className="w-4 h-4 text-[#D1D5DB] opacity-0 group-hover:opacity-100 transition-opacity" />
        }
      </div>

      {/* Avatar */}
      <div className={cn(
        'rounded-full flex items-center justify-center font-bold flex-shrink-0 overflow-hidden',
        compact ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs',
        client.avatar_url ? '' : `${avatarBg} ${avatarText}`
      )}>
        {client.avatar_url
          ? <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
          : initials}
      </div>

      {/* Name + email + (expanded: goal/tags/bar) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn('font-bold text-[#1F2A44] truncate leading-tight', compact ? 'text-xs' : 'text-sm')}>{client.name}</p>
          {!compact && <OnboardingDots client={client} checkIns={checkInCount} />}
          {isLead && client.pipeline_stage && client.pipeline_stage !== 'new_lead' && (
            <span className={cn('text-[10px] font-bold flex-shrink-0', STAGE_COLORS[client.pipeline_stage])}>
              · {STAGE_LABELS[client.pipeline_stage]}
            </span>
          )}
        </div>
        <p className="text-xs text-[#6B7280] truncate leading-tight">{client.email}</p>

        {/* Expanded-only: goal + tags + adherence bar */}
        {!compact && (
          <>
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
            <AdherenceBar score={score} />
          </>
        )}
      </div>

      {/* Status badge */}
      <div className="hidden sm:block flex-shrink-0">
        <LifecycleBadge status={client.lifecycle_status || 'lead'} />
      </div>

      {/* Adherence number */}
      <div className="hidden md:flex flex-col items-end flex-shrink-0 w-20">
        {score !== null ? (
          <>
            <span className={cn('font-bold tabular-nums leading-tight', compact ? 'text-xs' : 'text-sm', scoreColor)}>{score}%</span>
            {compact && <span className="text-[10px] text-[#9CA3AF]">adherence</span>}
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

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-1" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-[#374151]" onClick={onView}>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-[#374151]">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
  );
}