import React from 'react';
import { GripVertical, Copy, ArrowUp, ArrowDown, Trash2, Plus, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MUSCLE_BORDER_COLORS = {
  chest: 'border-l-red-400',
  back: 'border-l-green-500',
  legs: 'border-l-orange-500',
  shoulders: 'border-l-purple-500',
  full_body: 'border-l-blue-500',
  rest: 'border-l-gray-300',
};

export default function TrainingDayCard({
  day,
  index,
  isActive,
  onSelect,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddExercise,
  drag,
  isDragging,
  isLast,
}) {
  const exerciseCount = day.exercises?.filter(e => e.name)?.length || 0;
  const muscleGroup = day.muscle_focus || 'full_body';
  const borderColor = MUSCLE_BORDER_COLORS[muscleGroup] || MUSCLE_BORDER_COLORS.full_body;

  return (
    <div
      ref={drag.innerRef}
      {...drag.draggableProps}
      className={cn(
        'bg-white border-2 border-l-4 rounded-2xl p-4 transition-all',
        isActive
          ? 'border-primary shadow-lg'
          : 'border-[#E7EAF3] hover:border-[#D1D5DB]',
        isDragging && 'shadow-lg opacity-50',
        borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div {...drag.dragHandleProps} className="flex-shrink-0">
          <GripVertical className="w-4 h-4 text-[#D1D5DB]" />
        </div>

        {/* Day name — inline editable */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-[#1F2A44]">{day.day_name}</h3>
          <p className="text-xs text-[#9CA3AF]">{exerciseCount} exercises</p>
        </div>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex-shrink-0 p-1 hover:bg-[#F6F7FB] rounded-lg transition-colors">
              <MoreHorizontal className="w-4 h-4 text-[#9CA3AF]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onDuplicate} className="gap-2">
              <Copy className="w-4 h-4" />
              Duplicate Day
            </DropdownMenuItem>
            {index > 0 && (
              <DropdownMenuItem onClick={onMoveUp} className="gap-2">
                <ArrowUp className="w-4 h-4" />
                Move Up
              </DropdownMenuItem>
            )}
            {!isLast && (
              <DropdownMenuItem onClick={onMoveDown} className="gap-2">
                <ArrowDown className="w-4 h-4" />
                Move Down
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDelete} className="gap-2 text-red-600 focus:text-red-600">
              <Trash2 className="w-4 h-4" />
              Delete Day
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Exercises — simplified list */}
      {exerciseCount === 0 ? (
        <div className="text-center py-6 text-[#9CA3AF]">
          <p className="text-xs font-medium mb-3">No exercises yet</p>
          <button
            onClick={onAddExercise}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-primary bg-[#EEF4FF] rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add first exercise
          </button>
        </div>
      ) : (
        <div className="space-y-2 mb-3">
          {day.exercises
            ?.filter(e => e.name)
            ?.slice(0, 3)
            .map((ex, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-[#F6F7FB] rounded-lg text-xs">
                <span className="font-medium text-[#1F2A44] flex-1 truncate">{ex.name}</span>
                <span className="text-[#9CA3AF]">{ex.sets}×{ex.reps}</span>
              </div>
            ))}
          {exerciseCount > 3 && (
            <p className="text-xs text-[#9CA3AF] px-2 py-1">+{exerciseCount - 3} more</p>
          )}
        </div>
      )}

      {/* Add Exercise Button */}
      <button
        onClick={onAddExercise}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[#D1D5DB] text-xs text-[#9CA3AF] hover:text-primary hover:border-primary hover:bg-[#EEF4FF]/30 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Exercise
      </button>
    </div>
  );
}