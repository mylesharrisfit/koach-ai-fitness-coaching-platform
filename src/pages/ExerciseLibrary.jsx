import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Dumbbell, Star, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
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
  const [importOpen, setImportOpen] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const queryClient = useQueryClient();

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.ExerciseLibrary.list('-created_date', 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ExerciseLibrary.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  });

  const importMutation = useMutation({
    mutationFn: () => base44.functions.invoke('generateExerciseLibrary', {}),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast.success(`✅ Imported ${res.data.count} exercises!`);
      setImportOpen(false);
      setImportProgress(null);
    },
    onError: (err) => {
      toast.error('Import failed: ' + err.message);
      setImportProgress(null);
    },
  });

  const handleImport = async () => {
    setImportProgress(0);
    importMutation.mutate();
  };

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
      {/* ── Header ── */}
      <div className="bg-[#111827] rounded-xl p-5 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Exercise Library</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {exercises.length} exercises · {exercises.filter(e => e.is_coach_branded).length} coach-branded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            disabled={importMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <Download className="w-4 h-4" /> Import Full Library
          </button>
          <button
            onClick={() => { setEditingExercise(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: '#fff', color: '#111827' }}
          >
            <Plus className="w-4 h-4" /> Add Exercise
          </button>
        </div>
      </div>

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

      {/* Import Modal */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Full Exercise Library</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold">Generate 50 exercises via Claude AI</p>
                <p className="text-xs mt-1 opacity-75">Includes YouTube tutorials, form cues, muscle groups, and equipment tags</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This will create a comprehensive library with exercises from beginner to advanced levels across all muscle groups.
            </p>
            {importProgress !== null && (
              <div className="space-y-2">
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">Importing exercises...</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setImportOpen(false)}
                disabled={importMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold border border-input hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-60"
              >
                {importMutation.isPending ? 'Importing...' : 'Start Import'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}