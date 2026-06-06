import React from 'react';

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

const PROGRAM_TAGS = {
  strength:    ['Progressive overload', 'Compound lifts', 'Strength + conditioning'],
  hypertrophy: ['Progressive overload', 'Volume-focused', 'Muscle hypertrophy'],
  fat_loss:    ['Caloric deficit', 'HIIT intervals', 'Strength + conditioning'],
  athletic:    ['Explosive power', 'Sport-specific', 'Conditioning'],
  mobility:    ['Flexibility', 'Joint health', 'Active recovery'],
  custom:      ['Custom program', 'Coach-designed'],
};

export default function ProgramOverviewTab({ program }) {
  const allEquipment = new Set();
  program.workouts?.forEach(w => {
    w.exercises?.forEach(e => {
      if (e.equipment) allEquipment.add(e.equipment);
    });
  });

  const tags = PROGRAM_TAGS[program.category] || PROGRAM_TAGS.custom;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Description + tags */}
      {program.description && (
        <div>
          <p className="text-sm text-[#374151] leading-relaxed mb-3">{program.description}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: '#EEF2FF', color: '#3730a3' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Equipment */}
      {allEquipment.size > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-3">Equipment Needed</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(allEquipment).map((equip) => (
              <div
                key={equip}
                className="flex items-center gap-2 px-3 py-2 bg-[#F3F4F6] rounded-lg text-sm text-[#1F2A44]"
              >
                <span className="text-base">{EQUIPMENT_ICONS[equip] || '⚙️'}</span>
                <span className="capitalize">{equip.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Audience */}
      {program.target_audience && (
        <div className="p-4 rounded-xl bg-blue-50 border-l-4 border-blue-500">
          <h3 className="font-semibold text-blue-900 mb-1 text-sm">Who Is This Program For?</h3>
          <p className="text-sm text-blue-800 leading-relaxed">{program.target_audience}</p>
        </div>
      )}

      {/* Goals & Results */}
      {program.goals && (
        <div className="p-4 rounded-xl bg-emerald-50 border-l-4 border-emerald-500">
          <h3 className="font-semibold text-emerald-900 mb-1 text-sm">Program Goals & Expected Results</h3>
          <p className="text-sm text-emerald-800 leading-relaxed">{program.goals}</p>
        </div>
      )}

      {/* Progression Model */}
      {program.progression_model && (
        <div className="p-4 rounded-xl bg-purple-50 border-l-4 border-purple-500">
          <h3 className="font-semibold text-purple-900 mb-1 text-sm">Progression Model</h3>
          <p className="text-sm text-purple-800 leading-relaxed">{program.progression_model}</p>
        </div>
      )}

      {!program.description && !program.target_audience && !program.goals && !program.progression_model && (
        <div className="text-center py-12 text-[#9CA3AF]">
          <p className="text-sm">No additional details available for this program yet.</p>
        </div>
      )}
    </div>
  );
}