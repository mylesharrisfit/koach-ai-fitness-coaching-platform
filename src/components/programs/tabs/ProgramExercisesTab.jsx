import React, { useState, useMemo } from 'react';
import { Info, Zap } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

const MUSCLE_GROUP_COLOR = {
  chest: 'bg-red-100 text-red-700',
  back: 'bg-blue-100 text-blue-700',
  shoulders: 'bg-purple-100 text-purple-700',
  biceps: 'bg-orange-100 text-orange-700',
  triceps: 'bg-pink-100 text-pink-700',
  legs: 'bg-teal-100 text-teal-700',
  glutes: 'bg-lime-100 text-lime-700',
  core: 'bg-yellow-100 text-yellow-700',
  full_body: 'bg-indigo-100 text-indigo-700',
  cardio: 'bg-cyan-100 text-cyan-700',
};

const EQUIPMENT_ICON = {
  barbell: '🏋️',
  dumbbell: '🪑',
  cable: '⚙️',
  machine: '🤖',
  bodyweight: '💪',
  kettlebell: '🔔',
  resistance_band: '📎',
  trx: '🪢',
};

export default function ProgramExercisesTab({ program }) {
  const [expandedExercises, setExpandedExercises] = useState(new Set());

  // Extract unique exercises with count
  const exercisesMap = useMemo(() => {
    const map = new Map();
    program.workouts?.forEach(w => {
      w.exercises?.forEach(e => {
        if (!map.has(e.name)) {
          map.set(e.name, { ...e, count: 0 });
        }
        const ex = map.get(e.name);
        ex.count++;
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [program.workouts]);

  const toggleExercise = (exerciseName) => {
    const newSet = new Set(expandedExercises);
    if (newSet.has(exerciseName)) newSet.delete(exerciseName);
    else newSet.add(exerciseName);
    setExpandedExercises(newSet);
  };

  if (!exercisesMap.length) {
    return (
      <div className="text-center py-12 text-[#9CA3AF]">
        <p className="text-sm">No exercises defined for this program yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl">
      {exercisesMap.map((exercise, idx) => {
        const isExpanded = expandedExercises.has(exercise.name);

        return (
          <div key={idx} className="border border-[#E7EAF3] rounded-lg overflow-hidden hover:border-blue-200 transition-colors">
            <button
              onClick={() => toggleExercise(exercise.name)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors text-left"
            >
              {/* Chevron would go here but keeping simple */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[#1F2A44]">{exercise.name}</h4>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {exercise.muscle_group && (
                    <Badge
                      className={`text-xs capitalize ${MUSCLE_GROUP_COLOR[exercise.muscle_group] || 'bg-gray-100 text-gray-700'}`}
                      variant="secondary"
                    >
                      {exercise.muscle_group.replace('_', ' ')}
                    </Badge>
                  )}
                  {exercise.equipment && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {EQUIPMENT_ICON[exercise.equipment]} {exercise.equipment.replace('_', ' ')}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs ml-auto">
                    Used {exercise.count}x
                  </Badge>
                </div>
              </div>
              {exercise.notes && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      {exercise.notes}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </button>

            {/* Exercise Details */}
            {isExpanded && (
              <div className="px-4 py-4 bg-white border-t border-[#E7EAF3] space-y-3 text-sm">
                {exercise.description && (
                  <div>
                    <p className="text-[#6B7280]">{exercise.description}</p>
                  </div>
                )}

                {exercise.form_cues?.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-[#1F2A44] mb-2">Form Cues</h5>
                    <ul className="space-y-1">
                      {exercise.form_cues.map((cue, cIdx) => (
                        <li key={cIdx} className="text-[#6B7280] flex gap-2">
                          <Zap className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                          {cue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {exercise.common_mistakes?.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-red-700 mb-2">Common Mistakes</h5>
                    <ul className="space-y-1">
                      {exercise.common_mistakes.map((mistake, mIdx) => (
                        <li key={mIdx} className="text-red-600 text-xs flex gap-2">
                          <span className="flex-shrink-0">❌</span>
                          {mistake}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {exercise.movement_pattern && (
                  <div className="text-xs">
                    <span className="text-[#6B7280]">Movement: </span>
                    <span className="font-semibold text-[#1F2A44] capitalize">{exercise.movement_pattern.replace('_', ' ')}</span>
                  </div>
                )}

                {exercise.difficulty && (
                  <div className="text-xs">
                    <span className="text-[#6B7280]">Difficulty: </span>
                    <span className="font-semibold text-[#1F2A44] capitalize">{exercise.difficulty}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}