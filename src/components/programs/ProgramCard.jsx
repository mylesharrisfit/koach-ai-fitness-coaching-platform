import React, { useState } from 'react';
import { BarChart3, Dumbbell, MoreVertical, Users,
  Flame, Zap, Layers, Target, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/* ── Goal-based colour palette ── */
const CATEGORY_CONFIG = {
  strength:    { bg: '#E6F1FB', icon: '#185FA5', Icon: Zap,     label: 'Strength'    },
  hypertrophy: { bg: '#EEEDFE', icon: '#3C3489', Icon: Layers,  label: 'Hypertrophy' },
  fat_loss:    { bg: '#FAECE7', icon: '#993C1D', Icon: Flame,   label: 'Fat Loss'    },
  athletic:    { bg: '#E6FBF3', icon: '#1A6B4A', Icon: Target,  label: 'Athletic'    },
  mobility:    { bg: '#F0FBE6', icon: '#3A6B1A', Icon: Target,  label: 'Mobility'    },
  custom:      { bg: '#F3F4F6', icon: '#6B7280', Icon: Dumbbell, label: 'Custom'     },
};

const DIFFICULTY_BADGE = {
  beginner:     'bg-emerald-50 text-emerald-700',
  intermediate: 'bg-blue-50 text-blue-700',
  advanced:     'bg-purple-50 text-purple-700',
  elite:        'bg-red-50 text-red-600',
};

export default function ProgramCard({
  program,
  clientsAssigned = [],
  onEdit,
  onDuplicate,
  onAssign,
  onPreview,
  onArchive,
  onDelete,
}) {
  const [showClients, setShowClients] = useState(false);

  const cat = CATEGORY_CONFIG[program.category] || CATEGORY_CONFIG.custom;
  const CatIcon = cat.Icon;
  const diffBadge = DIFFICULTY_BADGE[program.difficulty] || 'bg-gray-50 text-gray-600';
  const MAX_AVATARS = 3;
  const shown = clientsAssigned.slice(0, MAX_AVATARS);
  const extra = clientsAssigned.length - MAX_AVATARS;

  return (
    <div
      className="bg-white rounded-xl flex flex-col transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
      style={{ border: '0.5px solid #E2E5EC' }}
    >
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* ── Top row: icon tile + menu ── */}
        <div className="flex items-start justify-between">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: cat.bg }}
          >
            <CatIcon className="w-5 h-5" style={{ color: cat.icon }} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-[#C4C9D4] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onPreview}>Preview</DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>Edit Program</DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>Duplicate</DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}>Archive</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Title + goal pill ── */}
        <div>
          <h3 className="text-sm font-bold text-[#0E1525] leading-snug line-clamp-2 mb-1.5">
            {program.title}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: cat.bg, color: cat.icon }}
            >
              {cat.label}
            </span>
            {program.difficulty && (
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize', diffBadge)}>
                {program.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* ── Meta row ── */}
        <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
          {program.duration_weeks && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{program.duration_weeks}w</span>
            </div>
          )}
          {program.days_per_week && (
            <div className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              <span>{program.days_per_week}×/wk</span>
            </div>
          )}
          {program.difficulty && (
            <div className="flex items-center gap-1">
              <Dumbbell className="w-3 h-3" />
              <span className="capitalize">{program.difficulty}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Divider + Footer ── */}
      <div style={{ borderTop: '0.5px solid #F3F4F6' }}>
        <div className="px-4 py-3 flex items-center justify-between gap-2">

          {/* Client avatar stack or Unassigned pill */}
          {clientsAssigned.length === 0 ? (
            <span className="text-[10px] font-medium text-[#9CA3AF] bg-[#F3F4F6] px-2.5 py-1 rounded-full">
              Unassigned
            </span>
          ) : (
            <Popover open={showClients} onOpenChange={setShowClients}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                  {/* Overlapping avatars */}
                  <div className="flex -space-x-1.5">
                    {shown.map(c => (
                      <div
                        key={c.id}
                        className="w-6 h-6 rounded-full bg-[#EEF4FF] text-[#2563EB] text-[9px] font-bold flex items-center justify-center ring-2 ring-white flex-shrink-0"
                      >
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-[#6B7280]">
                    {clientsAssigned.length} client{clientsAssigned.length !== 1 ? 's' : ''}
                    {extra > 0 && ` +${extra}`}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2" align="start">
                <div className="space-y-1">
                  {clientsAssigned.map(c => (
                    <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F6F7FB]">
                      <div className="w-6 h-6 rounded-full bg-[#EEF4FF] text-[#2563EB] text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs text-[#374151] truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Assign button */}
          <button
            onClick={onAssign}
            className="flex items-center gap-1 text-[11px] font-semibold text-white px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90 flex-shrink-0"
            style={{ background: '#2563EB' }}
          >
            <Users className="w-3 h-3" /> Assign
          </button>
        </div>
      </div>
    </div>
  );
}