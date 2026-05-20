import React, { useState, useEffect } from 'react';
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
  X, Link, Zap, Timer, Tag, Layers, TrendingUp, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ExerciseDetailModal from '@/components/exercises/ExerciseDetailModal';
import ExerciseLibraryPicker from '@/components/programs/ExerciseLibraryPicker';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import ProgramBuilderHeader from '@/components/programs/builder/ProgramBuilderHeader';
import ProgramSettingsPanel from '@/components/programs/builder/ProgramSettingsPanel';
import TrainingDayCard from '@/components/programs/builder/TrainingDayCard';
import AIAssistButton from '@/components/programs/builder/AIAssistButton';

/* ── Constants ── */
const MUSCLE_COLORS = {
  chest: 'bg-red-50 text-red-600', back: 'bg-emerald-50 text-emerald-700',
  shoulders: 'bg-purple-50 text-purple-700', biceps: 'bg-blue-50 text-blue-700',
  triceps: 'bg-blue-50 text-blue-700', legs: 'bg-orange-50 text-orange-700',
  glutes: 'bg-orange-50 text-orange-700', core: 'bg-amber-50 text-amber-700',
  full_body: 'bg-indigo-50 text-indigo-700', cardio: 'bg-teal-50 text-teal-700',
};

const SET_TYPES = [
  { value: 'straight', label: 'Straight Set', color: 'bg-slate-100 text-slate-600' },
  { value: 'superset', label: 'Superset', color: 'bg-purple-100 text-purple-700' },
  { value: 'dropset', label: 'Dropset', color: 'bg-orange-100 text-orange-700' },
  { value: 'amrap', label: 'AMRAP', color: 'bg-red-100 text-red-700' },
  { value: 'failure', label: 'To Failure', color: 'bg-rose-100 text-rose-700' },
];

const SECTION_LABELS = [
  { value: 'warmup', label: '🔥 Warm-Up', color: 'border-l-amber-400 bg-amber-50/40' },
  { value: 'main', label: '💪 Main Work', color: 'border-l-blue-500 bg-blue-50/30' },
  { value: 'finisher', label: '⚡ Finisher', color: 'border-l-red-400 bg-red-50/30' },
  { value: 'cooldown', label: '🧘 Cooldown / Stretching', color: 'border-l-emerald-400 bg-emerald-50/30' },
];

const SECTION_HEADER_STYLES = {
  warmup:   { bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  main:     { bar: 'bg-blue-500',  text: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200' },
  finisher: { bar: 'bg-red-400',   text: 'text-red-700',   bg: 'bg-red-50 border-red-200' },
  cooldown: { bar: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
};

const newExercise = (section = 'main') => ({
  name: '', sets: 3, reps: '10', rest_seconds: 60,
  tempo: '', notes: '', video_url: '',
  set_type: 'straight', rpe: '', rir: '',
  superset_group: '', dropset_scheme: '',
  stretch_type: 'static', duration_seconds: 30,
  section,
  progression_type: 'none', progression_value: 5,
});
const newWorkout = (idx) => ({
  day_name: `Day ${idx + 1}`, day_number: idx + 1, exercises: [newExercise('main')],
});
const defaultMeta = {
  title: '', description: '', duration_weeks: 8, difficulty: 'intermediate',
  category: 'custom', days_per_week: 4, is_template: false,
  equipment: [], tags: [], estimated_session_length: '60',
  progression_model: 'linear', deload_frequency: 'never', rest_day_notes: '',
};

/* ExerciseLibraryModal removed — using ExerciseLibraryPicker component */

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setDone(true); toast.success('Program assigned!'); },
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
              <Button className="flex-1 text-xs" disabled={!selected || assignMutation.isPending} onClick={() => assignMutation.mutate()}>
                {assignMutation.isPending ? 'Assigning...' : 'Assign Program'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Section Divider ── */
function SectionDivider({ section, onAddExercise }) {
  const s = SECTION_HEADER_STYLES[section] || SECTION_HEADER_STYLES.main;
  const label = SECTION_LABELS.find(l => l.value === section)?.label || section;
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${s.bg} mb-1 mt-2`}>
      <div className={`w-1 h-5 rounded-full ${s.bar}`} />
      <span className={`text-xs font-bold uppercase tracking-wider ${s.text}`}>{label}</span>
      <button onClick={onAddExercise}
        className={`ml-auto flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg ${s.bg} ${s.text} hover:opacity-80 border border-current/20 transition-opacity`}>
        <Plus className="w-3 h-3" /> Add
      </button>
    </div>
  );
}

/* ── Quick Add Row ── */
function QuickAddRow({ onAdd }) {
  const [name, setName] = useState('');
  return (
    <div className="flex items-center gap-2 mb-2">
      <Input
        placeholder="Type exercise name and press Enter..."
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && name.trim()) {
            onAdd(name.trim());
            setName('');
          }
        }}
        className="h-8 text-sm bg-white border-dashed"
      />
    </div>
  );
}

/* ── Exercise Row ── */
function ExerciseRow({ ex, wIdx, eIdx, drag, isDragging, onUpdate, onRemove, onPickLibrary, onWatchDemo }) {
  const [expanded, setExpanded] = useState(false);
  const setTypeInfo = SET_TYPES.find(s => s.value === ex.set_type) || SET_TYPES[0];
  const hasExtra = ex.tempo || ex.notes || ex.video_url || ex.rpe || (ex.set_type && ex.set_type !== 'straight') || ex.superset_group;

  const borderColor = ex.set_type === 'superset' ? 'border-l-purple-400'
    : ex.set_type === 'dropset' ? 'border-l-orange-400'
    : ex.set_type === 'amrap' ? 'border-l-red-400'
    : ex.set_type === 'failure' ? 'border-l-rose-400'
    : ex.superset_group ? 'border-l-purple-400'
    : 'border-l-transparent';

  return (
    <div ref={drag.innerRef} {...drag.draggableProps}
      className={cn('bg-white border rounded-xl overflow-hidden transition-all border-l-2',
        isDragging ? 'shadow-lg border-primary/30' : 'border-[#E7EAF3]',
        borderColor
      )}>
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div {...drag.dragHandleProps} className="flex-shrink-0 cursor-grab">
          <GripVertical className="w-3.5 h-3.5 text-[#D1D5DB]" />
        </div>

        {/* Set type pill */}
        {ex.set_type && ex.set_type !== 'straight' && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${setTypeInfo.color}`}>
            {setTypeInfo.label.split(' ')[0].toUpperCase()}
          </span>
        )}
        {ex.superset_group && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 bg-purple-100 text-purple-700">
            {ex.superset_group}
          </span>
        )}

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
          {(ex._library_exercise?.video_url || ex.video_url) && (
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
            {(ex.section === 'warmup' || ex.section === 'cooldown') ? (
              <>
                <Input type="number" value={ex.duration_seconds ?? 30} placeholder="30"
                  onChange={e => onUpdate('duration_seconds', Number(e.target.value))}
                  className="h-8 w-16 text-sm text-center border-[#E7EAF3] bg-[#F8F9FD] focus:bg-white p-1" />
                <span className="text-[9px] text-[#9CA3AF] mt-0.5">sec</span>
              </>
            ) : (
              <>
                <Input value={ex.reps} placeholder="10" onChange={e => onUpdate('reps', e.target.value)}
                  className="h-8 w-16 text-sm text-center border-[#E7EAF3] bg-[#F8F9FD] focus:bg-white p-1" />
                <span className="text-[9px] text-[#9CA3AF] mt-0.5">reps</span>
              </>
            )}
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

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-[#F6F7FB] bg-[#FAFBFE] px-4 py-3 space-y-3">
          {/* Row 1: Set Type + Superset Group + Tempo + RPE */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3" /> Set Type
              </Label>
              <select
                value={ex.set_type || 'straight'}
                onChange={e => onUpdate('set_type', e.target.value)}
                className="mt-1 h-8 w-full text-xs rounded-lg border border-[#E7EAF3] bg-white px-2 focus:outline-none focus:border-primary/40"
              >
                {SET_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3" /> Group (A/B/C)
              </Label>
              <Input className="h-8 text-sm mt-1 border-[#E7EAF3] font-mono text-center" placeholder="A"
                value={ex.superset_group || ''} onChange={e => onUpdate('superset_group', e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
                <Timer className="w-3 h-3" /> Tempo
              </Label>
              <Input className="h-8 text-sm mt-1 border-[#E7EAF3] font-mono" placeholder="3-1-2-0"
                value={ex.tempo || ''} onChange={e => onUpdate('tempo', e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3" /> RPE (1–10)
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input type="number" min="1" max="10" className="h-8 text-sm border-[#E7EAF3] text-center w-16" placeholder="8"
                  value={ex.rpe || ''} onChange={e => onUpdate('rpe', e.target.value)} />
                {ex.rpe && (
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                    ex.rpe >= 9 ? 'bg-red-100 text-red-700' : ex.rpe >= 7 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700')}>
                    RPE {ex.rpe}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Row 1b: RIR + Drop Set Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">RIR (0–5)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input type="number" min="0" max="5" className="h-8 text-sm border-[#E7EAF3] text-center w-16"
                  placeholder="2"
                  value={ex.rir || ''}
                  onChange={e => onUpdate('rir', e.target.value)} />
                {ex.rir !== undefined && ex.rir !== '' && (
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                    ex.rir <= 1 ? 'bg-red-100 text-red-700' :
                    ex.rir <= 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700')}>
                    {ex.rir} RIR
                  </span>
                )}
              </div>
            </div>
            {ex.set_type === 'dropset' && (
              <div className="sm:col-span-3">
                <Label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Drop Sets</Label>
                <Input className="h-8 text-sm mt-1 border-[#E7EAF3]"
                  placeholder="e.g. 3 drops, 20% each"
                  value={ex.dropset_scheme || ''}
                  onChange={e => onUpdate('dropset_scheme', e.target.value)} />
              </div>
            )}
            {ex.section === 'cooldown' && (
              <div>
                <Label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Stretch Type</Label>
                <select value={ex.stretch_type || 'static'}
                  onChange={e => onUpdate('stretch_type', e.target.value)}
                  className="mt-1 h-8 w-full text-xs rounded-lg border border-[#E7EAF3] bg-white px-2 focus:outline-none focus:border-primary/40">
                  <option value="static">Static Hold</option>
                  <option value="dynamic">Dynamic</option>
                  <option value="pnf">PNF</option>
                  <option value="foam_roll">Foam Roll</option>
                  <option value="mobility">Mobility Drill</option>
                </select>
              </div>
            )}
          </div>

          {/* Row 2: Section + Video URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Section</Label>
              <select
                value={ex.section || 'main'}
                onChange={e => onUpdate('section', e.target.value)}
                className="mt-1 h-8 w-full text-xs rounded-lg border border-[#E7EAF3] bg-white px-2 focus:outline-none focus:border-primary/40"
              >
                {SECTION_LABELS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
                <Link className="w-3 h-3" /> Video / YouTube URL
              </Label>
              <Input className="h-8 text-xs mt-1 border-[#E7EAF3]" placeholder="https://youtube.com/..."
                value={ex.video_url || ''} onChange={e => onUpdate('video_url', e.target.value)} />
            </div>
          </div>

          {/* Row 3: Progression Rule */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
            <div>
              <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Progression Rule</Label>
              <select
                value={ex.progression_type || 'none'}
                onChange={e => onUpdate('progression_type', e.target.value)}
                className="mt-1 h-8 w-full text-xs rounded-lg border border-blue-100 bg-white px-2 focus:outline-none focus:border-primary/40"
              >
                <option value="none">None</option>
                <option value="weight">Add Weight (lbs/kg)</option>
                <option value="reps">Add Reps</option>
                <option value="sets">Add Set</option>
              </select>
            </div>
            {ex.progression_type && ex.progression_type !== 'none' && (
              <div>
                <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  {ex.progression_type === 'weight' ? 'lbs/kg per week' : ex.progression_type === 'reps' ? 'Reps per week' : 'Sets per week'}
                </Label>
                <Input type="number" step="0.5" min="0.5"
                  className="h-8 text-sm mt-1 border-blue-100 bg-white text-center"
                  value={ex.progression_value || 5}
                  onChange={e => onUpdate('progression_value', Number(e.target.value))} />
              </div>
            )}
            {ex.progression_type && ex.progression_type !== 'none' && (
              <div className="flex items-end pb-0.5">
                <span className="text-[10px] text-blue-600 leading-relaxed">
                  ↑ {ex.progression_value || 5} {ex.progression_type === 'weight' ? 'lbs' : ex.progression_type === 'reps' ? 'reps' : 'set'} added each week automatically
                </span>
              </div>
            )}
          </div>

          {/* Row 4: Coaching Notes */}
          <div>
            <Label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Coaching Notes / Instructions</Label>
            <textarea
              rows={2}
              className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-[#E7EAF3] bg-white resize-none focus:outline-none focus:border-primary/40"
              placeholder="Form cues, modifications, client-specific instructions..."
              value={ex.notes || ''}
              onChange={e => onUpdate('notes', e.target.value)}
            />
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
    equipment: existingProgram.equipment || [],
    tags: existingProgram.tags || [],
    estimated_session_length: existingProgram.estimated_session_length || '60',
    progression_model: existingProgram.progression_model || 'linear',
    deload_frequency: existingProgram.deload_frequency || 'never',
    rest_day_notes: existingProgram.rest_day_notes || '',
  } : { ...defaultMeta });

  const [workouts, setWorkouts] = useState(existingProgram?.workouts || []);
  const [activeDay, setActiveDay] = useState(0);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [demoExercise, setDemoExercise] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savedId, setSavedId] = useState(existingProgram?.id || null);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save every 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasUnsavedChanges) {
        const now = new Date();
        setLastSaved(`${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        setHasUnsavedChanges(false);
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [hasUnsavedChanges]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const saveMutation = useMutation({
    mutationFn: (data) => existingProgram || savedId
      ? base44.entities.WorkoutProgram.update(existingProgram?.id || savedId, data)
      : base44.entities.WorkoutProgram.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      if (result?.id) setSavedId(result.id);
      const now = new Date();
      setLastSaved(`${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      setHasUnsavedChanges(false);
      toast.success(existingProgram || savedId ? 'Program updated!' : 'Program saved!');
    },
  });

  const handleSave = () => {
    if (!meta.title.trim()) { toast.error('Enter a program name'); return; }
    saveMutation.mutate({ ...meta, workouts, duration_weeks: Number(meta.duration_weeks), days_per_week: Number(meta.days_per_week) });
  };

  const trackChange = () => {
    setHasUnsavedChanges(true);
  };

  const addWorkout = () => {
    const next = [...workouts, newWorkout(workouts.length)];
    setWorkouts(next); setActiveDay(next.length - 1); trackChange();
  };
  const removeWorkout = (idx) => {
    setWorkouts(w => w.filter((_, i) => i !== idx));
    setActiveDay(a => Math.max(0, Math.min(a, workouts.length - 2)));
    trackChange();
  };
  const duplicateWorkout = (idx) => {
    const copy = { ...workouts[idx], exercises: workouts[idx].exercises.map(e => ({ ...e })), day_name: `${workouts[idx].day_name} (Copy)` };
    const next = [...workouts.slice(0, idx + 1), copy, ...workouts.slice(idx + 1)];
    setWorkouts(next); setActiveDay(idx + 1); trackChange();
  };
  const moveWorkoutUp = (idx) => {
    if (idx <= 0) return;
    const next = [...workouts];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setWorkouts(next); setActiveDay(idx - 1); trackChange();
  };
  const moveWorkoutDown = (idx) => {
    if (idx >= workouts.length - 1) return;
    const next = [...workouts];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setWorkouts(next); setActiveDay(idx + 1); trackChange();
  };
  const updateWorkoutName = (idx, val) => {
    setWorkouts(w => w.map((wk, i) => i !== idx ? wk : { ...wk, day_name: val }));
    trackChange();
  };

  const addExercise = (wIdx, libraryEx = null, section = 'main') => {
    const ex = libraryEx
      ? { ...newExercise(section), name: libraryEx.name, rest_seconds: libraryEx.default_rest_seconds || 60, _library_id: libraryEx.id, _library_exercise: libraryEx, video_url: libraryEx.video_url || '' }
      : newExercise(section);
    setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : { ...wk, exercises: [...wk.exercises, ex] }));
    trackChange();
  };
  const removeExercise = (wIdx, eIdx) => {
    setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : { ...wk, exercises: wk.exercises.filter((_, ei) => ei !== eIdx) }));
    trackChange();
  };
  const updateExercise = (wIdx, eIdx, field, value) => {
    setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : {
      ...wk, exercises: wk.exercises.map((ex, ei) => ei !== eIdx ? ex : { ...ex, [field]: value })
    }));
    trackChange();
  };
  const selectFromLibrary = (libraryEx) => {
    if (!pickerTarget) return;
    if (pickerTarget.mode === 'add') {
      addExercise(activeDay, libraryEx, pickerTarget.section || 'main');
    } else {
      const { wIdx, eIdx } = pickerTarget;
      setWorkouts(w => w.map((wk, i) => i !== wIdx ? wk : {
        ...wk, exercises: wk.exercises.map((ex, ei) => ei !== eIdx ? ex : {
          ...ex, name: libraryEx.name, rest_seconds: libraryEx.default_rest_seconds || 60,
          _library_id: libraryEx.id, _library_exercise: libraryEx,
          video_url: libraryEx.video_url || ex.video_url || '',
        })
      }));
    }
    setPickerTarget(null);
  };

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

  // Group exercises by section for display
  const exercisesBySection = (exercises = []) => {
    const sections = ['warmup', 'main', 'finisher', 'cooldown'];
    const grouped = {};
    sections.forEach(s => { grouped[s] = []; });
    exercises.forEach((ex, origIdx) => {
      const sec = ex.section || 'main';
      if (!grouped[sec]) grouped[sec] = [];
      grouped[sec].push({ ex, origIdx });
    });
    // Only return sections that have exercises OR are 'main'
    return sections.filter(s => grouped[s].length > 0 || s === 'main').map(s => ({ section: s, items: grouped[s] }));
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col">
      <ProgramBuilderHeader
        title={meta.title}
        onTitleChange={t => { setMeta(m => ({ ...m, title: t })); trackChange(); }}
        isTemplate={meta.is_template}
        onTemplateChange={v => { setMeta(m => ({ ...m, is_template: v })); trackChange(); }}
        onSave={handleSave}
        onPreview={() => setShowPreview(true)}
        onAssign={() => setShowAssign(true)}
        isSaving={saveMutation.isPending}
        canAssign={canAssign}
        lastSaved={lastSaved}
      />

      <div className="flex flex-1" style={{ height: 'calc(100vh - 57px)', overflow: 'hidden' }}>
        {/* ── Left sidebar ── */}
        <div className="w-52 flex-shrink-0 bg-white border-r border-[#E7EAF3] flex flex-col overflow-hidden hidden sm:flex">
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
                            <div {...drag.dragHandleProps}><GripVertical className="w-3 h-3 text-[#D1D5DB]" /></div>
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
            {workouts.length > 0 && (
              <button onClick={() => {
                const week = workouts.map(wk => ({
                  ...wk,
                  day_name: `${wk.day_name} (Wk ${Math.floor(workouts.length / (workouts.length || 1)) + 1})`,
                  exercises: wk.exercises.map(e => ({ ...e })),
                }));
                setWorkouts(w => [...w, ...week]);
                setActiveDay(workouts.length);
                trackChange();
                toast.success('Week duplicated!');
              }}
                className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-purple-200 text-xs text-purple-500 hover:border-purple-400 hover:bg-purple-50/50 transition-colors">
                <Copy className="w-3 h-3" /> Duplicate Week
              </button>
            )}
          </div>

          {/* Program settings */}
          <ProgramSettingsPanel
            meta={meta}
            onMetaChange={m => { setMeta(m); trackChange(); }}
          />
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
              <Button onClick={addWorkout} className="gap-1.5"><Plus className="w-4 h-4" /> Add Training Day</Button>
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

              {/* Column hints */}
              <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-1">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Exercise</span>
                </div>
                <div className="flex gap-4 flex-shrink-0 pr-16">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] w-12 text-center">Sets</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] w-16 text-center">Reps</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] w-14 text-center">Rest</span>
                </div>
              </div>

              {/* Exercise list — sectioned */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId={`ex-${activeDay}`}>
                    {(prov) => (
                      <div ref={prov.innerRef} {...prov.droppableProps} className="space-y-1">
                        {exercisesBySection(currentWorkout.exercises).map(({ section, items }) => (
                          <div key={section}>
                            <SectionDivider
                              section={section}
                              onAddExercise={() => addExercise(activeDay, null, section)}
                            />
                            <QuickAddRow onAdd={name => {
                              const ex = { ...newExercise(section), name };
                              setWorkouts(w => w.map((wk, i) => i !== activeDay ? wk : { ...wk, exercises: [...wk.exercises, ex] }));
                              trackChange();
                            }} />
                            <div className="space-y-1.5 mb-2">
                              {items.map(({ ex, origIdx }, itemIdx) => {
                                // Superset visual grouping
                                const prevEx = itemIdx > 0 ? items[itemIdx - 1].ex : null;
                                const nextEx = itemIdx < items.length - 1 ? items[itemIdx + 1].ex : null;
                                const inGroup = ex.superset_group && ex.superset_group.trim();
                                const isGroupStart = inGroup && (!prevEx || prevEx.superset_group !== ex.superset_group);
                                const isGroupEnd = inGroup && (!nextEx || nextEx.superset_group !== ex.superset_group);
                                const isGroupMiddle = inGroup && !isGroupStart && !isGroupEnd;
                                return (
                                  <div key={`ex-${activeDay}-${origIdx}`} className={cn('relative', inGroup && 'pl-3')}>
                                    {inGroup && (
                                      <>
                                        <div className={cn('absolute left-0 w-1 bg-purple-300 rounded-full',
                                          isGroupStart ? 'top-3 bottom-0' : isGroupEnd ? 'top-0 bottom-3' : 'inset-y-0'
                                        )} />
                                        {isGroupStart && (
                                          <span className="absolute -left-1 top-1.5 text-[8px] font-black text-purple-600 bg-purple-100 rounded px-0.5 z-10">SS</span>
                                        )}
                                      </>
                                    )}
                                    <Draggable draggableId={`ex-${activeDay}-${origIdx}`} index={origIdx}>
                                      {(drag, snap) => (
                                        <ExerciseRow
                                          ex={ex}
                                          wIdx={activeDay}
                                          eIdx={origIdx}
                                          drag={drag}
                                          isDragging={snap.isDragging}
                                          onUpdate={(field, val) => updateExercise(activeDay, origIdx, field, val)}
                                          onRemove={() => removeExercise(activeDay, origIdx)}
                                          onPickLibrary={() => setPickerTarget({ wIdx: activeDay, eIdx: origIdx })}
                                          onWatchDemo={() => {
                                            if (ex.video_url) window.open(ex.video_url, '_blank');
                                            else if (ex._library_exercise) setDemoExercise(ex._library_exercise);
                                          }}
                                        />
                                      )}
                                    </Draggable>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
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
                  <button onClick={() => setPickerTarget({ mode: 'add', section: 'main' })}
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
      <ExerciseLibraryPicker
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

      {/* AI Assist Button */}
      <AIAssistButton
        onSuggestExercises={() => {
          if (currentWorkout) {
            toast.info('AI exercise suggestions coming soon!');
          } else {
            toast.error('Select a training day first');
          }
        }}
        onGenerateProgram={() => toast.info('AI program generation coming soon!')}
        onCheckBalance={() => toast.info('Muscle balance checker coming soon!')}
        onAddProgression={() => toast.info('Progressive overload helper coming soon!')}
      />
    </div>
  );
}