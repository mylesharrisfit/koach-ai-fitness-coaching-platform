import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dumbbell, Calendar, ChevronRight, Layers, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const DIFFICULTY_STYLES = {
  beginner:     'bg-emerald-50 text-emerald-700 border-emerald-100',
  intermediate: 'bg-blue-50 text-blue-700 border-blue-100',
  advanced:     'bg-orange-50 text-orange-700 border-orange-100',
  elite:        'bg-red-50 text-red-700 border-red-100',
};

export default function ProfileProgramsTab({ client }) {
  const navigate = useNavigate();
  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['workout-programs'],
    queryFn: () => base44.entities.WorkoutProgram.list(),
  });

  const assigned = programs.find(p => p.id === client.assigned_program_id);

  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-[#E7EAF3] animate-pulse" />)}
    </div>
  );

  if (!assigned) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F6F7FB] border border-[#E7EAF3] flex items-center justify-center mb-4">
        <Dumbbell className="w-7 h-7 text-[#9CA3AF]" />
      </div>
      <p className="text-sm font-semibold text-[#1F2A44] mb-1">No program assigned</p>
      <p className="text-xs text-[#9CA3AF] mb-5">Assign a training program to get started</p>
      <Button size="sm" variant="outline" onClick={() => navigate('/programs')} className="gap-1.5">
        <Dumbbell className="w-3.5 h-3.5" /> Browse Programs
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Program header card */}
      <div className="bg-white rounded-2xl border border-[#E7EAF3] overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-[#F6F7FB]">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Dumbbell className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="text-xs font-bold text-[#374151] uppercase tracking-wider">Assigned Program</h3>
        </div>

        <div className="p-4">
          {assigned.image_url && (
            <div className="w-full h-32 rounded-xl overflow-hidden mb-4 border border-[#E7EAF3]">
              <img src={assigned.image_url} alt={assigned.title} className="w-full h-full object-cover" />
            </div>
          )}

          <h2 className="text-base font-bold text-[#1F2A44] mb-1">{assigned.title}</h2>
          {assigned.description && (
            <p className="text-sm text-[#6B7280] mb-3 leading-relaxed">{assigned.description}</p>
          )}

          <div className="flex flex-wrap gap-1.5 mb-4">
            {assigned.difficulty && (
              <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-lg border capitalize', DIFFICULTY_STYLES[assigned.difficulty] || 'bg-[#F6F7FB] text-[#374151] border-[#E7EAF3]')}>
                {assigned.difficulty}
              </span>
            )}
            {assigned.duration_weeks && (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg border bg-[#F6F7FB] text-[#374151] border-[#E7EAF3] flex items-center gap-1">
                <Clock className="w-3 h-3" /> {assigned.duration_weeks} weeks
              </span>
            )}
            {assigned.days_per_week && (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg border bg-[#F6F7FB] text-[#374151] border-[#E7EAF3] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {assigned.days_per_week}×/week
              </span>
            )}
            {assigned.category && (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg border bg-[#F6F7FB] text-[#374151] border-[#E7EAF3] capitalize">
                {assigned.category.replace('_', ' ')}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/programs')} className="flex-1 gap-1.5 text-xs">
              <Layers className="w-3.5 h-3.5" /> Change Program
            </Button>
          </div>
        </div>
      </div>

      {/* Workout schedule */}
      {assigned.workouts?.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-[#F6F7FB]">
            <div className="w-7 h-7 rounded-lg bg-[#F6F7FB] flex items-center justify-center flex-shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
            </div>
            <h3 className="text-xs font-bold text-[#374151] uppercase tracking-wider">Weekly Split</h3>
          </div>
          <div className="divide-y divide-[#F6F7FB]">
            {assigned.workouts.map((w, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-7 h-7 rounded-lg bg-[#EEF4FF] text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {w.day_number || i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1F2A44]">{w.day_name || `Day ${i + 1}`}</p>
                  <p className="text-xs text-[#9CA3AF]">{w.exercises?.length || 0} exercises</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#D1D5DB]" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}