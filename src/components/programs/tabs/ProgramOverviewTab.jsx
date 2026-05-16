import React from 'react';
import { Card } from '@/components/ui/card';

const EQUIPMENT_ICONS = {
  barbell: '🏋️',
  dumbbell: '🪑',
  cable: '⚙️',
  machine: '🤖',
  bodyweight: '💪',
  kettlebell: '🔔',
  resistance_band: '📎',
  trx: '🪢',
};

export default function ProgramOverviewTab({ program }) {
  // Extract unique equipment from all exercises
  const allEquipment = new Set();
  program.workouts?.forEach(w => {
    w.exercises?.forEach(e => {
      if (e.equipment) allEquipment.add(e.equipment);
    });
  });

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Program Description */}
      {program.description && (
        <Card className="p-4 sm:p-6 border-0 bg-[#F9FAFB]">
          <h3 className="font-semibold text-[#1F2A44] mb-2">About This Program</h3>
          <p className="text-sm text-[#6B7280] leading-relaxed">{program.description}</p>
        </Card>
      )}

      {/* Equipment */}
      {allEquipment.size > 0 && (
        <div>
          <h3 className="font-semibold text-[#1F2A44] mb-3">Equipment Needed</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(allEquipment).map((equip) => (
              <div
                key={equip}
                className="flex items-center gap-2 px-3 py-2 bg-[#F3F4F6] rounded-lg text-sm text-[#1F2A44]"
              >
                <span className="text-lg">{EQUIPMENT_ICONS[equip] || '⚙️'}</span>
                <span className="capitalize">{equip.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Audience */}
      {program.target_audience && (
        <Card className="p-4 sm:p-6 border-0 bg-blue-50 border-l-4 border-blue-500">
          <h3 className="font-semibold text-blue-900 mb-2">Who Is This Program For?</h3>
          <p className="text-sm text-blue-800 leading-relaxed">{program.target_audience}</p>
        </Card>
      )}

      {/* Goals & Results */}
      {program.goals && (
        <Card className="p-4 sm:p-6 border-0 bg-emerald-50 border-l-4 border-emerald-500">
          <h3 className="font-semibold text-emerald-900 mb-2">Program Goals & Expected Results</h3>
          <p className="text-sm text-emerald-800 leading-relaxed">{program.goals}</p>
        </Card>
      )}

      {/* Progression Model */}
      {program.progression_model && (
        <Card className="p-4 sm:p-6 border-0 bg-purple-50 border-l-4 border-purple-500">
          <h3 className="font-semibold text-purple-900 mb-2">Progression Model</h3>
          <p className="text-sm text-purple-800 leading-relaxed">{program.progression_model}</p>
        </Card>
      )}

      {/* Default Info if no details */}
      {!program.description && !program.target_audience && !program.goals && !program.progression_model && (
        <div className="text-center py-12 text-[#9CA3AF]">
          <p className="text-sm">No additional details available for this program yet.</p>
        </div>
      )}
    </div>
  );
}