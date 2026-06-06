import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Copy, Check, X, Dumbbell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ExerciseDetailModal from '@/components/exercises/ExerciseDetailModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import ProgramBuilderHeader from '@/components/programs/builder/ProgramBuilderHeader';
import ProgramSettingsPanel from '@/components/programs/builder/ProgramSettingsPanel';
import AIAssistButton from '@/components/programs/builder/AIAssistButton';
import ExerciseLibraryPanel from '@/components/programs/builder/ExerciseLibraryPanel';
import ExerciseDetailsPanel from '@/components/programs/builder/ExerciseDetailsPanel';

/* ── constants ── */
const SET_TYPE_COLORS = {
  superset: { bar: '#A78BFA', badge: 'bg-purple-100 text-purple-700' },
  dropset:  { bar: '#FB923C', badge: 'bg-orange-100 text-orange-700' },
  amrap:    { bar: '#F87171', badge: 'bg-red-100 text-red-700' },
  failure:  { bar: '#FB7185', badge: 'bg-rose-100 text-rose-700' },
  straight: { bar: 'transparent', badge: '' },
};

const SECTION_STYLES = {
  warmup:   { bar: '#FBC85B', label: '🔥 Warm-Up',   bg: '#FFFBEB', border: '#FDE68A' },
  main:     { bar: '#2563EB', label: '💪 Main Work',  bg: '#EFF6FF', border: '#BFDBFE' },
  finisher: { bar: '#EF4444', label: '⚡ Finisher',  bg: '#FEF2F2', border: '#FECACA' },
  cooldown: { bar: '#34D399', label: '🧘 Cooldown',   bg: '#ECFDF5', border: '#A7F3D0' },
};

const newExercise = (section = 'main') => ({
  name: '', sets: 3, reps: '10', rest_seconds: 60, tempo: '', notes: '', video_url: '',
  set_type: 'straight', rpe: '', rir: '', superset_group: '', dropset_scheme: '',
  stretch_type: 'static', duration_seconds: 30, section,
  progression_type: 'none', progression_value: 5,
});

const newDay = (idx) => ({
  day_name: `Day ${idx + 1}`, day_number: idx + 1, exercises: [],
});

const defaultMeta = {
  title: '', description: '', duration_weeks: 8, difficulty: 'intermediate',
  category: 'custom', days_per_week: 4, is_template: false,
  equipment: [], tags: [], estimated_session_length: '60',
  progression_model: 'linear', deload_frequency: 'never', rest_day_notes: '',
};

/* ── Assign Client Modal ── */
function AssignClientModal({ open, onClose, programId, programTitle }) {
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const queryClient = useQueryClient();
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'], queryFn: () => base44.entities.Client.list(), enabled: open,
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
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
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

/* ── Exercise Row ── */
function ExerciseRow({ ex, dragProvided, isDragging, isSelected, onClick, onRemove }) {
  const setTypeInfo = SET_TYPE_COLORS[ex.set_type] || SET_TYPE_COLORS.straight;
  const hasGroup = ex.superset_group && ex.superset_group.trim();

  return (
    <div
      ref={dragProvided.innerRef}
      {...dragProvided.draggableProps}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all group',
        isSelected
          ? 'border-blue-300 bg-blue-50/60 shadow-sm'
          : isDragging
          ? 'border-blue-200 bg-white shadow-lg'
          : 'border-[#E7EAF3] bg-white hover:border-blue-200 hover:bg-blue-50/20'
      )}
      style={{
        borderLeftWidth: 3,
        borderLeftColor: hasGroup
          ? '#A78BFA'
          : setTypeInfo.bar !== 'transparent'
          ? setTypeInfo.bar
          : '#E7EAF3',
      }}
    >
      {/* Superset bracket label */}
      {hasGroup && (
        <span className="absolute -left-0.5 top-0.5 text-[8px] font-black text-purple-600 bg-purple-100 rounded px-0.5 z-10 leading-tight">
          SS
        </span>
      )}

      {/* Drag handle */}
      <div {...dragProvided.dragHandleProps} className="cursor-grab flex-shrink-0">
        <GripVertical className="w-3.5 h-3.5 text-[#D1D5DB]" />
      </div>

      {/* Set type badge */}
      {ex.set_type && ex.set_type !== 'straight' && (
        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0', setTypeInfo.badge)}>
          {ex.set_type.substring(0, 3).toUpperCase()}
        </span>
      )}

      {/* Name */}
      <p className="flex-1 text-sm font-medium text-[#1F2A44] truncate min-w-0">
        {ex.name || <span className="text-[#C4C9D4]">Unnamed exercise</span>}
      </p>

      {/* Compact stats */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-[#6B7280] font-medium tabular-nums">{ex.sets}×{ex.reps}</span>
        <span className="text-[10px] text-[#9CA3AF]">{ex.rest_seconds}s</span>
      </div>

      {/* Remove */}
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        className="w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-[#D1D5DB] hover:text-red-500 transition-all flex-shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ── Section Block ── */
function SectionBlock({ section, items, dayIdx, onAddExercise }) {
  const style = SECTION_STYLES[section] || SECTION_STYLES.main;
  return (
    <div className="mb-4">
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg mb-2"
        style={{ background: style.bg, border: `1px solid ${style.border}` }}
      >
        <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: style.bar }} />
        <span className="text-xs font-bold" style={{ color: style.bar }}>{style.label}</span>
        <button
          onClick={() => onAddExercise(section)}
          className="ml-auto flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md transition-opacity hover:opacity-70"
          style={{ color: style.bar }}
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      {/* Exercise items rendered by parent via DnD */}
    </div>
  );
}

/* ── Day Card (collapsible, inside a week) ── */
function DayCard({ day, dayIdx, globalDayIdx, isSelected, selectedExIdx, onSelectExercise, onAddExercise, onRemoveExercise, onUpdateExercise, onRemoveDay, onDuplicateDay }) {
  const [collapsed, setCollapsed] = useState(false);

  const exercisesBySection = () => {
    const order = ['warmup', 'main', 'finisher', 'cooldown'];
    const grouped = {};
    order.forEach(s => { grouped[s] = []; });
    (day.exercises || []).forEach((ex, origIdx) => {
      const sec = ex.section || 'main';
      if (!grouped[sec]) grouped[sec] = [];
      grouped[sec].push({ ex, origIdx });
    });
    return order.filter(s => grouped[s].length > 0).map(s => ({ section: s, items: grouped[s] }));
  };

  const sections = exercisesBySection();
  const exCount = (day.exercises || []).filter(e => e.name).length;

  return (
    <div
      className="bg-white rounded-xl overflow-hidden mb-3"
      style={{ border: '1px solid #E7EAF3', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      {/* Day header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: collapsed ? 'none' : '1px solid #F3F4F6' }}>
        <button onClick={() => setCollapsed(v => !v)} className="text-[#9CA3AF] hover:text-[#374151] transition-colors flex-shrink-0">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2FF' }}>
          <Dumbbell className="w-3.5 h-3.5" style={{ color: '#3730a3' }} />
        </div>
        <span className="text-sm font-bold text-[#0E1525] flex-1">{day.day_name}</span>
        <span className="text-[10px] text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full mr-2">{exCount} exercises</span>
        <button onClick={onDuplicateDay} className="text-[#9CA3AF] hover:text-[#374151] p-1 rounded-lg hover:bg-[#F3F4F6] transition-colors" title="Duplicate day">
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button onClick={onRemoveDay} className="text-[#D1D5DB] hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors" title="Remove day">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 py-3">
          <Droppable droppableId={`ex-${globalDayIdx}`}>
            {(prov) => (
              <div ref={prov.innerRef} {...prov.droppableProps}>
                {/* Render sections with exercises */}
                {sections.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-[#C4C9D4] mb-2">No exercises yet</p>
                    <button
                      onClick={() => onAddExercise('main')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ color: '#2563EB', border: '1px dashed #93C5FD', background: '#EFF6FF' }}
                    >
                      + Add Exercise
                    </button>
                  </div>
                ) : (
                  sections.map(({ section, items }) => {
                    const sStyle = SECTION_STYLES[section] || SECTION_STYLES.main;
                    return (
                      <div key={section} className="mb-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-1 h-3.5 rounded-full" style={{ background: sStyle.bar }} />
                          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: sStyle.bar }}>
                            {sStyle.label}
                          </span>
                          <button
                            onClick={() => onAddExercise(section)}
                            className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-md transition-opacity hover:opacity-70"
                            style={{ color: sStyle.bar }}
                          >
                            + Add
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {items.map(({ ex, origIdx }, itemIdx) => {
                            const prevEx = itemIdx > 0 ? items[itemIdx - 1].ex : null;
                            const nextEx = itemIdx < items.length - 1 ? items[itemIdx + 1].ex : null;
                            const inGroup = ex.superset_group && ex.superset_group.trim();
                            const isGroupStart = inGroup && (!prevEx || prevEx.superset_group !== ex.superset_group);
                            const isGroupEnd = inGroup && (!nextEx || nextEx.superset_group !== ex.superset_group);

                            return (
                              <div key={`ex-${globalDayIdx}-${origIdx}`} className={cn('relative', inGroup && 'pl-3')}>
                                {inGroup && (
                                  <div className={cn('absolute left-0 w-0.5 rounded-full bg-purple-300',
                                    isGroupStart ? 'top-3 bottom-0' : isGroupEnd ? 'top-0 bottom-3' : 'inset-y-0'
                                  )} />
                                )}
                                <Draggable draggableId={`ex-${globalDayIdx}-${origIdx}`} index={origIdx}>
                                  {(drag, snap) => (
                                    <ExerciseRow
                                      ex={ex}
                                      dragProvided={drag}
                                      isDragging={snap.isDragging}
                                      isSelected={isSelected && selectedExIdx === origIdx}
                                      onClick={() => onSelectExercise(origIdx)}
                                      onRemove={() => onRemoveExercise(origIdx)}
                                    />
                                  )}
                                </Draggable>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
                {prov.placeholder}
              </div>
            )}
          </Droppable>

          {/* Add exercise button */}
          <button
            onClick={() => onAddExercise('main')}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ border: '1px dashed #93C5FD', color: '#2563EB', background: 'transparent' }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Exercise
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Week Card ── */
function WeekCard({ weekNum, days, globalStartIdx, selectedDayIdx, selectedExIdx, onAddDay, onDuplicateWeek, onUpdateDay, onRemoveDay, onDuplicateDay, onAddExercise, onRemoveExercise, onUpdateExercise, onSelectExercise }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-5">
      {/* Week header */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2"
        style={{ background: '#0E1525' }}
      >
        <button onClick={() => setCollapsed(v => !v)} className="text-white/50 hover:text-white transition-colors">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <span className="text-white font-bold text-sm flex-1">Week {weekNum}</span>
        <span className="text-white/40 text-xs">{days.length} day{days.length !== 1 ? 's' : ''}</span>
        <button
          onClick={onDuplicateWeek}
          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
          style={{ color: '#85B7EB', border: '0.5px solid rgba(133,183,235,0.3)', background: 'rgba(55,138,221,0.1)' }}
        >
          <Copy className="w-3 h-3" /> Duplicate week
        </button>
      </div>

      {!collapsed && (
        <div className="pl-2">
          {days.map((day, i) => (
            <DayCard
              key={`day-${globalStartIdx + i}`}
              day={day}
              dayIdx={i}
              globalDayIdx={globalStartIdx + i}
              isSelected={selectedDayIdx === globalStartIdx + i}
              selectedExIdx={selectedExIdx}
              onSelectExercise={(exIdx) => onSelectExercise(globalStartIdx + i, exIdx)}
              onAddExercise={(section) => onAddExercise(globalStartIdx + i, section)}
              onRemoveExercise={(exIdx) => onRemoveExercise(globalStartIdx + i, exIdx)}
              onUpdateExercise={(exIdx, field, val) => onUpdateExercise(globalStartIdx + i, exIdx, field, val)}
              onRemoveDay={() => onRemoveDay(globalStartIdx + i)}
              onDuplicateDay={() => onDuplicateDay(globalStartIdx + i)}
            />
          ))}
          <button
            onClick={() => onAddDay(weekNum - 1)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold mb-2 transition-all"
            style={{ border: '1px dashed #93C5FD', color: '#2563EB', background: 'transparent' }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Day to Week {weekNum}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
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

  // workouts is a flat array of days; we group them into weeks for display
  const [workouts, setWorkouts] = useState(existingProgram?.workouts || []);
  const [daysPerWeek] = useState(meta.days_per_week || 4);

  // Selected exercise: { dayIdx, exIdx }
  const [selectedEx, setSelectedEx] = useState(null);

  const [demoExercise, setDemoExercise] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [savedId, setSavedId] = useState(existingProgram?.id || null);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
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
      setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setHasUnsavedChanges(false);
      toast.success(existingProgram || savedId ? 'Program updated!' : 'Program saved!');
    },
  });

  const handleSave = () => {
    if (!meta.title.trim()) { toast.error('Enter a program name'); return; }
    saveMutation.mutate({ ...meta, workouts, duration_weeks: Number(meta.duration_weeks), days_per_week: Number(meta.days_per_week) });
  };

  const trackChange = () => setHasUnsavedChanges(true);

  // Group flat workouts into weeks based on days_per_week
  const dpw = Number(meta.days_per_week) || 4;
  const weeks = [];
  for (let i = 0; i < workouts.length; i += dpw) {
    weeks.push({ weekNum: Math.floor(i / dpw) + 1, days: workouts.slice(i, i + dpw), startIdx: i });
  }

  // Day / exercise operations
  const addDay = (weekIdx) => {
    const insertAfter = (weekIdx + 1) * dpw;
    const next = [...workouts.slice(0, insertAfter), newDay(insertAfter), ...workouts.slice(insertAfter)];
    setWorkouts(next); trackChange();
  };

  const removeDay = (idx) => {
    setWorkouts(w => w.filter((_, i) => i !== idx));
    if (selectedEx?.dayIdx === idx) setSelectedEx(null);
    trackChange();
  };

  const duplicateDay = (idx) => {
    const copy = { ...workouts[idx], exercises: workouts[idx].exercises.map(e => ({ ...e })), day_name: `${workouts[idx].day_name} (Copy)` };
    const next = [...workouts.slice(0, idx + 1), copy, ...workouts.slice(idx + 1)];
    setWorkouts(next); trackChange();
  };

  const addWeek = () => {
    const newDays = Array.from({ length: dpw }, (_, i) => newDay(workouts.length + i));
    setWorkouts(w => [...w, ...newDays]); trackChange();
  };

  const duplicateWeek = (weekIdx) => {
    const src = weeks[weekIdx];
    if (!src) return;
    const copies = src.days.map((day, i) => ({
      ...day,
      day_name: `${day.day_name} (Wk ${weeks.length + 1})`,
      exercises: day.exercises.map(e => ({ ...e })),
    }));
    setWorkouts(w => [...w, ...copies]);
    trackChange();
    toast.success(`Week ${src.weekNum} duplicated!`);
  };

  const addExercise = (dayIdx, section = 'main', libraryEx = null) => {
    const ex = libraryEx
      ? { ...newExercise(section), name: libraryEx.name, rest_seconds: libraryEx.default_rest_seconds || 60, _library_id: libraryEx.id, _library_exercise: libraryEx, video_url: libraryEx.video_url || '' }
      : newExercise(section);
    setWorkouts(w => w.map((wk, i) => i !== dayIdx ? wk : { ...wk, exercises: [...wk.exercises, ex] }));
    const newExIdx = (workouts[dayIdx]?.exercises || []).length;
    setSelectedEx({ dayIdx, exIdx: newExIdx });
    trackChange();
  };

  const removeExercise = (dayIdx, exIdx) => {
    setWorkouts(w => w.map((wk, i) => i !== dayIdx ? wk : { ...wk, exercises: wk.exercises.filter((_, ei) => ei !== exIdx) }));
    if (selectedEx?.dayIdx === dayIdx && selectedEx?.exIdx === exIdx) setSelectedEx(null);
    trackChange();
  };

  const updateExercise = (dayIdx, exIdx, field, value) => {
    setWorkouts(w => w.map((wk, i) => i !== dayIdx ? wk : {
      ...wk, exercises: wk.exercises.map((ex, ei) => ei !== exIdx ? ex : { ...ex, [field]: value })
    }));
    trackChange();
  };

  const updateSelectedExercise = (updatedEx) => {
    if (!selectedEx) return;
    setWorkouts(w => w.map((wk, i) => i !== selectedEx.dayIdx ? wk : {
      ...wk, exercises: wk.exercises.map((ex, ei) => ei !== selectedEx.exIdx ? ex : updatedEx)
    }));
    trackChange();
  };

  // From library panel — adds to first (or last active) day
  const handleLibraryAdd = (libraryEx) => {
    if (workouts.length === 0) {
      const day = newDay(0);
      day.exercises = [{ ...newExercise('main'), name: libraryEx.name, rest_seconds: libraryEx.default_rest_seconds || 60, video_url: libraryEx.video_url || '' }];
      setWorkouts([day]);
      setSelectedEx({ dayIdx: 0, exIdx: 0 });
    } else {
      const lastDayIdx = workouts.length - 1;
      addExercise(lastDayIdx, 'main', libraryEx);
    }
    toast.success(`"${libraryEx.name}" added`);
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    const dayIdx = parseInt(source.droppableId.replace('ex-', ''));
    const exs = [...workouts[dayIdx].exercises];
    const [moved] = exs.splice(source.index, 1);
    exs.splice(destination.index, 0, moved);
    setWorkouts(w => w.map((wk, i) => i !== dayIdx ? wk : { ...wk, exercises: exs }));
    trackChange();
  };

  const selectedExData = selectedEx
    ? workouts[selectedEx.dayIdx]?.exercises?.[selectedEx.exIdx] || null
    : null;

  const canAssign = !!(savedId || existingProgram?.id);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#F6F7FB' }}>
      {/* Top nav header */}
      <ProgramBuilderHeader
        title={meta.title}
        onTitleChange={t => { setMeta(m => ({ ...m, title: t })); trackChange(); }}
        isTemplate={meta.is_template}
        onTemplateChange={v => { setMeta(m => ({ ...m, is_template: v })); trackChange(); }}
        onSave={handleSave}
        onPreview={() => {}}
        onAssign={() => setShowAssign(true)}
        isSaving={saveMutation.isPending}
        canAssign={canAssign}
        lastSaved={lastSaved}
      />

      {/* Three-column layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Exercise library ── */}
        <div className="hidden lg:flex flex-col w-56 xl:w-64 flex-shrink-0 overflow-hidden">
          <ExerciseLibraryPanel onAddExercise={handleLibraryAdd} />
        </div>

        {/* ── CENTER: Program canvas ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Settings sidebar (compact, scrollable) */}
          <div className="hidden xl:flex flex-col w-52 flex-shrink-0 bg-white overflow-hidden" style={{ borderRight: '1px solid #E7EAF3' }}>
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Program Settings</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ProgramSettingsPanel meta={meta} onMetaChange={m => { setMeta(m); trackChange(); }} />
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-y-auto px-5 xl:px-8 py-6">
            {workouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-5 text-center py-20">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#EEF2FF' }}>
                  <Dumbbell className="w-8 h-8" style={{ color: '#3730a3' }} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-[#0E1525]">Start building</h2>
                  <p className="text-sm text-[#6B7280] mt-1">Add your first week to begin</p>
                </div>
                <button
                  onClick={addWeek}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                  style={{ background: '#2563EB' }}
                >
                  <Plus className="w-4 h-4" /> Add Week 1
                </button>
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                {weeks.map((week, wIdx) => (
                  <WeekCard
                    key={`week-${wIdx}`}
                    weekNum={week.weekNum}
                    days={week.days}
                    globalStartIdx={week.startIdx}
                    selectedDayIdx={selectedEx?.dayIdx}
                    selectedExIdx={selectedEx?.exIdx}
                    onAddDay={addDay}
                    onDuplicateWeek={() => duplicateWeek(wIdx)}
                    onUpdateDay={() => {}}
                    onRemoveDay={removeDay}
                    onDuplicateDay={duplicateDay}
                    onAddExercise={addExercise}
                    onRemoveExercise={removeExercise}
                    onUpdateExercise={updateExercise}
                    onSelectExercise={(dayIdx, exIdx) => setSelectedEx({ dayIdx, exIdx })}
                  />
                ))}

                {/* Add week */}
                <button
                  onClick={addWeek}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all mb-10"
                  style={{ border: '1px dashed #93C5FD', color: '#2563EB', background: 'transparent' }}
                >
                  <Plus className="w-4 h-4" /> Add Week {weeks.length + 1}
                </button>
              </DragDropContext>
            )}
          </div>
        </div>

        {/* ── RIGHT: Exercise details panel ── */}
        <div className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 overflow-hidden">
          <ExerciseDetailsPanel
            exercise={selectedExData}
            onChange={updateSelectedExercise}
            onClose={() => setSelectedEx(null)}
          />
        </div>
      </div>

      {/* Modals */}
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
      <AIAssistButton
        onSuggestExercises={() => toast.info('AI exercise suggestions coming soon!')}
        onGenerateProgram={() => toast.info('AI program generation coming soon!')}
        onCheckBalance={() => toast.info('Muscle balance checker coming soon!')}
        onAddProgression={() => toast.info('Progressive overload helper coming soon!')}
      />
    </div>
  );
}