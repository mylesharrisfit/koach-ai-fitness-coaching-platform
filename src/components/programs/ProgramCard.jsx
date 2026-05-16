import React, { useState } from 'react';
import {
  Clock, BarChart3, Dumbbell, MoreVertical, Users, Eye,
  Flame, Zap, Layers, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const DIFFICULTY_CONFIG = {
  beginner: {
    gradient: 'from-emerald-50 to-emerald-100/50',
    border: 'border-t-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  intermediate: {
    gradient: 'from-blue-50 to-blue-100/50',
    border: 'border-t-blue-400',
    badge: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  advanced: {
    gradient: 'from-purple-50 to-purple-100/50',
    border: 'border-t-purple-400',
    badge: 'bg-purple-50 text-purple-700 border-purple-100',
  },
  elite: {
    gradient: 'from-red-50 to-red-100/50',
    border: 'border-t-red-400',
    badge: 'bg-red-50 text-red-600 border-red-100',
  },
};

const CATEGORY_ICONS = {
  strength: Zap,
  hypertrophy: Layers,
  fat_loss: Flame,
  athletic: Target,
  mobility: Target,
  custom: Dumbbell,
};

function estSessionMins(program) {
  if (!program.workouts?.length) return null;
  const avgExercises = program.workouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0) / program.workouts.length;
  return Math.round(avgExercises * 5 + (program.workouts[0]?.exercises?.reduce((s, e) => s + (e.sets || 3) * ((e.rest_seconds || 60) / 60 + 1), 0) || 30));
}

export default function ProgramCard({
  program,
  clientsAssigned = [],
  clientsInProgress = [],
  onEdit,
  onDuplicate,
  onAssign,
  onPreview,
  onArchive,
  onDelete,
  allClients = [],
}) {
  const [hovered, setHovered] = useState(false);
  const [showClientList, setShowClientList] = useState(false);

  const config = DIFFICULTY_CONFIG[program.difficulty] || DIFFICULTY_CONFIG.beginner;
  const CatIcon = CATEGORY_ICONS[program.category] || CATEGORY_ICONS.custom;
  const estMins = estSessionMins(program);
  const workoutCount = program.workouts?.length || 0;
  const restDays = 7 - (program.days_per_week || 0);

  return (
    <div
      className={cn(
        'relative bg-white rounded-2xl border border-[#E7EAF3] overflow-hidden transition-all duration-200',
        'hover:border-blue-300 hover:shadow-lg hover:-translate-y-1',
        hovered && 'border-blue-300 shadow-lg -translate-y-1'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top border with difficulty color */}
      <div className={cn('absolute top-0 left-0 right-0 h-1', config.border)} />

      {/* Gradient background */}
      <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', config.gradient)} />

      {/* Content */}
      <div className="relative p-5 space-y-4">
        {/* Header: Title + Category Icon + Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#1F2A44] text-base leading-snug line-clamp-2">
              {program.title}
            </h3>
            {program.description && (
              <p className="text-xs text-[#6B7280] line-clamp-2 mt-1 leading-relaxed">
                {program.description}
              </p>
            )}
          </div>

          {/* Category icon in top right */}
          <div className="w-8 h-8 rounded-lg bg-white border border-[#E7EAF3] flex items-center justify-center flex-shrink-0">
            <CatIcon className="w-4 h-4 text-[#6B7280]" />
          </div>
        </div>

        {/* Difficulty + Category tags */}
        <div className="flex flex-wrap gap-1.5">
          <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-lg border capitalize', config.badge)}>
            {program.difficulty || 'custom'}
          </span>
          <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-lg border flex items-center gap-1', 
            program.category === 'strength' ? 'bg-purple-50 text-purple-700 border-purple-100' :
            program.category === 'hypertrophy' ? 'bg-blue-50 text-blue-700 border-blue-100' :
            program.category === 'fat_loss' ? 'bg-orange-50 text-orange-700 border-orange-100' :
            program.category === 'athletic' ? 'bg-teal-50 text-teal-700 border-teal-100' :
            program.category === 'mobility' ? 'bg-lime-50 text-lime-700 border-lime-100' :
            'bg-[#F6F7FB] text-[#374151] border-[#E7EAF3]'
          )}>
            {program.category?.charAt(0).toUpperCase() + program.category?.slice(1).replace('_', ' ')}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF] flex-wrap">
          {program.duration_weeks && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{program.duration_weeks} weeks</span>
            </div>
          )}
          {program.days_per_week && (
            <div className="flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{program.days_per_week}x/week</span>
            </div>
          )}
          {estMins && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>~{estMins}min/session</span>
            </div>
          )}
          {program.days_per_week && (
            <div className="flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5" />
              <span>{restDays} rest {restDays === 1 ? 'day' : 'days'}</span>
            </div>
          )}
        </div>

        {/* Progress indicator if clients in progress */}
        {clientsInProgress.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] bg-blue-50 border border-blue-100 rounded-lg px-2 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {clientsInProgress.length} client{clientsInProgress.length !== 1 ? 's' : ''} in progress
          </div>
        )}

        {/* Clients assigned chip + popover */}
        {clientsAssigned.length > 0 && (
          <Popover open={showClientList} onOpenChange={setShowClientList}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-[#F6F7FB] border border-[#E7EAF3] hover:bg-[#ECEEF5] transition-colors text-[#374151]">
                <Users className="w-3 h-3" />
                {clientsAssigned.length} client{clientsAssigned.length !== 1 ? 's' : ''}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="space-y-1">
                {clientsAssigned.map(client => (
                  <div key={client.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F6F7FB]">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {client.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs text-[#374151] truncate">{client.name}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Action buttons - hidden on desktop until hover, always visible on mobile */}
        <div className={cn(
          'flex gap-2 transition-all duration-200',
          'opacity-100 md:opacity-0 md:group-hover:opacity-100',
          hovered && 'md:opacity-100'
        )}>
          <Button
            onClick={onAssign}
            size="sm"
            className="flex-1 text-[11px] h-8 bg-primary hover:bg-primary/90"
          >
            Assign
          </Button>
          <Button
            onClick={onPreview}
            size="sm"
            variant="outline"
            className="flex-1 text-[11px] h-8"
          >
            <Eye className="w-3 h-3 mr-1" />
            Preview
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="w-8 h-8 p-0"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onEdit}>
                Edit Program
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                Duplicate Program
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}>
                Archive Program
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                Delete Program
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}