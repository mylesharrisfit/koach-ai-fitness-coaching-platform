import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Copy,
  Check, X, Dumbbell, ArrowLeft, Save, Eye, Users,
  Calendar, Repeat, BarChart2, Clock, Wrench, Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ExerciseDetailModal from '@/components/exercises/ExerciseDetailModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import ExerciseDetailsPanel from '@/components/programs/builder/ExerciseDetailsPanel';

/* ─────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────── */
const SECTION_STYLES = {
  warmup:   { bar: '#F59E0B', label: '🔥 Warm-Up' },
  main:     { bar: '#2563EB', label: '💪 Main Work' },
  finisher: { bar: '#EF4444', label: '⚡ Finisher' },
  cooldown: { bar: '#10B981', label: '🧘 Cooldown' },
};

const SET_TYPE_BADGE = {
  superset: 'bg-purple-100 text-purple-700',
  dropset:  'bg-orange-100 text-orange-700',
  amrap:    'bg-red-100 text-red-700',
  failure:  'bg-rose-100 text-rose-700',
};

const EQUIPMENT_OPTIONS = ['No Equipment','Dumbbells','Barbell','Cables','Machines','Full Gym','Resistance Bands','Kettlebells'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'elite'];
const CATEGORIES = ['strength','hypertrophy','fat_loss','athletic','mobility','custom'];
const SESSION_LENGTHS = ['30','45','60','75','90+'];

const newExercise = (section = 'main') => ({
  name: '', sets: 3, reps: '10', rest_seconds: 60, tempo: '', notes: '', video_url: '',
  set_type: 'straight', rpe: '', rir: '', superset_group: '', dropset_scheme: '',
  stretch_type: 'static', duration_seconds: 30, section,
  progression_type: 'none', progression_value: 5,
});

const newDay = (idx) => ({ day_name: `Day ${idx + 1}`, day_number: idx + 1, exercises: [] });

const defaultMeta = {
  title: '', description: '', duration_weeks: 8, difficulty: 'intermediate',
  category: 'custom', days_per_week: 4, is_template: false,
  equipment: [], tags: [], estimated_session_length: '60',
  progression_model: 'linear', deload_frequency: 'never', rest_day_notes: '',
};

/* ─────────────────────────────────────────────────
   Settings Modal
───────────────────────────────────────────────── */
function SettingsModal({ open, onClose, meta, onMetaChange }) {
  const u = (k, v) => onMetaChange({ ...meta, [k]: v });
  const toggleEquip = (eq) => {
    const list = meta.equipment || [];
    u('equipment', list.includes(eq) ? list.filter(e => e !== eq) : [...list, eq]);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden">
        <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
          <DialogTitle className="text-base font-bold text-[#0E1525]">Program Settings</DialogTitle>
        </div>
        <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Description</label>
            <textarea
              rows={2}
              value={meta.description || ''}
              onChange={e => u('description', e.target.value)}
              placeholder="What's this program about?"
              className="w-full text-sm px-3 py-2 rounded-xl border border-[#E7EAF3] bg-[#F8F9FB] resize-none focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Duration + Sessions per week */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Duration (weeks)</label>
              <div className="flex items-center gap-2">
                <button onClick={() => u('duration_weeks', Math.max(1, Number(meta.duration_weeks) - 1))}
                  className="w-8 h-8 rounded-lg border border-[#E7EAF3] text-[#374151] hover:bg-[#F3F4F6] flex items-center justify-center text-lg">−</button>
                <span className="flex-1 text-center text-sm font-semibold text-[#0E1525]">{meta.duration_weeks}</span>
                <button onClick={() => u('duration_weeks', Number(meta.duration_weeks) + 1)}
                  className="w-8 h-8 rounded-lg border border-[#E7EAF3] text-[#374151] hover:bg-[#F3F4F6] flex items-center justify-center text-lg">+</button>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Sessions / week</label>
              <div className="flex items-center gap-2">
                <button onClick={() => u('days_per_week', Math.max(1, Number(meta.days_per_week) - 1))}
                  className="w-8 h-8 rounded-lg border border-[#E7EAF3] text-[#374151] hover:bg-[#F3F4F6] flex items-center justify-center text-lg">−</button>
                <span className="flex-1 text-center text-sm font-semibold text-[#0E1525]">{meta.days_per_week}</span>
                <button onClick={() => u('days_per_week', Math.min(7, Number(meta.days_per_week) + 1))}
                  className="w-8 h-8 rounded-lg border border-[#E7EAF3] text-[#374151] hover:bg-[#F3F4F6] flex items-center justify-center text-lg">+</button>
              </div>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => u('difficulty', d)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold border-2 capitalize transition-all"
                  style={{
                    borderColor: meta.difficulty === d ? '#2563EB' : '#E7EAF3',
                    background: meta.difficulty === d ? '#EFF6FF' : '#F8F9FB',
                    color: meta.difficulty === d ? '#2563EB' : '#9CA3AF',
                  }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Category + Session length */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Category</label>
              <Select value={meta.category} onValueChange={v => u('category', v)}>
                <SelectTrigger className="h-9 text-sm border-[#E7EAF3] bg-[#F8F9FB]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Session length</label>
              <Select value={meta.estimated_session_length || '60'} onValueChange={v => u('estimated_session_length', v)}>
                <SelectTrigger className="h-9 text-sm border-[#E7EAF3] bg-[#F8F9FB]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SESSION_LENGTHS.map(m => <SelectItem key={m} value={m}>{m} min</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Equipment</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map(eq => (
                <button key={eq} onClick={() => toggleEquip(eq)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={{
                    background: (meta.equipment || []).includes(eq) ? '#2563EB' : '#F8F9FB',
                    color: (meta.equipment || []).includes(eq) ? '#fff' : '#6B7280',
                    borderColor: (meta.equipment || []).includes(eq) ? '#2563EB' : '#E7EAF3',
                  }}>
                  {eq}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Progression Model</label>
              <Select value={meta.progression_model || 'linear'} onValueChange={v => u('progression_model', v)}>
                <SelectTrigger className="h-9 text-sm border-[#E7EAF3] bg-[#F8F9FB]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['linear','undulating','block'].map(m => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Deload Frequency</label>
              <Select value={meta.deload_frequency || 'never'} onValueChange={v => u('deload_frequency', v)}>
                <SelectTrigger className="h-9 text-sm border-[#E7EAF3] bg-[#F8F9FB]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['never','every_4_weeks','every_6_weeks','every_8_weeks'].map(f => (
                    <SelectItem key={f} value={f}>{f.replace(/_/g,' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Template toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => u('is_template', !meta.is_template)}
              className="w-9 h-5 rounded-full transition-colors flex items-center px-0.5"
              style={{ background: meta.is_template ? '#2563EB' : '#D1D5DB' }}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: meta.is_template ? 'translateX(16px)' : 'translateX(0)' }} />
            </div>
            <span className="text-sm text-[#374151] font-medium">Save as template</span>
          </label>
        </div>
        <div className="px-6 py-4 flex justify-end" style={{ borderTop: '1px solid #F3F4F6' }}>
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: '#2563EB' }}>
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────
   Assign Client Modal
───────────────────────────────────────────────── */
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
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #E7EAF3' }}>
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
            <div className="max-h-64 overflow-y-auto divide-y divide-[#F6F7FB] px-2 py-2">
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
            <div className="p-4 flex gap-2" style={{ borderTop: '1px solid #E7EAF3' }}>
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

/* ─────────────────────────────────────────────────
   Exercise Row
───────────────────────────────────────────────── */
function ExerciseRow({ ex, dragProvided, isDragging, isSelected, onClick, onRemove }) {
  const hasGroup = ex.superset_group && ex.superset_group.trim();
  const badgeClass = SET_TYPE_BADGE[ex.set_type] || '';

  return (
    <div
      ref={dragProvided.innerRef}
      {...dragProvided.draggableProps}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all group',
        isSelected ? 'border-[#2563EB] bg-blue-50/50' : isDragging ? 'border-blue-200 bg-white shadow-lg' : 'border-[#EBEDF2] bg-white hover:border-blue-200 hover:bg-[#F8FBFF]'
      )}
      style={{ borderLeftWidth: hasGroup ? 2 : undefined, borderLeftColor: hasGroup ? '#2563EB' : undefined }}
    >
      <div {...dragProvided.dragHandleProps} className="cursor-grab flex-shrink-0 text-[#D1D5DB] hover:text-[#9CA3AF]">
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {ex.set_type && ex.set_type !== 'straight' && badgeClass && (
        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0', badgeClass)}>
          {ex.set_type.slice(0, 3).toUpperCase()}
        </span>
      )}

      <p className="flex-1 text-sm font-medium text-[#0E1525] truncate min-w-0">
        {ex.name || <span className="text-[#C4C9D4] font-normal">Unnamed exercise</span>}
      </p>

      <span className="text-xs font-semibold text-[#374151] tabular-nums flex-shrink-0 bg-[#F3F4F6] px-2 py-0.5 rounded-md">
        {ex.sets}×{ex.reps}
      </span>
      <span className="text-[11px] text-[#9CA3AF] flex-shrink-0 w-10 text-right">
        {ex.rest_seconds}s
      </span>

      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        className="w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-[#D1D5DB] hover:text-red-400 transition-all flex-shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Day Card
───────────────────────────────────────────────── */
function DayCard({ day, globalDayIdx, isActiveDayForEx, selectedExIdx, onSelectExercise, onAddExercise, onRemoveExercise, onRemoveDay, onDuplicateDay }) {
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
    <div className="bg-white rounded-xl overflow-hidden mb-3" style={{ border: '0.5px solid #E2E5EC', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: collapsed ? 'none' : '1px solid #F3F4F6' }}>
        <div {...{}} className="flex items-center gap-3 flex-1 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-[#D1D5DB] cursor-grab flex-shrink-0" />
          <button onClick={() => setCollapsed(v => !v)} className="flex-shrink-0 text-[#9CA3AF] hover:text-[#374151] transition-colors">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0E1525] truncate">{day.day_name}</p>
          </div>
          <span className="text-[11px] text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full flex-shrink-0">
            {exCount} {exCount === 1 ? 'exercise' : 'exercises'}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onDuplicateDay} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#C4C9D4] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={onRemoveDay} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#C4C9D4] hover:text-red-400 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-4 pb-3 pt-3">
          <Droppable droppableId={`ex-${globalDayIdx}`}>
            {(prov) => (
              <div ref={prov.innerRef} {...prov.droppableProps} className="space-y-1">
                {sections.length === 0 ? (
                  <p className="text-xs text-[#C4C9D4] text-center py-3">No exercises yet</p>
                ) : (
                  sections.map(({ section, items }) => {
                    const sStyle = SECTION_STYLES[section] || SECTION_STYLES.main;
                    return (
                      <div key={section} className="mb-2.5">
                        {/* Section label */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-1 h-3 rounded-full flex-shrink-0" style={{ background: sStyle.bar }} />
                          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: sStyle.bar }}>{sStyle.label}</span>
                          <button onClick={() => onAddExercise(section)}
                            className="ml-auto text-[10px] font-semibold hover:opacity-70 transition-opacity"
                            style={{ color: sStyle.bar }}>+ Add</button>
                        </div>

                        {/* Superset grouping */}
                        {(() => {
                          // Group consecutive exercises by superset_group
                          const rows = [];
                          let i = 0;
                          while (i < items.length) {
                            const cur = items[i];
                            const grp = cur.ex.superset_group?.trim();
                            if (grp) {
                              // collect all in this group
                              const groupItems = [cur];
                              let j = i + 1;
                              while (j < items.length && items[j].ex.superset_group?.trim() === grp) {
                                groupItems.push(items[j++]);
                              }
                              rows.push({ type: 'superset', label: `Superset ${grp}`, items: groupItems });
                              i = j;
                            } else {
                              rows.push({ type: 'single', item: cur });
                              i++;
                            }
                          }
                          return rows.map((row, rIdx) => {
                            if (row.type === 'superset') {
                              return (
                                <div key={`ss-${rIdx}`} className="mb-1.5">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-0.5 h-3 rounded-full" style={{ background: '#2563EB' }} />
                                    <span className="text-[10px] font-bold text-[#2563EB]">Superset {row.label.replace('Superset ', '')}</span>
                                  </div>
                                  <div className="pl-3 space-y-1" style={{ borderLeft: '2px solid #2563EB' }}>
                                    {row.items.map(({ ex, origIdx }) => (
                                      <Draggable key={`ex-${globalDayIdx}-${origIdx}`} draggableId={`ex-${globalDayIdx}-${origIdx}`} index={origIdx}>
                                        {(drag, snap) => (
                                          <ExerciseRow ex={ex} dragProvided={drag} isDragging={snap.isDragging}
                                            isSelected={isActiveDayForEx && selectedExIdx === origIdx}
                                            onClick={() => onSelectExercise(origIdx)} onRemove={() => onRemoveExercise(origIdx)} />
                                        )}
                                      </Draggable>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            const { ex, origIdx } = row.item;
                            return (
                              <Draggable key={`ex-${globalDayIdx}-${origIdx}`} draggableId={`ex-${globalDayIdx}-${origIdx}`} index={origIdx}>
                                {(drag, snap) => (
                                  <ExerciseRow ex={ex} dragProvided={drag} isDragging={snap.isDragging}
                                    isSelected={isActiveDayForEx && selectedExIdx === origIdx}
                                    onClick={() => onSelectExercise(origIdx)} onRemove={() => onRemoveExercise(origIdx)} />
                                )}
                              </Draggable>
                            );
                          });
                        })()}
                      </div>
                    );
                  })
                )}
                {prov.placeholder}
              </div>
            )}
          </Droppable>

          {/* Add exercise */}
          <button
            onClick={() => onAddExercise('main')}
            className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ border: '1.5px dashed #BFDBFE', color: '#2563EB', background: 'transparent' }}
          >
            <Plus className="w-3.5 h-3.5" /> Add exercise
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────── */
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
  const [activeWeek, setActiveWeek] = useState(0); // 0-indexed
  const [selectedEx, setSelectedEx] = useState(null); // { dayIdx, exIdx }
  const [showSettings, setShowSettings] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [demoExercise, setDemoExercise] = useState(null);
  const [savedId, setSavedId] = useState(existingProgram?.id || null);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const saveMutation = useMutation({
    mutationFn: (data) => existingProgram || savedId
      ? base44.entities.WorkoutProgram.update(existingProgram?.id || savedId, data)
      : base44.entities.WorkoutProgram.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      if (result?.id) setSavedId(result.id);
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setHasUnsavedChanges(false);
      toast.success(existingProgram || savedId ? 'Program updated!' : 'Program saved!');
    },
  });

  const handleSave = () => {
    if (!meta.title.trim()) { toast.error('Enter a program name'); return; }
    saveMutation.mutate({ ...meta, workouts, duration_weeks: Number(meta.duration_weeks), days_per_week: Number(meta.days_per_week) });
  };

  const trackChange = () => setHasUnsavedChanges(true);

  const dpw = Number(meta.days_per_week) || 4;

  // Group into weeks
  const weeks = [];
  for (let i = 0; i < workouts.length; i += dpw) {
    weeks.push({ weekNum: Math.floor(i / dpw) + 1, days: workouts.slice(i, i + dpw), startIdx: i });
  }

  const safeWeek = Math.min(activeWeek, Math.max(weeks.length - 1, 0));
  const currentWeek = weeks[safeWeek] || null;

  // Operations
  const addWeek = () => {
    const newDays = Array.from({ length: dpw }, (_, i) => newDay(workouts.length + i));
    setWorkouts(w => [...w, ...newDays]);
    setActiveWeek(weeks.length); // new week index
    trackChange();
  };

  const duplicateWeek = (wIdx) => {
    const src = weeks[wIdx];
    if (!src) return;
    const copies = src.days.map(day => ({
      ...day,
      day_name: `${day.day_name} (Wk ${weeks.length + 1})`,
      exercises: day.exercises.map(e => ({ ...e })),
    }));
    setWorkouts(w => [...w, ...copies]);
    setActiveWeek(weeks.length);
    trackChange();
    toast.success(`Week ${src.weekNum} duplicated!`);
  };

  const addDay = () => {
    if (!currentWeek) return;
    const insertAt = currentWeek.startIdx + currentWeek.days.length;
    const next = [...workouts.slice(0, insertAt), newDay(insertAt), ...workouts.slice(insertAt)];
    setWorkouts(next); trackChange();
  };

  const removeDay = (globalIdx) => {
    setWorkouts(w => w.filter((_, i) => i !== globalIdx));
    if (selectedEx?.dayIdx === globalIdx) setSelectedEx(null);
    trackChange();
  };

  const duplicateDay = (globalIdx) => {
    const copy = { ...workouts[globalIdx], exercises: workouts[globalIdx].exercises.map(e => ({ ...e })), day_name: `${workouts[globalIdx].day_name} (Copy)` };
    const next = [...workouts.slice(0, globalIdx + 1), copy, ...workouts.slice(globalIdx + 1)];
    setWorkouts(next); trackChange();
  };

  const addExercise = (dayIdx, section = 'main') => {
    const ex = newExercise(section);
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

  const updateSelectedExercise = (updatedEx) => {
    if (!selectedEx) return;
    setWorkouts(w => w.map((wk, i) => i !== selectedEx.dayIdx ? wk : {
      ...wk, exercises: wk.exercises.map((ex, ei) => ei !== selectedEx.exIdx ? ex : updatedEx)
    }));
    trackChange();
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

  const selectedExData = selectedEx ? workouts[selectedEx.dayIdx]?.exercises?.[selectedEx.exIdx] || null : null;
  const canAssign = !!(savedId || existingProgram?.id);

  const diffColor = { beginner: '#10B981', intermediate: '#2563EB', advanced: '#7C3AED', elite: '#EF4444' };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#F6F7FB' }}>

      {/* ── TOP BAR ── */}
      <div className="bg-white flex-shrink-0" style={{ borderBottom: '0.5px solid #E2E5EC' }}>
        <div className="flex items-start gap-4 px-6 py-4">
          {/* Back */}
          <button onClick={() => navigate('/programs')}
            className="flex items-center gap-1.5 text-[#9CA3AF] hover:text-[#374151] transition-colors mt-1 flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Title + status */}
          <div className="flex-1 min-w-0">
            <Input
              value={meta.title}
              onChange={e => { setMeta(m => ({ ...m, title: e.target.value })); trackChange(); }}
              placeholder="Program name..."
              className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-[#0E1525] font-semibold placeholder:text-[#C4C9D4]"
              style={{ fontSize: 18 }}
            />
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              {hasUnsavedChanges ? 'Draft · unsaved changes' : lastSaved ? `Saved · ${lastSaved}` : 'Draft'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {canAssign && (
              <button onClick={() => setShowAssign(true)}
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#374151] px-3 py-1.5 rounded-lg border border-[#E7EAF3] hover:border-[#D1D5DB] transition-all">
                <Users className="w-3.5 h-3.5" /> Assign
              </button>
            )}
            <button
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#374151] px-3 py-1.5 rounded-lg border border-[#E7EAF3] hover:border-[#D1D5DB] transition-all">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-1.5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#2563EB' }}
            >
              <Save className="w-3.5 h-3.5" />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* ── SETTINGS CHIPS BAR ── */}
        <div className="flex items-center gap-2 px-6 pb-3 overflow-x-auto scrollbar-hide">
          {/* Chips */}
          {[
            { icon: Calendar,  text: `${meta.duration_weeks} weeks` },
            { icon: Repeat,    text: `${meta.days_per_week}× / week` },
            { icon: BarChart2, text: meta.difficulty, color: diffColor[meta.difficulty] },
            { icon: Clock,     text: `${meta.estimated_session_length} min` },
            ...(meta.category && meta.category !== 'custom' ? [{ icon: Wrench, text: meta.category.replace('_', ' ') }] : []),
          ].map((chip, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#6B7280] flex-shrink-0">
              <chip.icon className="w-3 h-3 flex-shrink-0" style={{ color: chip.color || '#9CA3AF' }} />
              <span className="text-xs font-medium capitalize" style={{ color: chip.color || '#374151' }}>{chip.text}</span>
            </div>
          ))}

          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1 text-xs font-semibold flex-shrink-0 ml-1 hover:opacity-80 transition-opacity"
            style={{ color: '#2563EB' }}
          >
            <Settings2 className="w-3.5 h-3.5" /> Edit settings
          </button>
        </div>
      </div>

      {/* ── WEEK SELECTOR ── */}
      <div className="bg-white flex-shrink-0 px-6 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide" style={{ borderBottom: '0.5px solid #E2E5EC' }}>
        {weeks.map((w, i) => (
          <button
            key={i}
            onClick={() => setActiveWeek(i)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
            style={{
              background: safeWeek === i ? '#0E1525' : '#F3F4F6',
              color: safeWeek === i ? '#fff' : '#6B7280',
            }}
          >
            Week {w.weekNum}
            {safeWeek === i && (
              <button
                onClick={e => { e.stopPropagation(); duplicateWeek(i); }}
                className="ml-1 opacity-60 hover:opacity-100"
                title="Duplicate week"
              >
                <Copy className="w-3 h-3" />
              </button>
            )}
          </button>
        ))}
        <button
          onClick={addWeek}
          className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
          style={{ border: '1.5px dashed #BFDBFE', color: '#2563EB', background: 'transparent' }}
        >
          <Plus className="w-3 h-3" /> Week
        </button>
      </div>

      {/* ── MAIN BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto">
          {weeks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 text-center py-24 px-8">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
                <Dumbbell className="w-7 h-7 text-[#3730a3]" />
              </div>
              <div>
                <h2 className="font-bold text-[17px] text-[#0E1525]">Start building</h2>
                <p className="text-sm text-[#9CA3AF] mt-1">Add your first week to get started</p>
              </div>
              <button onClick={addWeek}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#2563EB' }}>
                <Plus className="w-4 h-4" /> Add Week 1
              </button>
            </div>
          ) : currentWeek ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="px-6 py-5 max-w-2xl">
                {currentWeek.days.map((day, i) => {
                  const gIdx = currentWeek.startIdx + i;
                  return (
                    <DayCard
                      key={`day-${gIdx}`}
                      day={day}
                      globalDayIdx={gIdx}
                      isActiveDayForEx={selectedEx?.dayIdx === gIdx}
                      selectedExIdx={selectedEx?.exIdx}
                      onSelectExercise={(exIdx) => setSelectedEx({ dayIdx: gIdx, exIdx })}
                      onAddExercise={(section) => addExercise(gIdx, section)}
                      onRemoveExercise={(exIdx) => removeExercise(gIdx, exIdx)}
                      onRemoveDay={() => removeDay(gIdx)}
                      onDuplicateDay={() => duplicateDay(gIdx)}
                    />
                  );
                })}

                {/* Add day */}
                <button
                  onClick={addDay}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all mb-10"
                  style={{ border: '1.5px dashed #BFDBFE', color: '#2563EB', background: 'transparent' }}
                >
                  <Plus className="w-4 h-4" /> Add training day
                </button>
              </div>
            </DragDropContext>
          ) : null}
        </div>

        {/* ── RIGHT: Exercise detail panel ── */}
        {selectedExData && (
          <div className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0 overflow-hidden" style={{ borderLeft: '0.5px solid #E2E5EC' }}>
            <ExerciseDetailsPanel
              exercise={selectedExData}
              onChange={updateSelectedExercise}
              onClose={() => setSelectedEx(null)}
            />
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        meta={meta}
        onMetaChange={m => { setMeta(m); trackChange(); }}
      />
      <AssignClientModal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        programId={savedId || existingProgram?.id}
        programTitle={meta.title}
      />
      <ExerciseDetailModal
        exercise={demoExercise}
        open={!!demoExercise}
        onClose={() => setDemoExercise(null)}
        onEdit={() => {}}
      />
    </div>
  );
}