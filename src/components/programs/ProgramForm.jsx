import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export default function ProgramForm({ open, onOpenChange, onSubmit, program }) {
  const [form, setForm] = useState(program || {
    title: '', description: '', duration_weeks: 8, difficulty: 'intermediate',
    category: 'custom', days_per_week: 4, is_template: false, workouts: []
  });

  const addWorkout = () => {
    setForm({
      ...form,
      workouts: [...(form.workouts || []), {
        day_name: `Day ${(form.workouts?.length || 0) + 1}`,
        day_number: (form.workouts?.length || 0) + 1,
        exercises: [{ name: '', sets: 3, reps: '10', rest_seconds: 60, notes: '' }]
      }]
    });
  };

  const addExercise = (workoutIdx) => {
    const workouts = [...form.workouts];
    workouts[workoutIdx].exercises.push({ name: '', sets: 3, reps: '10', rest_seconds: 60, notes: '' });
    setForm({ ...form, workouts });
  };

  const updateExercise = (wIdx, eIdx, field, value) => {
    const workouts = [...form.workouts];
    workouts[wIdx].exercises[eIdx][field] = value;
    setForm({ ...form, workouts });
  };

  const removeExercise = (wIdx, eIdx) => {
    const workouts = [...form.workouts];
    workouts[wIdx].exercises.splice(eIdx, 1);
    setForm({ ...form, workouts });
  };

  const removeWorkout = (wIdx) => {
    const workouts = form.workouts.filter((_, i) => i !== wIdx);
    setForm({ ...form, workouts });
  };

  const updateWorkout = (wIdx, field, value) => {
    const workouts = [...form.workouts];
    workouts[wIdx][field] = value;
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
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Program Name *</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="e.g., 12-Week Shred" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
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
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <Input
                      value={workout.day_name}
                      onChange={e => updateWorkout(wIdx, 'day_name', e.target.value)}
                      className="font-medium h-8 max-w-[200px]"
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 ml-auto text-destructive" onClick={() => removeWorkout(wIdx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {workout.exercises.map((ex, eIdx) => (
                      <div key={eIdx} className="grid grid-cols-12 gap-2 items-center">
                        <Input className="col-span-4 h-8 text-xs" placeholder="Exercise name" value={ex.name} onChange={e => updateExercise(wIdx, eIdx, 'name', e.target.value)} />
                        <Input className="col-span-2 h-8 text-xs" type="number" placeholder="Sets" value={ex.sets} onChange={e => updateExercise(wIdx, eIdx, 'sets', Number(e.target.value))} />
                        <Input className="col-span-2 h-8 text-xs" placeholder="Reps" value={ex.reps} onChange={e => updateExercise(wIdx, eIdx, 'reps', e.target.value)} />
                        <Input className="col-span-2 h-8 text-xs" type="number" placeholder="Rest(s)" value={ex.rest_seconds} onChange={e => updateExercise(wIdx, eIdx, 'rest_seconds', Number(e.target.value))} />
                        <Button type="button" variant="ghost" size="icon" className="col-span-1 h-8 w-8 text-destructive" onClick={() => removeExercise(wIdx, eIdx)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" className="text-primary text-xs" onClick={() => addExercise(wIdx)}>
                      <Plus className="w-3 h-3 mr-1" /> Add Exercise
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{program ? 'Update' : 'Create Program'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}