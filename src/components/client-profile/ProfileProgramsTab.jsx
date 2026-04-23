import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dumbbell, Calendar, ChevronRight } from 'lucide-react';

export default function ProfileProgramsTab({ client }) {
  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['workout-programs'],
    queryFn: () => base44.entities.WorkoutProgram.list(),
  });

  const assigned = programs.find(p => p.id === client.assigned_program_id);

  const difficultyColor = {
    beginner: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-blue-100 text-blue-700',
    advanced: 'bg-orange-100 text-orange-700',
    elite: 'bg-red-100 text-red-700',
  };

  if (isLoading) return <div className="h-32 bg-white rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-4">
      {assigned ? (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">Assigned Program</h3>
          </div>
          <h4 className="text-base font-bold text-[#1F2A44] mb-1">{assigned.title}</h4>
          {assigned.description && <p className="text-sm text-[#6B7280] mb-3">{assigned.description}</p>}
          <div className="flex flex-wrap gap-2">
            {assigned.difficulty && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${difficultyColor[assigned.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                {assigned.difficulty}
              </span>
            )}
            {assigned.duration_weeks && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-[#F6F7FB] text-[#374151]">
                {assigned.duration_weeks} weeks
              </span>
            )}
            {assigned.days_per_week && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-[#F6F7FB] text-[#374151]">
                {assigned.days_per_week}x/week
              </span>
            )}
          </div>

          {assigned.workouts?.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Schedule</p>
              {assigned.workouts.map((w, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-[#F6F7FB] last:border-0">
                  <div className="w-6 h-6 rounded-full bg-[#EEF4FF] text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {w.day_number || i + 1}
                  </div>
                  <span className="text-sm text-[#374151] flex-1">{w.day_name || `Day ${i + 1}`}</span>
                  <span className="text-xs text-[#9CA3AF]">{w.exercises?.length || 0} exercises</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] flex flex-col items-center justify-center py-12 text-center px-6">
          <div className="w-12 h-12 rounded-full bg-[#F6F7FB] flex items-center justify-center mb-3">
            <Dumbbell className="w-5 h-5 text-[#9CA3AF]" />
          </div>
          <p className="text-sm font-semibold text-[#374151]">No program assigned</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Assign a program to this client from the Programs page</p>
        </div>
      )}
    </div>
  );
}