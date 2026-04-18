import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Dumbbell, Play, Star, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import ExerciseCard from '@/components/exercises/ExerciseCard';
import ExerciseDetailModal from '@/components/exercises/ExerciseDetailModal';
import ExerciseFormModal from '@/components/exercises/ExerciseFormModal';
import { cn } from '@/lib/utils';

const MUSCLE_GROUPS = ['all', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'full_body', 'cardio'];
const EQUIPMENT = ['all', 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'resistance_band', 'trx'];
const PATTERNS = ['all', 'push', 'pull', 'hinge', 'squat', 'carry', 'rotation', 'isometric', 'cardio'];

export default function ExerciseLibrary() {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [patternFilter, setPatternFilter] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.ExerciseLibrary.list('-created_date', 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ExerciseLibrary.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  });

  const filtered = exercises.filter(ex => {
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = muscleFilter === 'all' || ex.muscle_group === muscleFilter;
    const matchEquip = equipmentFilter === 'all' || ex.equipment === equipmentFilter;
    const matchPattern = patternFilter === 'all' || ex.movement_pattern === patternFilter;
    return matchSearch && matchMuscle && matchEquip && matchPattern;
  });

  const branded = filtered.filter(e => e.is_coach_branded);
  const standard = filtered.filter(e => !e.is_coach_branded);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Exercise Library"
        subtitle={`${exercises.length} exercises · ${branded.length} coach-branded`}
        actions={
          <Button onClick={() => { setEditingExercise(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Exercise
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={muscleFilter} onValueChange={setMuscleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Muscle Group" />
          </SelectTrigger>
          <SelectContent>
            {MUSCLE_GROUPS.map(m => (
              <SelectItem key={m} value={m}>{m === 'all' ? 'All Muscles' : m.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Equipment" />
          </SelectTrigger>
          <SelectContent>
            {EQUIPMENT.map(e => (
              <SelectItem key={e} value={e}>{e === 'all' ? 'All Equipment' : e.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={patternFilter} onValueChange={setPatternFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Movement" />
          </SelectTrigger>
          <SelectContent>
            {PATTERNS.map(p => (
              <SelectItem key={p} value={p}>{p === 'all' ? 'All Patterns' : p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-64 bg-card rounded-2xl border border-border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No exercises found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting filters or add your first exercise</p>
        </div>
      ) : (
        <div className="space-y-8">
          {branded.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-chart-4" />
                <h2 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">Coach-Branded</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {branded.map(ex => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    onView={() => setSelectedExercise(ex)}
                    onEdit={() => { setEditingExercise(ex); setShowForm(true); }}
                    onDelete={() => deleteMutation.mutate(ex.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {standard.length > 0 && (
            <div>
              {branded.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <Dumbbell className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">Standard Library</h2>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {standard.map(ex => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    onView={() => setSelectedExercise(ex)}
                    onEdit={() => { setEditingExercise(ex); setShowForm(true); }}
                    onDelete={() => deleteMutation.mutate(ex.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ExerciseDetailModal
        exercise={selectedExercise}
        open={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        onEdit={() => { setEditingExercise(selectedExercise); setShowForm(true); setSelectedExercise(null); }}
      />

      <ExerciseFormModal
        open={showForm}
        onOpenChange={setShowForm}
        exercise={editingExercise}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['exercises'] });
          setShowForm(false);
        }}
      />
    </div>
  );
}