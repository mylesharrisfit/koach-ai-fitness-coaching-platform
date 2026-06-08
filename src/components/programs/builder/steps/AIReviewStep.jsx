import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, RefreshCw, Check, ChevronDown, ChevronUp, Dumbbell, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const SECTION_COLOR = {
  warmup:   '#F59E0B',
  main:     '#2563EB',
  finisher: '#EF4444',
  cooldown: '#10B981',
};

function RationaleCard({ rationale }) {
  if (!rationale) return null;
  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: '#0E1525' }}>
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-4 h-4" style={{ color: '#85B7EB' }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#85B7EB' }}>AI Coach Rationale</span>
      </div>
      {rationale.split && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B5563] mb-0.5">Split</p>
          <p className="text-xs text-[#D1D5DB]">{rationale.split}</p>
        </div>
      )}
      {rationale.weekly_volume && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B5563] mb-0.5">Weekly Volume</p>
          <p className="text-xs text-[#D1D5DB]">{rationale.weekly_volume}</p>
        </div>
      )}
      {rationale.rep_range_rationale && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B5563] mb-0.5">Rep Ranges</p>
          <p className="text-xs text-[#D1D5DB]">{rationale.rep_range_rationale}</p>
        </div>
      )}
      {rationale.progression_approach && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B5563] mb-0.5">Progression</p>
          <p className="text-xs text-[#D1D5DB]">{rationale.progression_approach}</p>
        </div>
      )}
    </div>
  );
}

function DayCard({ workout }) {
  const [open, setOpen] = useState(false);
  const exCount = (workout.exercises || []).filter(e => !e._type).length;
  const mainEx = (workout.exercises || []).filter(e => e.section === 'main' || !e.section).slice(0, 3);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid #E2E5EC' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#F8F9FB] transition-colors"
        style={{ background: '#fff' }}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
          style={{ background: '#0E1525' }}>
          {workout.day_number}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0E1525] truncate">{workout.day_name}</p>
          {workout.workout_notes && (
            <p className="text-[11px] text-[#9CA3AF] truncate">{workout.workout_notes}</p>
          )}
        </div>
        <span className="text-[11px] text-[#9CA3AF] flex-shrink-0">{exCount} exercises</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-[#C4C9D4]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#C4C9D4]" />}
      </button>

      {open && (
        <div className="divide-y" style={{ borderTop: '0.5px solid #F3F4F6' }}>
          {(workout.exercises || []).map((ex, i) => (
            <div key={i} className="flex items-start gap-2.5 px-3 py-2 bg-white">
              <div
                className="w-1 rounded-full flex-shrink-0 mt-1"
                style={{ height: 28, background: SECTION_COLOR[ex.section] || '#9CA3AF' }}
              />
              {ex.image_url ? (
                <img src={ex.image_url} alt={ex.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-[#F3F4F6]">
                  <Dumbbell className="w-3.5 h-3.5 text-[#9CA3AF]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#0E1525] truncate">{ex.name}</p>
                <p className="text-[11px] text-[#6B7280]">
                  {ex.prescription || `${ex.sets} × ${ex.reps}${ex.rpe ? ` @ RPE ${ex.rpe}` : ''}`}
                </p>
                {ex.notes && (
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5 line-clamp-1">{ex.notes}</p>
                )}
              </div>
              <span
                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                style={{
                  background: (SECTION_COLOR[ex.section] || '#9CA3AF') + '20',
                  color: SECTION_COLOR[ex.section] || '#9CA3AF',
                }}
              >
                {ex.section || 'main'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AIReviewStep({
  program,
  onSave,
  onRegenerate,
  onRating,
  currentRating,
  isSaving,
  onProgramChange,
}) {
  const [title, setTitle] = useState(program.title || '');
  const [description, setDescription] = useState(program.description || '');

  const handleSave = () => {
    onSave({ ...program, title, description });
  };

  const totalExercises = (program.workouts || []).reduce((s, w) => s + (w.exercises || []).length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Days / Week', value: program.days_per_week || '—' },
          { label: 'Duration', value: `${program.duration_weeks || '—'} wks` },
          { label: 'Exercises', value: totalExercises },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#F8F9FB', border: '0.5px solid #E2E5EC' }}>
            <p className="text-lg font-bold text-[#0E1525]">{s.value}</p>
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI Rationale */}
      {program.coach_rationale && <RationaleCard rationale={program.coach_rationale} />}

      {/* Edit name / description */}
      <div className="space-y-3 pt-1">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Program Name</p>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="h-9 text-sm font-semibold"
          />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Description</p>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>
      </div>

      {/* Schedule preview */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Training Schedule</p>
        <div className="space-y-2">
          {(program.workouts || []).map((workout, idx) => (
            <DayCard key={idx} workout={workout} />
          ))}
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-3 pt-2">
        <p className="text-xs font-semibold text-[#6B7280]">Rate this output:</p>
        <button
          onClick={() => onRating('up')}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all', currentRating === 'up' ? 'text-white' : 'border border-[#E2E5EC] hover:border-[#2563EB]')}
          style={currentRating === 'up' ? { background: '#2563EB' } : {}}
        >
          <ThumbsUp className="w-3.5 h-3.5" /> Good
        </button>
        <button
          onClick={() => onRating('down')}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all', currentRating === 'down' ? 'text-white' : 'border border-[#E2E5EC] hover:border-red-400')}
          style={currentRating === 'down' ? { background: '#EF4444' } : {}}
        >
          <ThumbsDown className="w-3.5 h-3.5" /> Needs work
        </button>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-2" style={{ borderTop: '0.5px solid #E2E5EC' }}>
        <Button
          variant="outline"
          onClick={onRegenerate}
          disabled={isSaving}
          className="gap-2 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !title}
          className="gap-2 text-sm font-semibold"
          style={{ background: '#2563EB' }}
        >
          <Check className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save & Open Builder'}
        </Button>
      </div>
    </motion.div>
  );
}