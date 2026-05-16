import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, RefreshCw, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AIReviewStep({
  program,
  onSave,
  onRegenerate,
  onRating,
  currentRating,
  isSaving,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 max-h-96 overflow-y-auto pr-4"
    >
      {/* Edit Program Meta */}
      <div className="space-y-4 border-b pb-4">
        <div>
          <Label>Program Name</Label>
          <Input defaultValue={program.title} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea defaultValue={program.description} rows={2} />
        </div>
      </div>

      {/* Program Preview */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-3">
          {program.workouts?.map((workout, idx) => (
            <div key={idx} className="p-3 border rounded-lg">
              <h4 className="font-semibold text-sm">{workout.day_name}</h4>
              <p className="text-xs text-muted-foreground">
                {workout.exercises?.length || 0} exercises
              </p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="exercises" className="space-y-2">
          {program.workouts?.flatMap(w => w.exercises || []).slice(0, 5).map((ex, idx) => (
            <div key={idx} className="p-2 bg-secondary rounded text-sm">
              {ex.name} • {ex.sets}x{ex.reps}
            </div>
          ))}
          {program.workouts?.flatMap(w => w.exercises || []).length > 5 && (
            <p className="text-xs text-muted-foreground">
              + {program.workouts.flatMap(w => w.exercises || []).length - 5} more exercises
            </p>
          )}
        </TabsContent>
      </Tabs>

      {/* Feedback */}
      <div className="border-t pt-4 space-y-3">
        <p className="text-sm font-semibold">Rate this program</p>
        <div className="flex gap-2">
          <button
            onClick={() => onRating('up')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              currentRating === 'up'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border hover:border-primary'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-xs">Good</span>
          </button>
          <button
            onClick={() => onRating('down')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              currentRating === 'down'
                ? 'bg-destructive text-destructive-foreground'
                : 'border border-border hover:border-destructive'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            <span className="text-xs">Need changes</span>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onRegenerate}
          disabled={isSaving}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Regenerate
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="gap-2"
        >
          <Check className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Program'}
        </Button>
      </div>
    </motion.div>
  );
}