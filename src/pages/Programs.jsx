import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Dumbbell, Clock, BarChart3, MoreHorizontal, Edit, Trash2, Copy, Users, Lock } from 'lucide-react';
import { hasFeature, getLimit } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageHeader from '../components/shared/PageHeader';
import ProgramForm from '../components/programs/ProgramForm';
import CloneToClientDialog from '../components/programs/CloneToClientDialog';
import LimitBanner from '@/components/subscription/LimitBanner';
import { useUpgradeModal } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';

const difficultyColors = {
  beginner: 'bg-accent/10 text-accent',
  intermediate: 'bg-primary/10 text-primary',
  advanced: 'bg-chart-4/10 text-chart-4',
  elite: 'bg-destructive/10 text-destructive',
};

export default function Programs() {
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [cloningProgram, setCloningProgram] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();
  const { openUpgradeModal } = useUpgradeModal();

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

  const handleSubmit = (data) => {
    if (editingProgram) {
      updateMutation.mutate({ id: editingProgram.id, data });
    } else {
      createMutation.mutate(data);
    }
    setEditingProgram(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Workout Programs"
        subtitle={`${programs.length} programs`}
        actions={
          <Button
            onClick={() => { if (atLimit) { openUpgradeModal('clients'); return; } setEditingProgram(null); setShowForm(true); }}
            variant={atLimit ? 'outline' : 'default'}
            className={atLimit ? 'border-destructive/40 text-destructive hover:bg-destructive/10' : ''}
          >
            {atLimit ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {atLimit ? `Limit Reached (${programs.length}/${programLimit})` : 'Create Program'}
          </Button>
        }
      />

      <LimitBanner limitKey="max_programs" currentCount={programs.length} label="programs" featureKey="clients" className="mb-6" />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-52 bg-card rounded-2xl border border-border animate-pulse" />)}
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No programs yet. Create your first workout program.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map(program => (
            <div key={program.id} className="bg-card rounded-2xl border border-border hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-accent" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading font-semibold">{program.title}</h3>
                    {program.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{program.description}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingProgram(program); setShowForm(true); }}>
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
                        <DropdownMenuItem onClick={() => openUpgradeModal('program_templates')} className="text-muted-foreground gap-2">
                          <Lock className="w-4 h-4" /> Templates & Clone
                          <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">Pro+</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(program.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={cn("text-xs", difficultyColors[program.difficulty])}>
                    {program.difficulty}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {program.category?.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {program.duration_weeks} weeks
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5" />
                    {program.days_per_week} days/wk
                  </div>
                  <div className="flex items-center gap-1">
                    <Dumbbell className="w-3.5 h-3.5" />
                    {program.workouts?.length || 0} workouts
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProgramForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleSubmit}
        program={editingProgram}
      />

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