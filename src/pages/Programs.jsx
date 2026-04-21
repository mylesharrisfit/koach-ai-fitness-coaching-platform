import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Dumbbell, Clock, BarChart3, MoreHorizontal, Edit, Trash2, Copy, Users, Lock } from 'lucide-react';
import { hasFeature, getLimit } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageHeader from '../components/shared/PageHeader';
import CloneToClientDialog from '../components/programs/CloneToClientDialog';
import LimitBanner from '@/components/subscription/LimitBanner';
import { useUpgradeModal } from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const difficultyColors = {
  beginner:     'bg-emerald-50 text-emerald-600 border border-emerald-100',
  intermediate: 'bg-blue-50 text-blue-600 border border-blue-100',
  advanced:     'bg-amber-50 text-amber-600 border border-amber-100',
  elite:        'bg-red-50 text-red-500 border border-red-100',
};

export default function Programs() {
  const [cloningProgram, setCloningProgram] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();
  const { openUpgradeModal } = useUpgradeModal();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const canUseTemplates = hasFeature(currentUser, 'program_templates');

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.WorkoutProgram.list('-created_date'),
  });

  const programLimit = getLimit(currentUser, 'max_programs');
  const atLimit = programLimit !== -1 && programs.length >= programLimit;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutProgram.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkoutProgram.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkoutProgram.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });

  const duplicateProgram = (program) => {
    const { id, created_date, updated_date, created_by, ...rest } = program;
    createMutation.mutate({ ...rest, title: `${rest.title} (Copy)` });
  };

  const openBuilder = (program = null) => {
    navigate('/program-builder', { state: { program } });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#1F2A44]">Workout Programs</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">{programs.length} program{programs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={() => { if (atLimit) { openUpgradeModal('clients'); return; } openBuilder(); }}
          variant={atLimit ? 'outline' : 'default'}
          className={atLimit ? 'border-red-200 text-red-500 hover:bg-red-50' : ''}
        >
          {atLimit ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {atLimit ? `Limit (${programs.length}/${programLimit})` : 'Create Program'}
        </Button>
      </div>

      <LimitBanner limitKey="max_programs" currentCount={programs.length} label="programs" featureKey="clients" className="mb-6" />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-52 bg-white rounded-2xl border border-[#E7EAF3] animate-pulse shadow-sm" />)}
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#E7EAF3] shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#F6F7FB] border border-[#E7EAF3] flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-6 h-6 text-[#6B7280]" />
          </div>
          <p className="font-semibold text-[#1F2A44]">No programs yet</p>
          <p className="text-sm text-[#6B7280] mt-1 mb-5">Create your first workout program to get started.</p>
          <Button onClick={() => openBuilder()}>
            <Plus className="w-4 h-4" /> Create Program
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map(program => (
            <div
              key={program.id}
              className="bg-white rounded-2xl border border-[#E7EAF3] shadow-sm hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer"
              onClick={() => openBuilder(program)}
            >
              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    {/* Tags row */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-lg capitalize', difficultyColors[program.difficulty] || 'bg-[#F6F7FB] text-[#6B7280] border border-[#E7EAF3]')}>
                        {program.difficulty}
                      </span>
                      {program.category && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-[#F6F7FB] text-[#6B7280] border border-[#E7EAF3] capitalize">
                          {program.category.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading font-semibold text-[#1F2A44] text-[15px] leading-snug">{program.title}</h3>
                    {program.description && (
                      <p className="text-sm text-[#6B7280] mt-1 line-clamp-2 leading-relaxed">{program.description}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-[#6B7280] hover:text-[#1F2A44] hover:bg-[#F6F7FB]"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => openBuilder(program)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      {canUseTemplates ? (
                        <>
                          <DropdownMenuItem onClick={() => duplicateProgram(program)}>
                            <Copy className="w-4 h-4 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCloningProgram(program)}>
                            <Users className="w-4 h-4 mr-2" /> Clone to Clients
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem onClick={() => openUpgradeModal('program_templates')} className="text-[#6B7280] gap-2">
                          <Lock className="w-4 h-4" /> Templates & Clone
                          <span className="ml-auto text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">Pro+</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-500" onClick={() => deleteMutation.mutate(program.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-[#6B7280] pt-3 border-t border-[#E7EAF3]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{program.duration_weeks ?? '–'} wks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>{program.days_per_week ?? '–'} days/wk</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>{program.workouts?.length || 0} workouts</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cloningProgram && (
        <CloneToClientDialog
          open={!!cloningProgram}
          onOpenChange={(v) => !v && setCloningProgram(null)}
          program={cloningProgram}
        />
      )}
    </div>
  );
}