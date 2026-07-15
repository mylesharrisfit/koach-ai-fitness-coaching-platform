import React from 'react';
import { X, Layers, Tag, Timer, Zap, Link, TrendingUp, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';

const SET_TYPES = [
  { value: 'straight', label: 'Straight' },
  { value: 'superset', label: 'Superset' },
  { value: 'dropset', label: 'Dropset' },
  { value: 'amrap', label: 'AMRAP' },
  { value: 'failure', label: 'Failure' },
];

const SECTION_LABELS = [
  { value: 'warmup', label: '🔥 Warm-Up' },
  { value: 'main', label: '💪 Main Work' },
  { value: 'finisher', label: '⚡ Finisher' },
  { value: 'cooldown', label: '🧘 Cooldown' },
];

function FieldLabel({ children }) {
  return (
    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{children}</p>
  );
}

export default function ExerciseDetailsPanel({ exercise, onChange, onClose }) {
  if (!exercise) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center" style={{ background: 'var(--tc-muted)' }}>
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[var(--kc-3730a3)]" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">Select an exercise<br/>to edit its details</p>
      </div>
    );
  }

  const u = (field, val) => onChange({ ...exercise, [field]: val });

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--tc-muted)', borderLeft: '1px solid var(--tc-border)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--tc-muted)' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Exercise Details</p>
            <p className="text-sm font-bold text-foreground truncate">{exercise.name || 'Unnamed exercise'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable fields */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Exercise name */}
        <div>
          <FieldLabel>Name</FieldLabel>
          <Input
            value={exercise.name || ''}
            onChange={e => u('name', e.target.value)}
            placeholder="Exercise name"
            className="h-8 text-sm border-border bg-card"
          />
        </div>

        {/* Sets / Reps / Rest in a row */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <FieldLabel>Sets</FieldLabel>
            <Input type="number" min="1" value={exercise.sets || 3}
              onChange={e => u('sets', Number(e.target.value))}
              className="h-8 text-sm text-center border-border bg-card" />
          </div>
          <div>
            <FieldLabel>{exercise.section === 'warmup' || exercise.section === 'cooldown' ? 'Secs' : 'Reps'}</FieldLabel>
            {exercise.section === 'warmup' || exercise.section === 'cooldown' ? (
              <Input type="number" value={exercise.duration_seconds ?? 30}
                onChange={e => u('duration_seconds', Number(e.target.value))}
                className="h-8 text-sm text-center border-border bg-card" />
            ) : (
              <Input value={exercise.reps || '10'} placeholder="10"
                onChange={e => u('reps', e.target.value)}
                className="h-8 text-sm text-center border-border bg-card" />
            )}
          </div>
          <div>
            <FieldLabel>Rest (s)</FieldLabel>
            <Input type="number" value={exercise.rest_seconds || 60}
              onChange={e => u('rest_seconds', Number(e.target.value))}
              className="h-8 text-sm text-center border-border bg-card" />
          </div>
        </div>

        {/* Set type */}
        <div>
          <FieldLabel><span className="flex items-center gap-1"><Layers className="w-3 h-3 inline" /> Set Type</span></FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {SET_TYPES.map(st => (
              <button
                key={st.value}
                onClick={() => u('set_type', st.value)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors"
                style={{
                  background: exercise.set_type === st.value ? 'var(--tc-primary)' : 'var(--tc-muted)',
                  color: exercise.set_type === st.value ? 'var(--tc-primary-foreground)' : 'var(--tc-muted-foreground)',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Superset group */}
        {exercise.set_type === 'superset' && (
          <div>
            <FieldLabel><span className="flex items-center gap-1"><Tag className="w-3 h-3 inline" /> Group (A/B/C)</span></FieldLabel>
            <Input className="h-8 text-sm border-border bg-card font-mono text-center" placeholder="A"
              value={exercise.superset_group || ''} onChange={e => u('superset_group', e.target.value)} />
          </div>
        )}

        {/* Dropset scheme */}
        {exercise.set_type === 'dropset' && (
          <div>
            <FieldLabel>Drop Set Details</FieldLabel>
            <Input className="h-8 text-sm border-border bg-card" placeholder="e.g. 3 drops, 20% each"
              value={exercise.dropset_scheme || ''} onChange={e => u('dropset_scheme', e.target.value)} />
          </div>
        )}

        {/* Tempo + RPE */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel><span className="flex items-center gap-1"><Timer className="w-3 h-3 inline" /> Tempo</span></FieldLabel>
            <Input className="h-8 text-sm border-border bg-card font-mono" placeholder="3-1-2-0"
              value={exercise.tempo || ''} onChange={e => u('tempo', e.target.value)} />
          </div>
          <div>
            <FieldLabel><span className="flex items-center gap-1"><Zap className="w-3 h-3 inline" /> RPE</span></FieldLabel>
            <Input type="number" min="1" max="10" className="h-8 text-sm border-border bg-card text-center"
              placeholder="8" value={exercise.rpe || ''} onChange={e => u('rpe', e.target.value)} />
          </div>
        </div>

        {/* Section */}
        <div>
          <FieldLabel>Section</FieldLabel>
          <div className="flex flex-col gap-1">
            {SECTION_LABELS.map(s => (
              <button
                key={s.value}
                onClick={() => u('section', s.value)}
                className="text-left text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: exercise.section === s.value ? 'var(--tc-accent)' : 'var(--tc-muted)',
                  color: exercise.section === s.value ? 'var(--kc-3730a3)' : 'var(--tc-muted-foreground)',
                  border: exercise.section === s.value ? '1px solid var(--tc-accent)' : '1px solid transparent',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Video URL */}
        <div>
          <FieldLabel><span className="flex items-center gap-1"><Link className="w-3 h-3 inline" /> Video URL</span></FieldLabel>
          <Input className="h-8 text-xs border-border bg-card" placeholder="https://youtube.com/..."
            value={exercise.video_url || ''} onChange={e => u('video_url', e.target.value)} />
        </div>

        {/* Progression */}
        <div className="rounded-xl p-3" style={{ background: 'var(--tc-accent)', border: '1px solid var(--tc-accent)' }}>
          <FieldLabel><span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 inline" /> Progression Rule</span></FieldLabel>
          <select
            value={exercise.progression_type || 'none'}
            onChange={e => u('progression_type', e.target.value)}
            className="w-full h-8 text-xs rounded-lg border bg-card px-2 focus:outline-none mb-2"
            style={{ borderColor: 'var(--tc-accent)' }}
          >
            <option value="none">None</option>
            <option value="weight">Add Weight (lbs/kg)</option>
            <option value="reps">Add Reps</option>
            <option value="sets">Add Set</option>
          </select>
          {exercise.progression_type && exercise.progression_type !== 'none' && (
            <Input type="number" step="0.5" min="0.5"
              className="h-8 text-sm border bg-card text-center"
              style={{ borderColor: 'var(--tc-accent)' }}
              value={exercise.progression_value || 5}
              onChange={e => u('progression_value', Number(e.target.value))} />
          )}
        </div>

        {/* Notes */}
        <div>
          <FieldLabel>Coaching Notes</FieldLabel>
          <textarea
            rows={3}
            className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card resize-none focus:outline-none focus:border-primary"
            placeholder="Form cues, modifications, client-specific instructions..."
            value={exercise.notes || ''}
            onChange={e => u('notes', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}