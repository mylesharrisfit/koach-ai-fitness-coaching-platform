import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Plus, Dumbbell, Lock, Zap, Search, SlidersHorizontal,
  LayoutGrid, List, ChevronDown, X, Flame, Layers, Target,
} from 'lucide-react';
import { hasFeature, getLimit } from '@/lib/subscription';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ProgramCard from '../components/programs/ProgramCard';
import ProgramListRow from '../components/programs/ProgramListRow';
import ProgramDetailModal from '../components/programs/ProgramDetailModal';
import ProgramCreationModal from '../components/programs/ProgramCreationModal';
import ProgramAssignmentModal from '../components/programs/ProgramAssignmentModal';
import IntelligenceBar from '@/components/intelligence/IntelligenceBar';
import LimitBanner from '@/components/subscription/LimitBanner';
import { useUpgradeModal } from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';

/* ── Filter options ── */
const DIFFICULTIES  = ['beginner', 'intermediate', 'advanced', 'elite'];
const CATEGORIES    = ['strength', 'hypertrophy', 'fat_loss', 'athletic', 'mobility', 'custom'];
const DURATIONS     = [{ value: '1-4', label: '1–4 weeks' }, { value: '5-8', label: '5–8 weeks' }, { value: '9-12', label: '9–12 weeks' }, { value: '12+', label: '12+ weeks' }];
const FREQUENCIES   = [{ value: '2-3', label: '2–3×/week' }, { value: '4-5', label: '4–5×/week' }, { value: '6', label: '6×/week' }];
const SESSION_LENS  = [{ value: '0-30', label: '< 30 min' }, { value: '30-45', label: '30–45 min' }, { value: '45-60', label: '45–60 min' }, { value: '60+', label: '60+ min' }];
const STATUSES      = [{ value: 'active', label: 'Assigned' }, { value: 'unassigned', label: 'Unassigned' }, { value: 'archived', label: 'Archived' }];
const SORTS         = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'alphabetical-az', label: 'A → Z' },
  { value: 'alphabetical-za', label: 'Z → A' },
  { value: 'duration-short', label: 'Shortest' },
  { value: 'duration-long', label: 'Longest' },
  { value: 'most-assigned', label: 'Most assigned' },
];

const CAT_LABELS = { strength: 'Strength', hypertrophy: 'Hypertrophy', fat_loss: 'Fat Loss', athletic: 'Athletic', mobility: 'Mobility', custom: 'Custom' };

function estSessionMins(program) {
  if (!program.workouts?.length) return null;
  const avgEx = program.workouts.reduce((s, w) => s + (w.exercises?.length || 0), 0) / program.workouts.length;
  return Math.round(avgEx * 5 + (program.workouts[0]?.exercises?.reduce((s, e) => s + (e.sets || 3) * ((e.rest_seconds || 60) / 60 + 1), 0) || 30));
}

/* ── Filter popover content ── */
function FiltersPanel({ filters, onChange }) {
  const { difficulty, categories, duration, frequency, sessionLength, status } = filters;

  const toggle = (key, val, multi = false) => {
    if (multi) {
      const arr = filters[key] || [];
      onChange({ [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] });
    } else {
      onChange({ [key]: filters[key] === val ? 'all' : val });
    }
  };

  const Section = ({ label, children }) => (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );

  const Chip = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors"
      style={{
        background: active ? '#2563EB' : '#F3F4F6',
        color: active ? '#fff' : '#6B7280',
        border: active ? '1px solid #2563EB' : '0.5px solid #E2E5EC',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4 p-4 w-72">
      <Section label="Difficulty">
        {DIFFICULTIES.map(d => (
          <Chip key={d} label={d.charAt(0).toUpperCase() + d.slice(1)} active={difficulty === d} onClick={() => toggle('difficulty', d)} />
        ))}
      </Section>
      <Section label="Category">
        {CATEGORIES.map(c => (
          <Chip key={c} label={CAT_LABELS[c]} active={(categories || []).includes(c)} onClick={() => toggle('categories', c, true)} />
        ))}
      </Section>
      <Section label="Duration">
        {DURATIONS.map(d => (
          <Chip key={d.value} label={d.label} active={duration === d.value} onClick={() => toggle('duration', d.value)} />
        ))}
      </Section>
      <Section label="Frequency">
        {FREQUENCIES.map(f => (
          <Chip key={f.value} label={f.label} active={frequency === f.value} onClick={() => toggle('frequency', f.value)} />
        ))}
      </Section>
      <Section label="Session Length">
        {SESSION_LENS.map(s => (
          <Chip key={s.value} label={s.label} active={sessionLength === s.value} onClick={() => toggle('sessionLength', s.value)} />
        ))}
      </Section>
      <Section label="Status">
        {STATUSES.map(s => (
          <Chip key={s.value} label={s.label} active={status === s.value} onClick={() => toggle('status', s.value)} />
        ))}
      </Section>
    </div>
  );
}

/* ── Main Page ── */
export default function Programs() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assigningProgram, setAssigningProgram]   = useState(null);
  const [previewingProgram, setPreviewingProgram] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [difficulty, setDifficulty]     = useState('all');
  const [categories, setCategories]     = useState([]);
  const [duration, setDuration]         = useState('all');
  const [frequency, setFrequency]       = useState('all');
  const [sessionLength, setSessionLength] = useState('all');
  const [status, setStatus]             = useState('all');
  const [sort, setSort]                 = useState('newest');
  const [layout, setLayout]             = useState('grid');
  const [filterOpen, setFilterOpen]     = useState(false);

  const queryClient = useQueryClient();
  const { openUpgradeModal } = useUpgradeModal();
  const navigate = useNavigate();

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  const canUseTemplates = hasFeature(currentUser, 'program_templates');

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.WorkoutProgram.list('-created_date'),
  });
  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });
  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkins-prog'],
    queryFn: () => base44.entities.CheckIn.list('-date', 200),
  });

  const programLimit = getLimit(currentUser, 'max_programs');
  const atLimit = programLimit !== -1 && programs.length >= programLimit;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutProgram.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkoutProgram.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['programs'] }); toast.success('Program deleted'); },
  });
  const archiveMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkoutProgram.update(id, { is_archived: true }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['programs'] }); toast.success('Program archived'); },
  });

  const duplicateProgram = (program) => {
    const { id, created_date, updated_date, created_by, ...rest } = program;
    createMutation.mutate({ ...rest, title: `${rest.title} (Copy)` });
    toast.success('Program duplicated');
  };

  const openBuilder = (program = null) => navigate('/program-builder', { state: { program } });

  const getClientsForProgram = (programId) => {
    const assigned = allClients.filter(c => c.assigned_program_id === programId);
    const inProgress = assigned.filter(c => allCheckIns.some(ci => ci.client_id === c.id));
    return { assigned, inProgress };
  };

  // Active filter count
  const activeFilterCount = [
    difficulty !== 'all',
    categories.length > 0,
    duration !== 'all',
    frequency !== 'all',
    sessionLength !== 'all',
    status !== 'all',
  ].filter(Boolean).length;

  // Active filter chips for display
  const activeChips = [
    ...(difficulty !== 'all' ? [{ key: 'difficulty', label: difficulty.charAt(0).toUpperCase() + difficulty.slice(1), onRemove: () => setDifficulty('all') }] : []),
    ...categories.map(c => ({ key: `cat-${c}`, label: CAT_LABELS[c], onRemove: () => setCategories(cs => cs.filter(x => x !== c)) })),
    ...(duration !== 'all'      ? [{ key: 'duration',      label: DURATIONS.find(d => d.value === duration)?.label,            onRemove: () => setDuration('all') }] : []),
    ...(frequency !== 'all'     ? [{ key: 'frequency',     label: FREQUENCIES.find(f => f.value === frequency)?.label,          onRemove: () => setFrequency('all') }] : []),
    ...(sessionLength !== 'all' ? [{ key: 'sessionLength', label: SESSION_LENS.find(s => s.value === sessionLength)?.label,     onRemove: () => setSessionLength('all') }] : []),
    ...(status !== 'all'        ? [{ key: 'status',        label: STATUSES.find(s => s.value === status)?.label,               onRemove: () => setStatus('all') }] : []),
  ];

  const clearAll = () => {
    setSearchQuery(''); setDifficulty('all'); setCategories([]); setDuration('all');
    setFrequency('all'); setSessionLength('all'); setStatus('all');
  };

  const filteredPrograms = useMemo(() => {
    let f = [...programs];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(p => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    if (difficulty !== 'all') f = f.filter(p => p.difficulty === difficulty);
    if (categories.length > 0) f = f.filter(p => categories.includes(p.category));
    if (duration !== 'all') f = f.filter(p => {
      const w = p.duration_weeks || 0;
      if (duration === '1-4') return w >= 1 && w <= 4;
      if (duration === '5-8') return w >= 5 && w <= 8;
      if (duration === '9-12') return w >= 9 && w <= 12;
      if (duration === '12+') return w > 12;
      return true;
    });
    if (frequency !== 'all') f = f.filter(p => {
      const d = p.days_per_week || 0;
      if (frequency === '2-3') return d >= 2 && d <= 3;
      if (frequency === '4-5') return d >= 4 && d <= 5;
      if (frequency === '6') return d === 6;
      return true;
    });
    if (sessionLength !== 'all') f = f.filter(p => {
      const m = estSessionMins(p) || 0;
      if (sessionLength === '0-30') return m < 30;
      if (sessionLength === '30-45') return m >= 30 && m <= 45;
      if (sessionLength === '45-60') return m > 45 && m <= 60;
      if (sessionLength === '60+') return m > 60;
      return true;
    });
    if (status !== 'all') f = f.filter(p => {
      const a = getClientsForProgram(p.id).assigned.length;
      if (status === 'active') return a > 0;
      if (status === 'unassigned') return a === 0;
      if (status === 'archived') return p.is_archived;
      return true;
    });
    f.sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_date) - new Date(a.created_date);
      if (sort === 'oldest') return new Date(a.created_date) - new Date(b.created_date);
      if (sort === 'alphabetical-az') return a.title.localeCompare(b.title);
      if (sort === 'alphabetical-za') return b.title.localeCompare(a.title);
      if (sort === 'duration-short') return (a.duration_weeks || 0) - (b.duration_weeks || 0);
      if (sort === 'duration-long') return (b.duration_weeks || 0) - (a.duration_weeks || 0);
      if (sort === 'most-assigned') return getClientsForProgram(b.id).assigned.length - getClientsForProgram(a.id).assigned.length;
      return 0;
    });
    return f;
  }, [programs, searchQuery, difficulty, categories, duration, frequency, sessionLength, status, sort, allClients, allCheckIns]);

  const assignedClientCount = allClients.filter(c => c.assigned_program_id).length;

  return (
    <div className="min-h-screen" style={{ background: '#F6F7FB' }}>

      {/* ── NAVY HEADER ── */}
      <div className="px-6 py-5 flex items-center justify-between" style={{ background: '#0E1525' }}>
        <div>
          <h1 className="text-lg font-bold text-white">Programs</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {programs.length} program{programs.length !== 1 ? 's' : ''} · {assignedClientCount} client{assignedClientCount !== 1 ? 's' : ''} assigned
          </p>
        </div>
        <button
          onClick={() => { if (atLimit) { openUpgradeModal('clients'); return; } openBuilder(); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-[#0E1525] bg-white transition-opacity hover:opacity-90"
        >
          {atLimit ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {atLimit ? `Limit (${programs.length}/${programLimit})` : 'New program'}
        </button>
      </div>

      <div className="px-6 py-5 space-y-5 max-w-7xl mx-auto">

        <LimitBanner limitKey="max_programs" currentCount={programs.length} label="programs" featureKey="clients" />

        {/* ── ONE-ROW TOOLBAR ── */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search programs..."
              className="w-full h-9 pl-8 pr-3 text-sm rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#374151] placeholder:text-[#C4C9D4]"
              style={{ border: '0.5px solid #E2E5EC' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C4C9D4] hover:text-[#374151]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters button */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium transition-colors relative"
                style={{
                  background: activeFilterCount > 0 ? '#EFF6FF' : '#fff',
                  color: activeFilterCount > 0 ? '#2563EB' : '#374151',
                  border: activeFilterCount > 0 ? '0.5px solid #BFDBFE' : '0.5px solid #E2E5EC',
                }}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full text-[9px] font-bold bg-[#2563EB] text-white flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0 w-auto" sideOffset={4}>
              <FiltersPanel
                filters={{ difficulty, categories, duration, frequency, sessionLength, status }}
                onChange={patch => {
                  if ('difficulty'    in patch) setDifficulty(patch.difficulty);
                  if ('categories'    in patch) setCategories(patch.categories);
                  if ('duration'      in patch) setDuration(patch.duration);
                  if ('frequency'     in patch) setFrequency(patch.frequency);
                  if ('sessionLength' in patch) setSessionLength(patch.sessionLength);
                  if ('status'        in patch) setStatus(patch.status);
                }}
              />
              {activeFilterCount > 0 && (
                <div className="px-4 pb-3">
                  <button onClick={() => { clearAll(); setFilterOpen(false); }} className="text-xs text-[#EF4444] font-medium hover:underline">
                    Clear all filters
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Sort */}
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger
              className="h-9 w-36 text-sm bg-white"
              style={{ border: '0.5px solid #E2E5EC', borderRadius: 12 }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Layout toggle */}
          <div className="flex rounded-xl overflow-hidden flex-shrink-0" style={{ border: '0.5px solid #E2E5EC' }}>
            {[{ v: 'grid', Icon: LayoutGrid }, { v: 'list', Icon: List }].map(({ v, Icon }) => (
              <button
                key={v}
                onClick={() => setLayout(v)}
                className="w-9 h-9 flex items-center justify-center transition-colors"
                style={{
                  background: layout === v ? '#0E1525' : '#fff',
                  color: layout === v ? '#fff' : '#9CA3AF',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Active filter chips ── */}
        {activeChips.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap -mt-1">
            {activeChips.map(chip => (
              <span
                key={chip.key}
                className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB]"
                style={{ border: '0.5px solid #BFDBFE' }}
              >
                {chip.label}
                <button onClick={chip.onRemove} className="ml-0.5 hover:opacity-70">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <button onClick={clearAll} className="text-[11px] text-[#9CA3AF] hover:text-[#374151] transition-colors">
              Clear all
            </button>
          </div>
        )}

        {/* ── PROGRAM GRID (centerpiece) ── */}
        <section>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-52 bg-white rounded-xl animate-pulse" style={{ border: '0.5px solid #E2E5EC' }} />
              ))}
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl" style={{ border: '0.5px solid #E2E5EC' }}>
              <div className="w-14 h-14 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-6 h-6 text-[#9CA3AF]" />
              </div>
              <p className="font-semibold text-[#0E1525]">No programs yet</p>
              <p className="text-sm text-[#6B7280] mt-1 mb-5">Create your first workout program to get started.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#2563EB' }}
              >
                <Plus className="w-4 h-4 inline mr-1" />Create program
              </button>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl" style={{ border: '0.5px solid #E2E5EC' }}>
              <div className="w-14 h-14 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-6 h-6 text-[#9CA3AF]" />
              </div>
              <p className="font-semibold text-[#0E1525]">No programs match</p>
              <p className="text-sm text-[#6B7280] mt-1 mb-5">Try adjusting your search or filters.</p>
              <button onClick={clearAll} className="px-4 py-2 rounded-xl text-sm font-semibold border text-[#374151]" style={{ border: '0.5px solid #E2E5EC' }}>
                Clear filters
              </button>
            </div>
          ) : layout === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPrograms.map(program => {
                const { assigned } = getClientsForProgram(program.id);
                return (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    clientsAssigned={assigned}
                    onEdit={() => openBuilder(program)}
                    onDuplicate={() => { if (!canUseTemplates) { openUpgradeModal('program_templates'); return; } duplicateProgram(program); }}
                    onAssign={() => setAssigningProgram(program)}
                    onPreview={() => setPreviewingProgram(program)}
                    onArchive={() => archiveMutation.mutate(program.id)}
                    onDelete={() => deleteMutation.mutate(program.id)}
                    allClients={allClients}
                  />
                );
              })}

              {/* Dashed "New program" tile */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-xl flex flex-col items-center justify-center gap-3 py-10 transition-all hover:border-[#2563EB] hover:bg-[#EFF6FF]/40 group"
                style={{ border: '1.5px dashed #D1D5DB', background: 'transparent' }}
              >
                <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] group-hover:bg-[#EFF6FF] flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#2563EB] transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-[#9CA3AF] group-hover:text-[#2563EB] transition-colors">New program</p>
                  <p className="text-[10px] text-[#C4C9D4] mt-0.5">Build from scratch or AI</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPrograms.map(program => {
                const { assigned, inProgress } = getClientsForProgram(program.id);
                return (
                  <ProgramListRow
                    key={program.id}
                    program={program}
                    clientsAssigned={assigned}
                    clientsInProgress={inProgress}
                    onEdit={() => openBuilder(program)}
                    onDuplicate={() => { if (!canUseTemplates) { openUpgradeModal('program_templates'); return; } duplicateProgram(program); }}
                    onAssign={() => setAssigningProgram(program)}
                    onPreview={() => setPreviewingProgram(program)}
                    onArchive={() => archiveMutation.mutate(program.id)}
                    onDelete={() => deleteMutation.mutate(program.id)}
                    allClients={allClients}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* ── INTELLIGENCE & SUGGESTED (below the grid) ── */}
        {allClients.length > 0 && !searchQuery && activeFilterCount === 0 && (
          <div className="-mx-6">
            <IntelligenceBar clients={allClients} checkIns={allCheckIns} />
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <ProgramAssignmentModal
        open={!!assigningProgram}
        onOpenChange={(open) => !open && setAssigningProgram(null)}
        program={assigningProgram}
        allClients={allClients}
        onAssign={async ({ selectedClients }) => {
          for (const clientId of selectedClients) {
            await base44.entities.Client.update(clientId, { assigned_program_id: assigningProgram.id });
          }
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          const names = selectedClients.map(id => allClients.find(c => c.id === id)?.name || 'Client').join(', ');
          toast.success(`${assigningProgram.title} assigned to ${names} ✓`);
          setAssigningProgram(null);
        }}
      />

      <AnimatePresence>
        {previewingProgram && (
          <ProgramDetailModal
            program={previewingProgram}
            assignedClients={getClientsForProgram(previewingProgram.id).assigned}
            allClients={allClients}
            onClose={() => setPreviewingProgram(null)}
            onAssign={() => { setAssigningProgram(previewingProgram); setPreviewingProgram(null); }}
            onEdit={() => { openBuilder(previewingProgram); setPreviewingProgram(null); }}
          />
        )}
      </AnimatePresence>

      <ProgramCreationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProgramCreated={(program) => {
          queryClient.invalidateQueries({ queryKey: ['programs'] });
          setShowCreateModal(false);
          if (program?.id) {
            toast.success('Program created! Opening in builder…');
            openBuilder(program);
          } else {
            toast.success('Program created successfully!');
          }
        }}
      />
    </div>
  );
}