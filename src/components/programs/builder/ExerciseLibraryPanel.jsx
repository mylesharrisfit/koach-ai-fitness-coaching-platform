import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Dumbbell, Plus } from 'lucide-react';

const MUSCLE_COLORS = {
  chest: 'bg-red-50 text-red-600',
  back: 'bg-emerald-50 text-emerald-700',
  shoulders: 'bg-purple-50 text-purple-700',
  biceps: 'bg-blue-50 text-blue-700',
  triceps: 'bg-blue-50 text-blue-700',
  legs: 'bg-orange-50 text-orange-700',
  glutes: 'bg-orange-50 text-orange-700',
  core: 'bg-amber-50 text-amber-700',
  full_body: 'bg-indigo-50 text-indigo-700',
  cardio: 'bg-teal-50 text-teal-700',
};

export default function ExerciseLibraryPanel({ onAddExercise }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercise-library'],
    queryFn: () => base44.entities.ExerciseLibrary.list(),
  });

  const muscles = ['All', ...Array.from(new Set(exercises.map(e => e.muscle_group).filter(Boolean)))];

  const filtered = exercises.filter(ex => {
    const matchMuscle = filter === 'All' || ex.muscle_group === filter;
    const matchSearch = !search || ex.name?.toLowerCase().includes(search.toLowerCase());
    return matchMuscle && matchSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white" style={{ borderRight: '1px solid #E7EAF3' }}>
      {/* Panel header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid #F3F4F6' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">Exercise Library</p>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-8 text-xs pl-8 pr-3 rounded-lg bg-[#F6F7FB] border border-[#E7EAF3] focus:outline-none focus:border-blue-400 placeholder:text-[#C4C9D4]"
          />
        </div>
        {/* Muscle filter chips */}
        <div className="flex gap-1 mt-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {muscles.slice(0, 8).map(m => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className="text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap transition-colors flex-shrink-0"
              style={{
                background: filter === m ? '#2563EB' : '#F3F4F6',
                color: filter === m ? '#fff' : '#6B7280',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <Dumbbell className="w-6 h-6 text-[#D1D5DB]" />
            <p className="text-xs text-[#9CA3AF]">No exercises found</p>
          </div>
        ) : (
          filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => onAddExercise(ex)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-transparent hover:border-blue-200 hover:bg-blue-50/40 transition-all text-left group"
            >
              <div className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border group-hover:border-blue-200">
                <Dumbbell className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#2563EB]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#1F2A44] truncate">{ex.name}</p>
                {ex.muscle_group && (
                  <p className="text-[10px] text-[#9CA3AF] capitalize">{ex.muscle_group}</p>
                )}
              </div>
              <div className="w-5 h-5 rounded-full bg-[#EEF2FF] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Plus className="w-3 h-3 text-[#2563EB]" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Count */}
      <div className="px-4 py-2 border-t border-[#F3F4F6] flex-shrink-0">
        <p className="text-[10px] text-[#9CA3AF]">{filtered.length} exercises</p>
      </div>
    </div>
  );
}