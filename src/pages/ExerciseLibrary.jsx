import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Dumbbell, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import ExerciseCard from '@/components/exercises/ExerciseCard';
import ExerciseDetailModal from '@/components/exercises/ExerciseDetailModal';
import ExerciseFormModal from '@/components/exercises/ExerciseFormModal';
import ExerciseFilters from '@/components/exercises/ExerciseFilters';

export default function ExerciseLibrary() {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [patternFilter, setPatternFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
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
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase()) ||
      (ex.description || '').toLowerCase().includes(search.toLowerCase());
    const matchMuscle = muscleFilter === 'all' || ex.muscle_group === muscleFilter;
    const matchEquip = equipmentFilter === 'all' || ex.equipment === equipmentFilter;
    const matchPattern = patternFilter === 'all' || ex.movement_pattern === patternFilter;
    const matchDifficulty = difficultyFilter === 'all' || ex.difficulty === difficultyFilter;
    return matchSearch && matchMuscle && matchEquip && matchPattern && matchDifficulty;
  });

  const branded = filtered.filter(e => e.is_coach_branded);
  const standard = filtered.filter(e => !e.is_coach_branded);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Exercise Library"
        subtitle={`${exercises.length} exercises · ${exercises.filter(e => e.is_coach_branded).length} coach-branded`}
        actions={
          <Button onClick={() => { setEditingExercise(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Exercise
          </Button>
        }
      />

      <ExerciseFilters
        search={search} onSearch={setSearch}
        muscleFilter={muscleFilter} onMuscle={setMuscleFilter}
        equipmentFilter={equipmentFilter} onEquipment={setEquipmentFilter}
        patternFilter={patternFilter} onPattern={setPatternFilter}
        difficultyFilter={difficultyFilter} onDifficulty={setDifficultyFilter}
        resultCount={filtered.length}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-64 bg-white rounded-2xl border border-[#E7EAF3] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No exercises found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your filters or add a new exercise</p>
        </div>
      ) : (
        <div className="space-y-8">
          {branded.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-chart-4" />
                <h2 className="font-heading font-semibold text-sm uppercase tracking-wider text-[#1F2A44]">Coach-Branded</h2>
                <span className="text-xs text-[#374151]">({branded.length})</span>
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
                  <h2 className="font-heading font-semibold text-sm uppercase tracking-wider text-[#1F2A44]">Standard Library</h2>
                  <span className="text-xs text-[#374151]">({standard.length})</span>
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