import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Dumbbell, X, ChevronDown, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

const MUSCLE_OPTIONS = ['chest','back','shoulders','biceps','triceps','legs','glutes','core','full_body','cardio'];
const EQUIPMENT_OPTIONS = ['barbell','dumbbell','cable','machine','bodyweight','kettlebell','resistance_band','trx'];

const MUSCLE_COLORS = {
  chest:     'bg-red-50 text-red-600',
  back:      'bg-emerald-50 text-emerald-700',
  shoulders: 'bg-purple-50 text-purple-700',
  biceps:    'bg-blue-50 text-blue-700',
  triceps:   'bg-blue-50 text-blue-700',
  legs:      'bg-orange-50 text-orange-700',
  glutes:    'bg-orange-50 text-orange-700',
  core:      'bg-amber-50 text-amber-700',
  full_body: 'bg-indigo-50 text-indigo-700',
  cardio:    'bg-teal-50 text-teal-700',
};

export default function ExercisePickerModal({ open, onClose, onPickExercise, onAddCustom, dayName }) {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [equipFilter, setEquipFilter] = useState('');
  const [showEquipDrop, setShowEquipDrop] = useState(false);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercise-library'],
    queryFn: () => base44.entities.ExerciseLibrary.list(),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const filtered = useMemo(() => {
    return exercises.filter(ex => {
      if (muscleFilter && ex.muscle_group !== muscleFilter) return false;
      if (equipFilter && ex.equipment !== equipFilter) return false;
      if (search && !ex.name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [exercises, muscleFilter, equipFilter, search]);

  if (!open) return null;

  const handlePick = (ex) => {
    onPickExercise(ex);
    onClose();
  };

  const handleCustom = () => {
    onAddCustom();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ height: '85vh', maxHeight: '640px', boxShadow: '0 -4px 40px rgba(0,0,0,0.15)' }}>

        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3" style={{ background: '#0E1525' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">Add Exercise</p>
              <h3 className="text-sm font-bold text-white">{dayName ? `→ ${dayName}` : 'Pick from library'}</h3>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <X className="w-3.5 h-3.5 text-white/70" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              autoFocus
              type="text"
              placeholder="Search exercises..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 text-sm pl-9 pr-3 rounded-xl text-white placeholder:text-white/30 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex-shrink-0 px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide"
          style={{ background: '#F8F9FB', borderBottom: '0.5px solid #E2E5EC' }}>

          {/* Muscle chips */}
          <button onClick={() => setMuscleFilter('')}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 transition-colors"
            style={{ background: !muscleFilter ? '#2563EB' : '#F3F4F6', color: !muscleFilter ? '#fff' : '#6B7280' }}>
            All
          </button>
          {MUSCLE_OPTIONS.map(m => (
            <button key={m} onClick={() => setMuscleFilter(muscleFilter === m ? '' : m)}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 capitalize transition-colors"
              style={{ background: muscleFilter === m ? '#2563EB' : '#F3F4F6', color: muscleFilter === m ? '#fff' : '#6B7280' }}>
              {m.replace(/_/g, ' ')}
            </button>
          ))}

          {/* Equipment dropdown */}
          <div className="relative flex-shrink-0 ml-1">
            <button onClick={() => setShowEquipDrop(v => !v)}
              className="h-6 flex items-center gap-1 px-2.5 rounded-full text-[10px] font-semibold transition-colors"
              style={{ background: equipFilter ? '#2563EB' : '#F3F4F6', color: equipFilter ? '#fff' : '#6B7280', border: '0.5px solid #E2E5EC' }}>
              <span className="capitalize">{equipFilter ? equipFilter.replace(/_/g, ' ') : 'Equipment'}</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
            {showEquipDrop && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#E7EAF3] rounded-xl shadow-xl z-20 py-1 min-w-[130px]">
                <button onClick={() => { setEquipFilter(''); setShowEquipDrop(false); }}
                  className="w-full text-left px-3 py-1.5 text-[10px] text-[#9CA3AF] font-semibold hover:bg-[#F6F7FB]">All</button>
                {EQUIPMENT_OPTIONS.map(e => (
                  <button key={e} onClick={() => { setEquipFilter(e); setShowEquipDrop(false); }}
                    className={cn('w-full text-left px-3 py-1.5 text-[10px] capitalize font-medium hover:bg-[#F6F7FB]',
                      equipFilter === e ? 'text-[#2563EB] font-bold' : 'text-[#374151]')}>
                    {e.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-xs text-[#9CA3AF]">Loading library...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <Dumbbell className="w-8 h-8 text-[#D1D5DB]" />
              <p className="text-sm text-[#9CA3AF]">No exercises match your filters</p>
              <button onClick={() => { setSearch(''); setMuscleFilter(''); setEquipFilter(''); }}
                className="text-xs text-[#2563EB] font-semibold">Clear filters</button>
            </div>
          ) : (
            <div className="divide-y divide-[#F6F7FB]">
              {filtered.map(ex => {
                const thumb = ex.thumbnail_url || ex.image_url;
                const muscleClass = MUSCLE_COLORS[ex.muscle_group] || 'bg-gray-50 text-gray-600';
                return (
                  <button
                    key={ex.id}
                    onClick={() => handlePick(ex)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/40 transition-colors text-left"
                  >
                    {/* Thumbnail */}
                    <div className="w-11 h-11 rounded-xl flex-shrink-0 overflow-hidden" style={{ background: '#0E1525' }}>
                      {thumb ? (
                        <img src={thumb} alt={ex.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Dumbbell className="w-5 h-5 text-[#4B5563]" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0E1525] truncate">{ex.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {ex.muscle_group && (
                          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize', muscleClass)}>
                            {ex.muscle_group.replace(/_/g, ' ')}
                          </span>
                        )}
                        {ex.equipment && (
                          <span className="text-[10px] text-[#9CA3AF] capitalize">{ex.equipment.replace(/_/g, ' ')}</span>
                        )}
                        {ex.difficulty && (
                          <span className="text-[10px] text-[#C4C9D4] capitalize">· {ex.difficulty}</span>
                        )}
                      </div>
                    </div>

                    {/* Add indicator */}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#EEF4FF' }}>
                      <span className="text-sm font-bold text-[#2563EB]">+</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom exercise fallback */}
        <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: '0.5px solid #E2E5EC', background: '#F8F9FB' }}>
          <button
            onClick={handleCustom}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-[#6B7280] hover:text-[#374151] hover:bg-white transition-all"
            style={{ border: '1.5px dashed #D1D5DB' }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Add custom exercise (type a name manually)
          </button>
        </div>
      </div>
    </div>
  );
}