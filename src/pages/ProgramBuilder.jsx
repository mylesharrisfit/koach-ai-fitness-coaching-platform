import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus, Trash2, GripVertical, ArrowLeft, Save, Dumbbell,
  ChevronDown, ChevronUp, BookOpen, Play, Copy, Users, Check,
  Search, Star, Zap, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ExerciseDetailModal from '@/components/exercises/ExerciseDetailModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

/* ── Constants ── */
const MUSCLE_COLORS = {
  chest: 'bg-red-50 text-red-600', back: 'bg-emerald-50 text-emerald-700',
  shoulders: 'bg-purple-50 text-purple-700', biceps: 'bg-blue-50 text-blue-700',
  triceps: 'bg-blue-50 text-blue-700', legs: 'bg-orange-50 text-orange-700',
  glutes: 'bg-orange-50 text-orange-700', core: 'bg-amber-50 text-amber-700',
  full_body: 'bg-indigo-50 text-indigo-700', cardio: 'bg-teal-50 text-teal-700',
};

const newExercise = () => ({
  name: '', sets: 3, reps: '10', rest_seconds: 60, tempo: '', notes: '', superset_group: '',
});
const newWorkout = (idx) => ({
  day_name: `Day ${idx + 1}`, day_number: idx + 1, exercises: [newExercise()],
});
const defaultMeta = {
  title: '', description: '', duration_weeks: 8, difficulty: 'intermediate',
  category: 'custom', days_per_week: 4, is_template: false,
};

/* ── Exercise Library Picker Modal ── */
function ExerciseLibraryModal({ open, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('all');

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.ExerciseLibrary.list('-created_date', 200),
    enabled: open,
  });

  const filtered = exercises.filter(ex =>
    (!search || ex.name.toLowerCase().includes(search.toLowerCase())) &&
    (muscle === 'all' || ex.muscle_group === muscle)
  );

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0 overflow-hidden rounded-2xl">
        <div className="px-5 pt-5 pb-4 border-b border-[#E7EAF3]">
          <DialogTitle className="text-base font-bold text-[#1F2A44] mb-3">Pick from Library</DialogTitle>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
            <Input placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 bg-[#F6F7FB] border-[#E7EAF3] text-sm" autoFocus />
          </div>
          <div className="flex flex-wrap gap-1">
            {['all','chest','back','shoulders','biceps','triceps','legs','core','cardio'].map(m => (
              <button key={m} onClick={() => setMuscle(m === muscle ? 'all' : m)}
                className={cn('px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all capitalize',
                  muscle === m ? 'bg-primary text-white border-transparent' : 'bg-white text-[#374151] border-[#E7EAF3] hover:border-primary/40')}>
                {m === 'all' ? 'All' : m.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
              <p className="text-sm text-[#9CA3AF]">No exercises found</p>
            </div>
          ) : filtered.map(ex => (
            <button key={ex.id} onClick={() => { onSelect(ex); onClose(); }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F6F7FB] transition-colors group text-left mb-0.5">
              <div className="w-9 h-9 rounded-xl bg-[#F6F7FB] border border-[#E7EAF3] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {ex.thumbnail_url
                  ? <img src={ex.thumbnail_url} alt={ex.name} className="w-full h-full object-cover" />
                  : ex.video_url ? <Play className="w-3.5 h-3.5 text-primary" />
                  : <Dumbbell className="w-3.5 h-3.5 text-[#9CA3AF]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-[#1F2A44] truncate">{ex.name}</p>
                  {ex.is_coach_branded && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" fill="currentColor" />}
                </div>
                <div className="flex gap-1 mt-0.5">
                  {ex.muscle_group && (
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-medium', MUSCLE_COLORS[ex.muscle_group] || 'bg-[#F6F7FB] text-[#6B7280]')}>
                      {ex.muscle_group.replace('_', ' ')}
                    </span>
                  )}
                  {ex.equipment && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-[#F6F7FB] text-[#6B7280] border border-[#E7EAF3]">
                      {ex.equipment.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
              <Plus className="w-4 h-4 text-[#9CA3AF] group-hover:text-primary transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Assign to Client Modal ── */
function AssignClientModal({ open, onClose, programId, programTitle }) {
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    enabled: open,
  });

  const assignMutation = useMutation({
    mutationFn: () => base44.entities.Client.update(selected, { assigned_program_id: programId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDone(true);
      toast.success('Program assigned!');
    },
  });

  const handleClose = () => { setSelected(null); setDone(false); onClose(); };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-[#E7EAF3]">
          <DialogTitle className="text-base font-bold text-[#1F2A44]">Assign to Client</DialogTitle>
          <p className="text-xs text-[#6B7280] mt-0.5">Select a client to assign <strong>"{programTitle}"</strong></p>
        </div>
        {done ? (
          <div className="flex flex-col items-center py-10 px-5 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-[#1F2A44]">Program assigned!</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <>
            <div className="max-h-72 overflow-y-auto divide-y divide-[#F6F7FB] px-2 py-2">
              {clients.map(c => (
                <button key={c.id} onClick={() => setSelected(c.id)}
                  className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                    selected === c.id ? 'bg-[#EEF4FF] border border-blue-100' : 'hover:bg-[#F6F7FB]')}>
                  <div className="w-8 h-8 rounded-full bg-[#EEF4FF] text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1F2A44] truncate">{c.name}</p>
                    <p className="text-xs text-[#9CA3AF] truncate">{c.email}</p>
                  </div>
                  {selected === c.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-[#E7EAF3] flex gap-2">
              <Button variant="outline" className="flex-1 text-xs" onClick={handleClose}>Cancel</Button>
              <Button className="flex-1 text-xs" disabled={!selected || assignMutation.isPending}
                onClick={() => assignMutation.mutate()}>
                {assignMutation.isPending ? 'Assigning...' : 'Assign Program'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Exercise Row ── */
function ExerciseRow({ ex, wIdx, eIdx, drag, isDragging, onUpdate, onRemove, onPickLibrary, onWatchDemo }) {
  const [expanded, setExpanded] = useState(false);
  const hasExtra = ex.tempo || ex.notes || ex.superset_group;

  return (
    <div ref={drag.innerRef} {...drag.draggableProps}
      className={cn('bg-white border rounded-xl overflow-hidden transition-all',
        isDragging ? 'shadow-lg border-primary/30' : 'border-[#E7EAF3]',
        ex.superset_group && 'border-l-2 border-l-purple-400'
      )}>
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div {...drag.dragHandleProps} className="flex-shrink-0 cursor-grab">
          <GripVertical className="w-3.5 h-3.5 text-[#D1D5DB]" />
        </div>

        {/* Exercise name + library */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Input
            className="h-8 text-sm border-[#E7EAF3] bg-[#F8F9FD] focus:bg-white flex-1 min-w-0"
            placeholder="Exercise name"
            value={ex.name}
            onChange={e => onUpdate('name', e.target.value)}
          />
          <button onClick={onPickLibrary} title="Pick from library"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F6F7FB] text-[#9CA3AF] hover:text-primary transition-colors flex-shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </button>
          {ex._library_exercise?.video_url && (
            <button onClick={onWatchDemo} title="Watch demo"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-primary hover:bg-blue-100 transition-colors flex-shrink-0">
              <Play className="w-3 h-3" fill="currentColor" />
            </button>
          )}
        </div>

        {/* Sets / Reps / Rest */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex flex-col items-center">
            <Input type="number" min="1" value={ex.sets}
              onChange={e => onUpdate('sets', Number(e.target.value))}
              className="h-8 w-12 text-sm text-center border-[#E7EAF3] bg-[#F8F9FD] focus:bg-white p-1" />
            <span className="text-[9px] text-[#9CA3AF] mt-0.5">sets</span>
          </div>
          <div className="flex flex-col items-center">
            <Input value={ex.reps} placeholder="10" onChange={e => onUpdate('reps', e.target.value)}
              className="h-8 w-16 text-sm text-center border-[#E7EAF3] bg-[#F8F9FD] focus:bg-white p-1" />
            <span className="text-[9px] text-[#9CA3AF] mt-0.5">reps</span>
          </div>
          <div className="flex flex-col items-center">
            <Input type="number" value={ex.rest_seconds} placeholder="60"
              onChange={e => onUpdate('rest_seconds', Number(e.target.value))}
              className="h-8 w-14 text-sm text-center border-[#E7EAF3] bg-[#F8F9FD] focus:bg-white p-1" />
            <span className="text-[9px] text-[#9CA3AF] mt-0.5">rest s</span>
          </div>
        </div>

        {/* Expand / delete */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setExpanded(v => !v)}
            className={cn('w-7 h-7 flex items-center justify-center rounded-lg transition-colors',
              hasExtra ? 'bg-amber-50 text-amber-500' : 'hover:bg-[#F6F7FB] text-[#9CA3AF] hover:text-[#374151]')}>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#D1D5DB] hover:text-red-500 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded panel — tempo, notes, superset */}
      {expanded && (
        <div className="border-t border-[#F6F7FB] bg-[#FAFBFE] px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Tempo</Label>
            <Input className="h-8 text-sm mt-1 border-[#E7EAF3] font-mono" placeholder="3-1-2-0"
              value={ex.tempo || ''} onChange={e => onUpdate('tempo', e.target.value)} />
          </div>
          <div>
            <Label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Superset</Label>
            <Input className="h-8 text-sm mt-1 border-[#E7EAF3]" placeholder="A, B, C..."
              value={ex.superset_group || ''} onChange={e => onUpdate('superset_group', e.target.value)} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Coaching Notes</Label>
            <Input className="h-8 text-sm mt-1 border-[#E7EAF3]" placeholder="Form cues, modifications..."
              value={ex.notes || ''} onChange={e => onUpdate('notes', e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function ProgramBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const existingProgram = location.state?.program || null;

  const [meta, setMeta] = useState(existingProgram ? {
    title: existingProgram.title || '',
    description: existingProgram.description || '',
    duration_weeks: existingProgram.duration_weeks || 8,
    difficulty: existingProgram.difficulty || 'intermediate',
    category: existingProgram.category || 'custom',
    days_per_week: existingProgram.days_per_week || 4,
    is_template: existingProgram.is_template || false,
  } : { ...defaultMeta });

  const [workouts, setWorkouts] = useState(existingProgram?.workouts || []);
  const [activeDay, setActiveDay] = useState(0);
  const [pickerTarget, setPickerTarget] = useState(null); // { wIdx, eIdx } or 'add'
  const [demoExercise, setDemoExercise] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [savedId, setSavedId] = useState(existingProgram?.id || null);

  const saveMutation = useMutation({
    mutationFn: (data) => existingProgram || savedId
      ? base44.entities.WorkoutProgram.update(existingProgram?.id || savedId, data)
      : base44.entities.WorkoutProgram.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      if (result?.id) setSavedId(result.id);
      toast.success(existingProgram || savedId ? 'Program updated!' : 'Program saved!');
    },
  });

  const handleSave = () => {
    if (!meta.title.trim()) { toast.error('Enter a program name'); return; }
    saveMutation.mutate({ ...meta, workouts, duration_weeks: Number(meta.duration_weeks), days_per_week: Number(meta.days_per_week) });
  };

  // Workout helpers
  const addWorkout = () => {
    const next = [...workouts, newWorkout(workouts.length)];
    setWorkouts(next); setActiveDay(next.length - 1);
  };
  const removeWorkout = (idx) => {
    setWorkouts(w => w.filter((_, i) => i !== idx));
    setActiveDay(a => Math.max(0, Math.min(a, workouts.length - 2)));
  };
  const duplicateWorkout = (idx) => {
    const copy = { ...workouts[idx], exercises: workouts[idx].exercises.map(e => ({ ...e })), day_name: `${workouts[idx].day_name} (Copy)` };
    const next = [...workouts.slice(0, idx + 1), copy, ...workouts.slice(idx + 1)];
    setWorkouts(next); setActiveDay(idx + 1);
  };
  const updateWorkoutName = (idx, val) =>
    setWorkouts(w => w.map((wk, i) => i !== idx ? wk : { ...wk, day_name: val }));

  // Exercise helpers
  const addExercise = (wIdx, libraryEx = null) => {
    const ex = libraryEx
      ? { ...newExercise(), name: libraryEx.name, rest_seconds: libraryEx.default_rest_seconds || 60, _library_id: libraryEx.id, _library_exercise: libraryEx }
      : newExercise();
    setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : { ...wk, exercises: [...wk.exercises, ex] }));
  };
  const removeExercise = (wIdx, eIdx) =>
    setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : { ...wk, exercises: wk.exercises.filter((_, ei) => ei !== eIdx) }));
  const updateExercise = (wIdx, eIdx, field, value) =>
    setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : {
      ...wk, exercises: wk.exercises.map((ex, ei) => ei !== eIdx ? ex : { ...ex, [field]: value })
    }));
  const selectFromLibrary = (libraryEx) => {
    if (!pickerTarget) return;
    if (pickerTarget === 'add') {
      addExercise(activeDay, libraryEx);
    } else {
      const { wIdx, eIdx } = pickerTarget;
      setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : {
        ...wk, exercises: wk.exercises.map((ex, ei) => ei !== eIdx ? ex : {
          ...ex, name: libraryEx.name, rest_seconds: libraryEx.default_rest_seconds || 60,
          _library_id: libraryEx.id, _library_exercise: libraryEx,
        })
      }));
    }
    setPickerTarget(null);
  };

  // Drag & Drop
  const onDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (type === 'DAY') {
      const r = [...workouts];
      const [m] = r.splice(source.index, 1);
      r.splice(destination.index, 0, m);
      setWorkouts(r); setActiveDay(destination.index);
      return;
    }
    const wIdx = parseInt(source.droppableId.replace('ex-', ''));
    const exs = [...workouts[wIdx].exercises];
    const [m] = exs.splice(source.index, 1);
    exs.splice(destination.index, 0, m);
    setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : { ...wk, exercises: exs }));
  };

  const currentWorkout = workouts[activeDay];
  const canAssign = !!(savedId || existingProgram?.id);

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#E7EAF3] flex items-center gap-3 px-4 sm:px-6 py-3 shadow-sm">
        <button onClick={() => navigate('/programs')}
          className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#1F2A44] transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Programs</span>
        </button>
        <span className="text-[#D1D5DB] hidden sm:inline">/</span>

        <Input
          value={meta.title}
          onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
          placeholder="Program name..."
          className="border-0 bg-transparent font-bold text-[15px] h-auto p-0 focus-visible:ring-0 flex-1 max-w-xs placeholder:text-[#D1D5DB]"
        />

        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <Switch checked={!!meta.is_template} onCheckedChange={v => setMeta(m => ({ ...m, is_template: v }))} className="scale-75" />
            <span className="text-xs text-[#6B7280] font-medium">Template</span>
          </div>
          {canAssign && (
            <Button size="sm" variant="outline" onClick={() => setShowAssign(true)} className="gap-1.5 border-[#E7EAF3] text-xs h-8 hidden sm:flex">
              <Users className="w-3.5 h-3.5" /> Assign
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="gap-1.5 h-8 text-xs">
            <Save className="w-3.5 h-3.5" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1" style={{ height: 'calc(100vh - 57px)', overflow: 'hidden' }}>

        {/* ── Left sidebar ── */}
        <div className="w-52 flex-shrink-0 bg-white border-r border-[#E7EAF3] flex flex-col overflow-hidden hidden sm:flex">

          {/* Days list */}
          <div className="p-4 border-b border-[#F6F7FB]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">Training Days</p>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="days" type="DAY">
                {(prov) => (
                  <div ref={prov.innerRef} {...prov.droppableProps} className="space-y-0.5">
                    {workouts.map((wk, idx) => (
                      <Draggable key={`day-${idx}`} draggableId={`day-${idx}`} index={idx}>
                        {(drag, snap) => (
                          <div ref={drag.innerRef} {...drag.draggableProps}
                            className={cn(
                              'flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all group',
                              activeDay === idx ? 'bg-[#EEF4FF] text-primary' : 'hover:bg-[#F6F7FB] text-[#374151]',
                              snap.isDragging && 'shadow-md bg-white border border-[#E7EAF3]'
                            )}
                            onClick={() => setActiveDay(idx)}
                          >
                            <div {...drag.dragHandleProps}><GripVertical className="w-3 h-3 text-[#D1D5DB] group-hover:text-[#9CA3AF]" /></div>
                            <span className="text-[13px] font-medium flex-1 truncate">{wk.day_name}</span>
                            <span className="text-[10px] text-[#9CA3AF]">{wk.exercises.filter(e => e.name).length}</span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {prov.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <button onClick={addWorkout}
              className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-[#D1D5DB] text-xs text-[#9CA3AF] hover:border-primary hover:text-primary transition-colors">
              <Plus className="w-3 h-3" /> Add Day
            </button>
          </div>

          {/* Program settings */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Settings</p>
            <div>
              <Label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Duration (weeks)</Label>
              <Input type="number" value={meta.duration_weeks}
                onChange={e => setMeta(m => ({ ...m, duration_weeks: e.target.value }))}
                className="h-8 text-sm mt-1 border-[#E7EAF3] bg-[#F6F7FB]" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Difficulty</Label>
              <Select value={meta.difficulty} onValueChange={v => setMeta(m => ({ ...m, difficulty: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1 border-[#E7EAF3] bg-[#F6F7FB]"><SelectValue /></SelectTrigger>
                <SelectContent>{['beginner','intermediate','advanced','elite'].map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Category</Label>
              <Select value={meta.category} onValueChange={v => setMeta(m => ({ ...m, category: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1 border-[#E7EAF3] bg-[#F6F7FB]"><SelectValue /></SelectTrigger>
                <SelectContent>{['strength','hypertrophy','fat_loss','athletic','mobility','custom'].map(c => <SelectItem key={c} value={c}>{c.replace('_',' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Description</Label>
              <Textarea value={meta.description || ''} onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
                rows={3} className="text-sm mt-1 resize-none border-[#E7EAF3] bg-[#F6F7FB]" placeholder="Program overview..." />
            </div>
          </div>
        </div>

        {/* ── Center — exercise editor ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {workouts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-[#EEF4FF] flex items-center justify-center">
                <Dumbbell className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-[#1F2A44]">Start building</h2>
                <p className="text-sm text-[#6B7280] mt-1">Add your first training day to begin</p>
              </div>
              <Button onClick={addWorkout} className="gap-1.5">
                <Plus className="w-4 h-4" /> Add Training Day
              </Button>
            </div>
          ) : currentWorkout ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Day header */}
              <div className="px-4 sm:px-6 py-3 bg-white border-b border-[#E7EAF3] flex items-center gap-3">
                <Input
                  value={currentWorkout.day_name}
                  onChange={e => updateWorkoutName(activeDay, e.target.value)}
                  className="font-bold text-[15px] border-0 bg-transparent h-auto p-0 focus-visible:ring-0 max-w-[200px]"
                />
                <span className="text-xs text-[#9CA3AF] bg-[#F6F7FB] border border-[#E7EAF3] rounded-lg px-2 py-1">
                  {currentWorkout.exercises.filter(e => e.name).length} exercises
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <button onClick={() => duplicateWorkout(activeDay)}
                    className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#1F2A44] px-2.5 py-1.5 rounded-lg hover:bg-[#F6F7FB] transition-colors">
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <button onClick={() => removeWorkout(activeDay)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>

              {/* Exercise list */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                {/* Column hints */}
                <div className="flex items-center gap-2 mb-3 px-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Exercise</span>
                  </div>
                  <div className="flex gap-4 flex-shrink-0 pr-16">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] w-12 text-center">Sets</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] w-16 text-center">Reps</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] w-14 text-center">Rest</span>
                  </div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId={`ex-${activeDay}`}>
                    {(prov) => (
                      <div ref={prov.innerRef} {...prov.droppableProps} className="space-y-2">
                        {currentWorkout.exercises.map((ex, eIdx) => (
                          <Draggable key={`ex-${activeDay}-${eIdx}`} draggableId={`ex-${activeDay}-${eIdx}`} index={eIdx}>
                            {(drag, snap) => (
                              <ExerciseRow
                                ex={ex}
                                wIdx={activeDay}
                                eIdx={eIdx}
                                drag={drag}
                                isDragging={snap.isDragging}
                                onUpdate={(field, val) => updateExercise(activeDay, eIdx, field, val)}
                                onRemove={() => removeExercise(activeDay, eIdx)}
                                onPickLibrary={() => setPickerTarget({ wIdx: activeDay, eIdx })}
                                onWatchDemo={() => setDemoExercise(ex._library_exercise)}
                              />
                            )}
                          </Draggable>
                        ))}
                        {prov.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {/* Add exercise row */}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => addExercise(activeDay)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[#D1D5DB] text-sm text-[#9CA3AF] hover:border-primary hover:text-primary hover:bg-[#EEF4FF]/30 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Exercise
                  </button>
                  <button onClick={() => setPickerTarget('add')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-dashed border-[#D1D5DB] text-sm text-[#9CA3AF] hover:border-primary hover:text-primary hover:bg-[#EEF4FF]/30 transition-all">
                    <BookOpen className="w-3.5 h-3.5" /> From Library
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Modals ── */}
      <ExerciseLibraryModal
        open={!!pickerTarget}
        onClose={() => setPickerTarget(null)}
        onSelect={selectFromLibrary}
      />
      <ExerciseDetailModal
        exercise={demoExercise}
        open={!!demoExercise}
        onClose={() => setDemoExercise(null)}
        onEdit={() => {}}
      />
      <AssignClientModal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        programId={savedId || existingProgram?.id}
        programTitle={meta.title}
      />
    </div>
  );
}