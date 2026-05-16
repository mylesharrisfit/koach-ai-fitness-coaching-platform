import React from 'react';
import { MoreHorizontal, Edit, Trash2, ArrowRight, CheckSquare, Square, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LifecycleBadge, { LIFECYCLE_CONFIG } from './LifecycleBadge';
import { AdherencePill } from '@/components/adherence/AdherenceScore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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

export default function ClientRow({ client, score, lastCheckIn, checkInCount = 0, onEdit, onDelete, onStatusChange, onView, selected, onSelect }) {
  const initials = client.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
  const scoreColor = score === null ? '' : score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500';
  const lastCheckInText = lastCheckIn ? formatDistanceToNow(new Date(lastCheckIn.date), { addSuffix: true }) : 'Never';
  const isLead = (client.lifecycle_status || 'lead') === 'lead';

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-white border-b border-[#F0F2F8] hover:bg-[#F8F9FD] transition-colors cursor-pointer group',
        selected && 'bg-[#EEF4FF] hover:bg-[#E4EDFF]'
      )}
      onClick={onView}
    >
      {/* Checkbox */}
      <div
        className="flex-shrink-0"
        onClick={e => { e.stopPropagation(); onSelect && onSelect(); }}
      >
        {selected
          ? <CheckSquare className="w-4 h-4 text-primary" />
          : <Square className="w-4 h-4 text-[#D1D5DB] opacity-0 group-hover:opacity-100 transition-opacity" />
        }
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-[#EEF4FF] text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden">
        {client.avatar_url
          ? <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
          : initials}
      </div>

      {/* Name + email + tags + onboarding dots */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold text-[#1F2A44] truncate leading-tight">{client.name}</p>
          <OnboardingDots client={client} checkIns={checkInCount} />
          {isLead && client.pipeline_stage && client.pipeline_stage !== 'new_lead' && (
            <span className={cn('text-[10px] font-bold', STAGE_COLORS[client.pipeline_stage])}>
              · {STAGE_LABELS[client.pipeline_stage]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs text-[#6B7280] truncate leading-tight">{client.email}</p>
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
        <span className="text-xs text-[#374151] leading-tight">{lastCheckInText}</span>
        <span className="text-[10px] text-[#9CA3AF]">check-in</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-1" onClick={e => e.stopPropagation()}>
        <Button
          variant="ghost" size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-[#374151]"
          onClick={onView}
        >
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