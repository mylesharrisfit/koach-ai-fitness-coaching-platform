import React from 'react';
import { Clock, BarChart3, MoreVertical, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const DIFFICULTY_BADGE = {
  beginner: 'bg-success/10 text-success border-success',
  intermediate: 'bg-accent text-primary border-accent',
  advanced: 'bg-ai/10 text-ai border-ai',
  elite: 'bg-destructive/10 text-destructive border-destructive',
};

const CATEGORY_COLOR = {
  strength: 'text-ai',
  hypertrophy: 'text-primary',
  fat_loss: 'text-orange-600',
  athletic: 'text-teal-600',
  mobility: 'text-lime-600',
  custom: 'text-muted-foreground',
};

function estSessionMins(program) {
  if (!program.workouts?.length) return null;
  const avgExercises = program.workouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0) / program.workouts.length;
  return Math.round(avgExercises * 5 + (program.workouts[0]?.exercises?.reduce((s, e) => s + (e.sets || 3) * ((e.rest_seconds || 60) / 60 + 1), 0) || 30));
}

export default function ProgramListRow({
  program,
  clientsAssigned = [],
  clientsInProgress = [],
  onEdit,
  onDuplicate,
  onAssign,
  onPreview,
  onArchive,
  onDelete,
}) {
  const estMins = estSessionMins(program);
  const restDays = 7 - (program.days_per_week || 0);

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-card border border-border rounded-lg hover:border-primary hover:shadow-sm transition-all">
      {/* Difficulty Badge */}
      <div className="w-20 flex-shrink-0">
        <span className={cn('text-[11px] font-semibold px-2 py-1 rounded-lg border capitalize inline-block', DIFFICULTY_BADGE[program.difficulty] || DIFFICULTY_BADGE.beginner)}>
          {program.difficulty || 'custom'}
        </span>
      </div>

      {/* Title & Description */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-foreground truncate">{program.title}</h4>
        {program.description && (
          <p className="text-xs text-muted-foreground truncate">{program.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
        {program.duration_weeks && (
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5" />
            {program.duration_weeks}w
          </span>
        )}
        {program.days_per_week && (
          <span className="flex items-center gap-1 whitespace-nowrap">
            <BarChart3 className="w-3.5 h-3.5" />
            {program.days_per_week}x/wk
          </span>
        )}
        {estMins && (
          <span className="whitespace-nowrap">~{estMins}m</span>
        )}
      </div>

      {/* Clients Assigned */}
      <div className="w-20 flex-shrink-0 text-center">
        {clientsAssigned.length > 0 ? (
          <span className="text-xs font-semibold text-foreground">
            {clientsAssigned.length} client{clientsAssigned.length !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

      {/* Progress */}
      <div className="w-24 flex-shrink-0 text-center">
        {clientsInProgress.length > 0 ? (
          <span className="text-xs font-medium text-primary">
            {clientsInProgress.length} in progress
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Button
          onClick={onAssign}
          size="sm"
          variant="outline"
          className="text-[11px] h-7 px-2"
        >
          Assign
        </Button>
        <Button
          onClick={onPreview}
          size="sm"
          variant="ghost"
          className="text-[11px] h-7 w-7 p-0"
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="text-[11px] h-7 w-7 p-0"
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
  );
}