import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const defaultForm = {
  title: '', description: '', duration_weeks: 8, difficulty: 'intermediate',
  category: 'custom', days_per_week: 4, is_template: false, workouts: []
};

export default function ProgramForm({ open, onOpenChange, onSubmit, program }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    setForm(program ? { ...defaultForm, ...program } : defaultForm);
  }, [program, open]);

  const addWorkout = () => {
    setForm(f => ({
      ...f,
      workouts: [...(f.workouts || []), {
        day_name: `Day ${(f.workouts?.length || 0) + 1}`,
        day_number: (f.workouts?.length || 0) + 1,
        exercises: [{ name: '', sets: 3, reps: '10', rest_seconds: 60, notes: '', auto_progress: false, progress_increment: 2.5 }]
      }]
    }));
  };

  const addExercise = (workoutIdx) => {
    const workouts = [...form.workouts];
    workouts[workoutIdx].exercises.push({ name: '', sets: 3, reps: '10', rest_seconds: 60, notes: '', auto_progress: false, progress_increment: 2.5 });
    setForm({ ...form, workouts });
  };

  const updateExercise = (wIdx, eIdx, field, value) => {
    const workouts = form.workouts.map((w, wi) => wi !== wIdx ? w : {
      ...w,
      exercises: w.exercises.map((e, ei) => ei !== eIdx ? e : { ...e, [field]: value })
    });
    setForm({ ...form, workouts });
  };

  const removeExercise = (wIdx, eIdx) => {
    const workouts = form.workouts.map((w, wi) => wi !== wIdx ? w : {
      ...w,
      exercises: w.exercises.filter((_, ei) => ei !== eIdx)
    });
    setForm({ ...form, workouts });
  };

  const removeWorkout = (wIdx) => {
    setForm({ ...form, workouts: form.workouts.filter((_, i) => i !== wIdx) });
  };

  const updateWorkout = (wIdx, field, value) => {
    const workouts = form.workouts.map((w, wi) => wi !== wIdx ? w : { ...w, [field]: value });
    setForm({ ...form, workouts });
  };

  const onDragEnd = (wIdx, result) => {
    if (!result.destination) return;
    const workouts = [...form.workouts];
    const exercises = [...workouts[wIdx].exercises];
    const [moved] = exercises.splice(result.source.index, 1);
    exercises.splice(result.destination.index, 0, moved);
    workouts[wIdx] = { ...workouts[wIdx], exercises };
    setForm({ ...form, workouts });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, duration_weeks: Number(form.duration_weeks), days_per_week: Number(form.days_per_week) });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{program ? 'Edit Program' : 'Create Program'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Program Name *</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="e.g., 12-Week Shred" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
            </div>
            <div>
              <Label>Duration (weeks)</Label>
              <Input type="number" value={form.duration_weeks} onChange={e => setForm({...form, duration_weeks: e.target.value})} />
            </div>
            <div>
              <Label>Days/Week</Label>
              <Input type="number" value={form.days_per_week} onChange={e => setForm({...form, days_per_week: e.target.value})} />
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onValueChange={v => setForm({...form, difficulty: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="hypertrophy">Hypertrophy</SelectItem>
                  <SelectItem value="fat_loss">Fat Loss</SelectItem>
                  <SelectItem value="athletic">Athletic</SelectItem>
                  <SelectItem value="mobility">Mobility</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Save as template toggle */}
          <div className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl">
            <Switch checked={!!form.is_template} onCheckedChange={v => setForm({...form, is_template: v})} />
            <div>
              <p className="text-sm font-medium">Save as Template</p>
              <p className="text-xs text-muted-foreground">Templates can be cloned to any client instantly</p>
            </div>
          </div>

          {/* Workout Days */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold">Workout Days</h3>
              <Button type="button" variant="outline" size="sm" onClick={addWorkout}>
                <Plus className="w-4 h-4 mr-1" /> Add Day
              </Button>
            </div>
            <div className="space-y-4">
              {form.workouts?.map((workout, wIdx) => (
                <div key={wIdx} className="border border-border rounded-xl p-4 bg-secondary/30">
                  <div className="flex items-center gap-3 mb-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      value={workout.day_name}
                      onChange={e => updateWorkout(wIdx, 'day_name', e.target.value)}
                      className="font-medium h-8 max-w-[200px]"
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 ml-auto text-destructive" onClick={() => removeWorkout(wIdx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Exercise header */}
                  <div className="grid grid-cols-12 gap-2 mb-1 px-1">
                    <span className="col-span-1 text-[10px] text-muted-foreground"></span>
                    <span className="col-span-3 text-[10px] text-muted-foreground">Exercise</span>
                    <span className="col-span-1 text-[10px] text-muted-foreground">Sets</span>
                    <span className="col-span-2 text-[10px] text-muted-foreground">Reps</span>
                    <span className="col-span-2 text-[10px] text-muted-foreground">Rest(s)</span>
                    <span className="col-span-2 text-[10px] text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" />Progress</span>
                  </div>

                  <DragDropContext onDragEnd={(r) => onDragEnd(wIdx, r)}>
                    <Droppable droppableId={`workout-${wIdx}`}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                          {workout.exercises.map((ex, eIdx) => (
                            <Draggable key={eIdx} draggableId={`w${wIdx}-e${eIdx}`} index={eIdx}>
                              {(drag, snapshot) => (
                                <div
                                  ref={drag.innerRef}
                                  {...drag.draggableProps}
                                  className={cn("grid grid-cols-12 gap-2 items-center rounded-lg", snapshot.isDragging && "bg-primary/5 shadow-md")}
                                >
                                  <div className="col-span-1 flex justify-center" {...drag.dragHandleProps}>
                                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab" />
                                  </div>
                                  <Input className="col-span-3 h-8 text-xs" placeholder="Exercise" value={ex.name} onChange={e => updateExercise(wIdx, eIdx, 'name', e.target.value)} />
                                  <Input className="col-span-1 h-8 text-xs" type="number" placeholder="3" value={ex.sets} onChange={e => updateExercise(wIdx, eIdx, 'sets', Number(e.target.value))} />
                                  <Input className="col-span-2 h-8 text-xs" placeholder="10" value={ex.reps} onChange={e => updateExercise(wIdx, eIdx, 'reps', e.target.value)} />
                                  <Input className="col-span-2 h-8 text-xs" type="number" placeholder="60" value={ex.rest_seconds} onChange={e => updateExercise(wIdx, eIdx, 'rest_seconds', Number(e.target.value))} />
                                  <div className="col-span-2 flex items-center gap-1">
                                    <Switch
                                      checked={!!ex.auto_progress}
                                      onCheckedChange={v => updateExercise(wIdx, eIdx, 'auto_progress', v)}
                                      className="scale-75"
                                    />
                                    {ex.auto_progress && (
                                      <Input
                                        className="h-7 text-xs w-14"
                                        type="number"
                                        step="0.5"
                                        placeholder="+kg"
                                        value={ex.progress_increment}
                                        onChange={e => updateExercise(wIdx, eIdx, 'progress_increment', Number(e.target.value))}
                                      />
                                    )}
                                  </div>
                                  <Button type="button" variant="ghost" size="icon" className="col-span-1 h-8 w-8 text-destructive" onClick={() => removeExercise(wIdx, eIdx)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  <Button type="button" variant="ghost" size="sm" className="text-primary text-xs mt-2" onClick={() => addExercise(wIdx)}>
                    <Plus className="w-3 h-3 mr-1" /> Add Exercise
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              <span>Exercises with auto-progress will add weight each week when completed</span>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{program ? 'Update' : 'Create Program'}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}