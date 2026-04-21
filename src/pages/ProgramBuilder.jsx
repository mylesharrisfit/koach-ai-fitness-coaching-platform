import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Trash2, GripVertical, ArrowLeft, Save, Dumbbell,
  ChevronRight, BookOpen, Play, Zap, TrendingUp, Copy, Calendar, Search, Star
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import ExerciseDetailModal from '@/components/exercises/ExerciseDetailModal';
import BuilderExercisePicker from '@/components/programs/BuilderExercisePicker';
import WeeklyScheduleView from '@/components/programs/WeeklyScheduleView';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const defaultMeta = {
  title: '', description: '', duration_weeks: 8, difficulty: 'intermediate',
  category: 'custom', days_per_week: 4, is_template: false,
};

const newExercise = () => ({
  name: '', sets: 3, reps: '10', rest_seconds: 60, notes: '',
  rpe: '', load_pct: '', tempo: '', superset_group: '',
  auto_progress: false, progress_increment: 2.5,
});

const newWorkout = (idx) => ({
  day_name: `Day ${idx + 1}`, day_number: idx + 1, exercises: [newExercise()],
});

const MUSCLE_COLORS = {
  chest: 'text-chart-1 bg-chart-1/10', back: 'text-chart-2 bg-chart-2/10',
  shoulders: 'text-chart-3 bg-chart-3/10', biceps: 'text-primary bg-primary/10',
  triceps: 'text-primary bg-primary/10', legs: 'text-chart-5 bg-chart-5/10',
  glutes: 'text-chart-5 bg-chart-5/10', core: 'text-chart-4 bg-chart-4/10',
  full_body: 'text-accent bg-accent/10', cardio: 'text-accent bg-accent/10',
};

function ExercisePickerModal({ open, onOpenChange, onSelect }) {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('all');

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.ExerciseLibrary.list('-created_date', 200),
    enabled: open,
  });

  const filtered = exercises.filter(ex =>
    (!search || ex.name.toLowerCase().includes(search.toLowerCase())) &&
    (muscleFilter === 'all' || ex.muscle_group === muscleFilter)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading">Pick from Library</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#374151]" />
            <Input placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={muscleFilter} onValueChange={setMuscleFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['all','chest','back','shoulders','biceps','triceps','legs','glutes','core','full_body','cardio'].map(m => (
                <SelectItem key={m} value={m}>{m === 'all' ? 'All Muscles' : m.replace('_',' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {filtered.length === 0 ? (
            <div className="text-center py-10"><Dumbbell className="w-8 h-8 text-[#374151] mx-auto mb-2" /><p className="text-sm text-[#374151]">No exercises found</p></div>
          ) : filtered.map(ex => (
            <div
              key={ex.id}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/60 cursor-pointer transition-colors group"
              onClick={() => { onSelect(ex); onOpenChange(false); }}
            >
              <div className="w-9 h-9 rounded-lg bg-secondary/80 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {ex.thumbnail_url ? <img src={ex.thumbnail_url} alt={ex.name} className="w-full h-full object-cover rounded-lg" /> :
                 ex.video_url ? <Play className="w-4 h-4 text-primary" /> : <Dumbbell className="w-4 h-4 text-[#374151]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{ex.name}</p>
                  {ex.is_coach_branded && <Star className="w-3 h-3 text-chart-4 flex-shrink-0" fill="currentColor" />}
                </div>
                <div className="flex gap-1 mt-0.5">
                  {ex.muscle_group && <Badge className={cn("text-[10px] px-1.5 py-0 border-0 h-4", MUSCLE_COLORS[ex.muscle_group])}>{ex.muscle_group.replace('_',' ')}</Badge>}
                  {ex.equipment && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{ex.equipment.replace('_',' ')}</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  const [pickerTarget, setPickerTarget] = useState(null);
  const [demoExercise, setDemoExercise] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState({});

  const saveMutation = useMutation({
    mutationFn: (data) => existingProgram
      ? base44.entities.WorkoutProgram.update(existingProgram.id, data)
      : base44.entities.WorkoutProgram.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success(existingProgram ? 'Program updated!' : 'Program created!');
      navigate('/programs');
    },
  });

  const handleSave = () => {
    if (!meta.title.trim()) { toast.error('Program name is required'); return; }
    saveMutation.mutate({ ...meta, workouts, duration_weeks: Number(meta.duration_weeks), days_per_week: Number(meta.days_per_week) });
  };

  const addWorkout = () => {
    const next = [...workouts, newWorkout(workouts.length)];
    setWorkouts(next);
    setActiveDay(next.length - 1);
  };

  const removeWorkout = (idx) => {
    setWorkouts(w => w.filter((_, i) => i !== idx));
    setActiveDay(a => Math.max(0, Math.min(a, workouts.length - 2)));
  };

  const updateWorkout = (idx, field, value) =>
    setWorkouts(w => w.map((wk, i) => i !== idx ? wk : { ...wk, [field]: value }));

  const duplicateWorkout = (idx) => {
    const copy = { ...workouts[idx], exercises: [...workouts[idx].exercises], day_name: `${workouts[idx].day_name} (Copy)` };
    const next = [...workouts.slice(0, idx + 1), copy, ...workouts.slice(idx + 1)];
    setWorkouts(next);
    setActiveDay(idx + 1);
  };

  const addExercise = (wIdx) =>
    setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : { ...wk, exercises: [...wk.exercises, newExercise()] }));

  const removeExercise = (wIdx, eIdx) =>
    setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : { ...wk, exercises: wk.exercises.filter((_, ei) => ei !== eIdx) }));

  const updateExercise = (wIdx, eIdx, field, value) =>
    setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : {
      ...wk, exercises: wk.exercises.map((ex, ei) => ei !== eIdx ? ex : { ...ex, [field]: value })
    }));

  const selectFromLibrary = (libraryEx) => {
    if (!pickerTarget) return;
    const { wIdx, eIdx } = pickerTarget;
    setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : {
      ...wk, exercises: wk.exercises.map((ex, ei) => ei !== eIdx ? ex : {
        ...ex, name: libraryEx.name,
        rest_seconds: libraryEx.default_rest_seconds || 60,
        _library_id: libraryEx.id, _library_exercise: libraryEx,
      })
    }));
    setPickerTarget(null);
  };

  const addExerciseFromLibrary = (wIdx, libraryEx) => {
    const ex = { ...newExercise(), name: libraryEx.name, rest_seconds: libraryEx.default_rest_seconds || 60, _library_id: libraryEx.id, _library_exercise: libraryEx };
    setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : { ...wk, exercises: [...wk.exercises, ex] }));
  };

  const onDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (type === 'DAY') {
      const reordered = [...workouts];
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      setWorkouts(reordered);
      setActiveDay(destination.index);
      return;
    }
    const wIdx = parseInt(source.droppableId.replace('exercises-', ''));
    const exercises = [...workouts[wIdx].exercises];
    const [moved] = exercises.splice(source.index, 1);
    exercises.splice(destination.index, 0, moved);
    setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : { ...wk, exercises }));
  };

  const toggleExpand = (wIdx, eIdx) => {
    const key = `${wIdx}-${eIdx}`;
    setExpandedExercises(e => ({ ...e, [key]: !e[key] }));
  };

  const currentWorkout = workouts[activeDay];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur border-b border-border flex items-center gap-4 px-6 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/programs')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Input
          value={meta.title}
          onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
          placeholder="Program name..."
          className="border-0 bg-transparent font-heading font-bold text-lg h-auto p-0 focus-visible:ring-0 w-72 max-w-sm"
        />
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={() => setShowSchedule(true)}>
            <Calendar className="w-4 h-4 mr-1.5" /> Schedule View
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-1.5" />
            {saveMutation.isPending ? 'Saving...' : existingProgram ? 'Update' : 'Save Program'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
        {/* Left sidebar — day list + settings */}
        <div className="w-56 flex-shrink-0 border-r border-border bg-card/40 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#374151] mb-3">Training Days</p>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="days" type="DAY">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                    {workouts.map((wk, idx) => (
                      <Draggable key={`day-${idx}`} draggableId={`day-${idx}`} index={idx}>
                        {(drag, snap) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                              activeDay === idx ? "bg-primary/10 text-primary" : "hover:bg-secondary/60 text-foreground",
                              snap.isDragging && "shadow-lg bg-card ring-1 ring-primary/20"
                            )}
                            onClick={() => setActiveDay(idx)}
                          >
                            <div {...drag.dragHandleProps}><GripVertical className="w-3 h-3 text-[#374151]" /></div>
                            <span className="text-sm font-medium flex-1 truncate">{wk.day_name}</span>
                            <span className="text-[10px] text-[#374151]">{wk.exercises.filter(e => e.name).length}</span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-[#374151] hover:text-primary" onClick={addWorkout}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Day
            </Button>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#374151]">Program Settings</p>
            <div>
              <Label className="text-xs text-[#374151]">Duration (weeks)</Label>
              <Input type="number" value={meta.duration_weeks} onChange={e => setMeta(m => ({ ...m, duration_weeks: e.target.value }))} className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs text-[#374151]">Difficulty</Label>
              <Select value={meta.difficulty} onValueChange={v => setMeta(m => ({ ...m, difficulty: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{['beginner','intermediate','advanced','elite'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-[#374151]">Category</Label>
              <Select value={meta.category} onValueChange={v => setMeta(m => ({ ...m, category: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{['strength','hypertrophy','fat_loss','athletic','mobility','custom'].map(c => <SelectItem key={c} value={c}>{c.replace('_',' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-[#374151]">Description</Label>
              <Textarea value={meta.description || ''} onChange={e => setMeta(m => ({ ...m, description: e.target.value }))} rows={3} className="text-sm mt-1 resize-none" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-[#374151]">Template</Label>
              <Switch checked={!!meta.is_template} onCheckedChange={v => setMeta(m => ({ ...m, is_template: v }))} className="scale-75" />
            </div>
          </div>
        </div>

        {/* Center — exercise editor */}
        <div className="flex-1 flex overflow-hidden">
          {workouts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Dumbbell className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg">Start Building</h3>
                <p className="text-[#374151] text-sm mt-1">Add your first training day to begin</p>
              </div>
              <Button onClick={addWorkout}><Plus className="w-4 h-4 mr-2" /> Add Training Day</Button>
            </div>
          ) : currentWorkout ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Day header */}
              <div className="px-6 py-3 border-b border-border flex items-center gap-3 bg-card/20">
                <Input
                  value={currentWorkout.day_name}
                  onChange={e => updateWorkout(activeDay, 'day_name', e.target.value)}
                  className="font-heading font-bold text-base h-9 max-w-[220px] bg-transparent border-border/50"
                />
                <Badge variant="outline" className="text-xs">{currentWorkout.exercises.filter(e => e.name).length} exercises</Badge>
                <div className="flex items-center gap-2 ml-auto">
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => duplicateWorkout(activeDay)}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Duplicate
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => removeWorkout(activeDay)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                  </Button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-2 mb-2 px-2">
                    <div className="col-span-1" />
                    <div className="col-span-4 text-[10px] font-bold uppercase tracking-wider text-[#374151]">Exercise</div>
                    <div className="col-span-1 text-[10px] font-bold uppercase tracking-wider text-[#374151] text-center">Sets</div>
                    <div className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-[#374151]">Reps</div>
                    <div className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-[#374151]">Rest (s)</div>
                    <div className="col-span-1 text-[10px] font-bold uppercase tracking-wider text-[#374151] text-center">
                      <Zap className="w-3 h-3 inline" title="Intensity params" />
                    </div>
                    <div className="col-span-1" />
                  </div>

                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId={`exercises-${activeDay}`}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                          {currentWorkout.exercises.map((ex, eIdx) => {
                            const expanded = expandedExercises[`${activeDay}-${eIdx}`];
                            const hasIntensity = ex.rpe || ex.load_pct || ex.tempo;
                            return (
                              <Draggable key={`ex-${activeDay}-${eIdx}`} draggableId={`ex-${activeDay}-${eIdx}`} index={eIdx}>
                                {(drag, snap) => (
                                  <div
                                    ref={drag.innerRef}
                                    {...drag.draggableProps}
                                    className={cn(
                                      "bg-card border border-border rounded-xl overflow-hidden transition-all",
                                      snap.isDragging && "shadow-lg ring-1 ring-primary/30",
                                      ex.superset_group && "border-l-2 border-l-chart-3"
                                    )}
                                  >
                                    <div className="grid grid-cols-12 gap-2 items-center p-2">
                                      <div className="col-span-1 flex justify-center" {...drag.dragHandleProps}>
                                        <GripVertical className="w-3.5 h-3.5 text-[#374151] cursor-grab" />
                                      </div>
                                      <div className="col-span-4 flex items-center gap-1">
                                        <Input className="h-8 text-sm flex-1" placeholder="Exercise name" value={ex.name} onChange={e => updateExercise(activeDay, eIdx, 'name', e.target.value)} />
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-[#374151] hover:text-primary flex-shrink-0" onClick={() => setPickerTarget({ wIdx: activeDay, eIdx })}>
                                          <BookOpen className="w-3 h-3" />
                                        </Button>
                                        {ex._library_exercise?.video_url && (
                                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-primary flex-shrink-0" onClick={() => setDemoExercise(ex._library_exercise)}>
                                            <Play className="w-3 h-3" fill="currentColor" />
                                          </Button>
                                        )}
                                      </div>
                                      <Input className="col-span-1 h-8 text-sm text-center" type="number" min="1" value={ex.sets} onChange={e => updateExercise(activeDay, eIdx, 'sets', Number(e.target.value))} />
                                      <Input className="col-span-2 h-8 text-sm" placeholder="8-12" value={ex.reps} onChange={e => updateExercise(activeDay, eIdx, 'reps', e.target.value)} />
                                      <Input className="col-span-2 h-8 text-sm" type="number" placeholder="60" value={ex.rest_seconds} onChange={e => updateExercise(activeDay, eIdx, 'rest_seconds', Number(e.target.value))} />
                                      <button type="button" className="col-span-1 flex justify-center" onClick={() => toggleExpand(activeDay, eIdx)} title="Intensity params">
                                        {hasIntensity
                                          ? <Zap className="w-3.5 h-3.5 text-chart-4" fill="currentColor" />
                                          : <ChevronRight className={cn("w-3.5 h-3.5 text-[#374151] transition-transform", expanded && "rotate-90")} />}
                                      </button>
                                      <Button type="button" variant="ghost" size="icon" className="col-span-1 h-8 w-8 text-destructive" onClick={() => removeExercise(activeDay, eIdx)}>
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>

                                    {/* Intensity / volume expanded panel */}
                                    {expanded && (
                                      <div className="border-t border-border bg-secondary/20 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div>
                                          <Label className="text-[10px] text-[#374151] uppercase tracking-wider">RPE (1-10)</Label>
                                          <Input className="h-7 text-sm mt-1" placeholder="e.g. 8" value={ex.rpe || ''} onChange={e => updateExercise(activeDay, eIdx, 'rpe', e.target.value)} />
                                        </div>
                                        <div>
                                          <Label className="text-[10px] text-[#374151] uppercase tracking-wider">Load (% 1RM)</Label>
                                          <Input className="h-7 text-sm mt-1" placeholder="e.g. 75" value={ex.load_pct || ''} onChange={e => updateExercise(activeDay, eIdx, 'load_pct', e.target.value)} />
                                        </div>
                                        <div>
                                          <Label className="text-[10px] text-[#374151] uppercase tracking-wider">Tempo</Label>
                                          <Input className="h-7 text-sm mt-1 font-mono" placeholder="3-1-2-0" value={ex.tempo || ''} onChange={e => updateExercise(activeDay, eIdx, 'tempo', e.target.value)} />
                                        </div>
                                        <div>
                                          <Label className="text-[10px] text-[#374151] uppercase tracking-wider">Superset</Label>
                                          <Input className="h-7 text-sm mt-1" placeholder="A, B..." value={ex.superset_group || ''} onChange={e => updateExercise(activeDay, eIdx, 'superset_group', e.target.value)} />
                                        </div>
                                        <div className="col-span-2 sm:col-span-4">
                                          <Label className="text-[10px] text-[#374151] uppercase tracking-wider">Coaching Notes</Label>
                                          <Input className="h-7 text-sm mt-1" placeholder="Form cues, modifications..." value={ex.notes || ''} onChange={e => updateExercise(activeDay, eIdx, 'notes', e.target.value)} />
                                        </div>
                                        <div className="col-span-2 sm:col-span-4 flex items-center gap-3">
                                          <Switch checked={!!ex.auto_progress} onCheckedChange={v => updateExercise(activeDay, eIdx, 'auto_progress', v)} className="scale-75" />
                                          <span className="text-xs text-[#374151] flex items-center gap-1"><TrendingUp className="w-3 h-3 text-accent" /> Auto-progress</span>
                                          {ex.auto_progress && (
                                            <div className="flex items-center gap-1.5">
                                              <Input className="h-7 text-xs w-16" type="number" step="0.5" value={ex.progress_increment} onChange={e => updateExercise(activeDay, eIdx, 'progress_increment', Number(e.target.value))} />
                                              <span className="text-xs text-[#374151]">kg/wk</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  <Button type="button" variant="outline" size="sm" className="mt-4 text-xs border-dashed w-full" onClick={() => addExercise(activeDay)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Exercise
                  </Button>
                </div>

                {/* Right panel — library quick-add */}
                <BuilderExercisePicker onAdd={(ex) => addExerciseFromLibrary(activeDay, ex)} />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ExerciseDetailModal exercise={demoExercise} open={!!demoExercise} onClose={() => setDemoExercise(null)} onEdit={() => {}} />

      <ExercisePickerModal open={!!pickerTarget} onOpenChange={(v) => !v && setPickerTarget(null)} onSelect={selectFromLibrary} />

      <WeeklyScheduleView open={showSchedule} onClose={() => setShowSchedule(false)} workouts={workouts} meta={meta} />
    </div>
  );
}