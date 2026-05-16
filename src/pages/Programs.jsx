import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Plus, Dumbbell, Clock, BarChart3, Edit, Trash2, Copy,
  Users, Lock, Zap, Target, Flame, ChevronRight, Layers
} from 'lucide-react';
import { hasFeature, getLimit } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import CloneToClientDialog from '../components/programs/CloneToClientDialog';
import ProgramCard from '../components/programs/ProgramCard';
import ProgramListRow from '../components/programs/ProgramListRow';
import ProgramSearchFilter from '../components/programs/ProgramSearchFilter';
import ProgramDetailModal from '../components/programs/ProgramDetailModal';
import ProgramCreationModal from '../components/programs/ProgramCreationModal';
import IntelligenceBar from '@/components/intelligence/IntelligenceBar';
import LimitBanner from '@/components/subscription/LimitBanner';
import { useUpgradeModal } from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';

/* ── Config ── */
const DIFFICULTY_STYLES = {
  beginner:     'bg-emerald-50 text-emerald-700 border-emerald-100',
  intermediate: 'bg-blue-50 text-blue-700 border-blue-100',
  advanced:     'bg-amber-50 text-amber-700 border-amber-100',
  elite:        'bg-red-50 text-red-600 border-red-100',
};

const CATEGORY_META = {
  strength:    { label: 'Strength',       icon: Zap,    color: 'bg-purple-50 text-purple-700 border-purple-100' },
  hypertrophy: { label: 'Hypertrophy',    icon: Layers, color: 'bg-blue-50 text-blue-700 border-blue-100' },
  fat_loss:    { label: 'Fat Loss',       icon: Flame,  color: 'bg-orange-50 text-orange-700 border-orange-100' },
  athletic:    { label: 'Athletic',       icon: Target, color: 'bg-teal-50 text-teal-700 border-teal-100' },
  mobility:    { label: 'Mobility',       icon: Target, color: 'bg-lime-50 text-lime-700 border-lime-100' },
  custom:      { label: 'Custom',         icon: Dumbbell, color: 'bg-[#F6F7FB] text-[#374151] border-[#E7EAF3]' },
};

// Estimate session time based on workouts/exercises
function estSessionMins(program) {
  if (!program.workouts?.length) return null;
  const avgExercises = program.workouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0) / program.workouts.length;
  return Math.round(avgExercises * 5 + (program.workouts[0]?.exercises?.reduce((s, e) => s + (e.sets || 3) * ((e.rest_seconds || 60) / 60 + 1), 0) || 30));
}

/* ── Assign to Client Modal — 1-click ── */
function AssignModal({ program, onClose }) {
  const [assigning, setAssigning] = useState(null);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const assignMutation = useMutation({
    mutationFn: (clientId) => base44.entities.Client.update(clientId, { assigned_program_id: program.id }),
    onSuccess: (_, clientId) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      const name = clients.find(c => c.id === clientId)?.name || 'Client';
      toast.success(`Assigned to ${name}`);
      onClose();
    },
  });

  const handlePick = (clientId) => {
    setAssigning(clientId);
    assignMutation.mutate(clientId);
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xs p-0 overflow-hidden rounded-xl">
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-sm font-semibold">Assign to client</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">"{program.title}"</p>
        </div>
        <div className="p-2 max-h-64 overflow-y-auto">
          {clients.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No clients found</p>
          ) : (
            clients.map(c => (
              <button
                key={c.id}
                onClick={() => handlePick(c.id)}
                disabled={assignMutation.isPending}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-secondary text-left transition-colors disabled:opacity-50"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {c.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  {c.goal && <p className="text-[11px] text-muted-foreground capitalize">{c.goal.replace(/_/g, ' ')}</p>}
                </div>
                {assigning === c.id && assignMutation.isPending && (
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}



/* ── Suggested Card (horizontal strip) ── */
function SuggestedCard({ program, onAssign, onEdit }) {
  const catMeta = CATEGORY_META[program.category] || CATEGORY_META.custom;
  const CatIcon = catMeta.icon;
  const estMins = estSessionMins(program);

  return (
    <div className="flex-shrink-0 w-64 bg-white border border-[#E7EAF3] rounded-2xl p-4 hover:border-blue-200 hover:shadow-md transition-all group">
      <div className="flex items-center gap-2 mb-2.5">
        <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0', catMeta.color, 'border')}>
          <CatIcon className="w-3.5 h-3.5" />
        </div>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-lg border capitalize', DIFFICULTY_STYLES[program.difficulty] || 'bg-[#F6F7FB] text-[#374151] border-[#E7EAF3]')}>
          {program.difficulty}
        </span>
        {estMins && <span className="text-[10px] text-[#9CA3AF] ml-auto">~{estMins}min</span>}
      </div>
      <h4 className="text-sm font-semibold text-[#1F2A44] leading-snug mb-3 line-clamp-2">{program.title}</h4>
      <div className="flex gap-1.5">
        <button onClick={onAssign}
          className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-primary bg-[#EEF4FF] hover:bg-blue-100 py-1.5 rounded-lg transition-colors">
          <Users className="w-3 h-3" /> Assign
        </button>
        <button onClick={onEdit}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F6F7FB] transition-colors flex-shrink-0">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function Programs() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assigningProgram, setAssigningProgram] = useState(null);
  const [cloningProgram, setCloningProgram] = useState(null);
  const [previewingProgram, setPreviewingProgram] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [categories, setCategories] = useState([]);
  const [duration, setDuration] = useState('all');
  const [frequency, setFrequency] = useState('all');
  const [sessionLength, setSessionLength] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [layout, setLayout] = useState('grid');
  const queryClient = useQueryClient();
  const { openUpgradeModal } = useUpgradeModal();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program deleted');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkoutProgram.update(id, { is_archived: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program archived');
    },
  });

  const duplicateProgram = (program) => {
    const { id, created_date, updated_date, created_by, ...rest } = program;
    createMutation.mutate({ ...rest, title: `${rest.title} (Copy)` });
    toast.success('Program duplicated');
  };

  const openBuilder = (program = null) => navigate('/program-builder', { state: { program } });

  // Calculate clients assigned to each program + who is in progress
  const getClientsForProgram = (programId) => {
    const assigned = allClients.filter(c => c.assigned_program_id === programId);
    const inProgress = assigned.filter(c => {
      const clientCheckIns = allCheckIns.filter(ci => ci.client_id === c.id);
      return clientCheckIns.length > 0;
    });
    return { assigned, inProgress };
  };

  // Filter and sort programs
  const filteredAndSortedPrograms = useMemo(() => {
    let filtered = [...programs];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.workouts?.some(w => w.exercises?.some(e => e.name?.toLowerCase().includes(query)))
      );
    }

    // Difficulty
    if (difficulty !== 'all') {
      filtered = filtered.filter(p => p.difficulty === difficulty);
    }

    // Categories
    if (categories.length > 0) {
      filtered = filtered.filter(p => categories.includes(p.category));
    }

    // Duration
    if (duration !== 'all') {
      filtered = filtered.filter(p => {
        const weeks = p.duration_weeks || 0;
        if (duration === '1-4') return weeks >= 1 && weeks <= 4;
        if (duration === '5-8') return weeks >= 5 && weeks <= 8;
        if (duration === '9-12') return weeks >= 9 && weeks <= 12;
        if (duration === '12+') return weeks > 12;
        return true;
      });
    }

    // Frequency
    if (frequency !== 'all') {
      filtered = filtered.filter(p => {
        const days = p.days_per_week || 0;
        if (frequency === '2-3') return days >= 2 && days <= 3;
        if (frequency === '4-5') return days >= 4 && days <= 5;
        if (frequency === '6') return days === 6;
        return true;
      });
    }

    // Session Length
    if (sessionLength !== 'all') {
      filtered = filtered.filter(p => {
        const mins = (() => {
          if (!p.workouts?.length) return 0;
          const avgExercises = p.workouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0) / p.workouts.length;
          return Math.round(avgExercises * 5 + (p.workouts[0]?.exercises?.reduce((s, e) => s + (e.sets || 3) * ((e.rest_seconds || 60) / 60 + 1), 0) || 30));
        })();
        if (sessionLength === '0-30') return mins < 30;
        if (sessionLength === '30-45') return mins >= 30 && mins <= 45;
        if (sessionLength === '45-60') return mins > 45 && mins <= 60;
        if (sessionLength === '60+') return mins > 60;
        return true;
      });
    }

    // Status
    if (status !== 'all') {
      filtered = filtered.filter(p => {
        const clientsForProgram = getClientsForProgram(p.id);
        if (status === 'active') return clientsForProgram.assigned.length > 0;
        if (status === 'unassigned') return clientsForProgram.assigned.length === 0;
        if (status === 'archived') return p.is_archived;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_date) - new Date(a.created_date);
      if (sort === 'oldest') return new Date(a.created_date) - new Date(b.created_date);
      if (sort === 'alphabetical-az') return a.title.localeCompare(b.title);
      if (sort === 'alphabetical-za') return b.title.localeCompare(a.title);
      if (sort === 'duration-short') return (a.duration_weeks || 0) - (b.duration_weeks || 0);
      if (sort === 'duration-long') return (b.duration_weeks || 0) - (a.duration_weeks || 0);
      if (sort === 'most-assigned') {
        const aCount = getClientsForProgram(a.id).assigned.length;
        const bCount = getClientsForProgram(b.id).assigned.length;
        return bCount - aCount;
      }
      return 0;
    });

    return filtered;
  }, [programs, searchQuery, difficulty, categories, duration, frequency, sessionLength, status, sort, allClients, allCheckIns]);

  // "Suggested" = top 4 programs, prioritising recently created + templates
  const suggested = [...programs]
    .sort((a, b) => (b.is_template ? 1 : 0) - (a.is_template ? 1 : 0))
    .slice(0, 4);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2A44]">Workout Library</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">{programs.length} program{programs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={() => { if (atLimit) { openUpgradeModal('clients'); return; } openBuilder(); }}
          variant={atLimit ? 'outline' : 'default'}
          className={cn('gap-1.5', atLimit && 'border-red-200 text-red-500 hover:bg-red-50')}
        >
          {atLimit ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {atLimit ? `Limit (${programs.length}/${programLimit})` : 'New Program'}
        </Button>
      </div>

      <LimitBanner limitKey="max_programs" currentCount={programs.length} label="programs" featureKey="clients" />

      {/* ── Search & Filter Bar ── */}
      <ProgramSearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        categories={categories}
        onCategoriesChange={setCategories}
        duration={duration}
        onDurationChange={setDuration}
        frequency={frequency}
        onFrequencyChange={setFrequency}
        sessionLength={sessionLength}
        onSessionLengthChange={setSessionLength}
        status={status}
        onStatusChange={setStatus}
        sort={sort}
        onSortChange={setSort}
        layout={layout}
        onLayoutChange={setLayout}
        resultCount={filteredAndSortedPrograms.length}
      />

      {/* ── Intelligence Bar ── */}
      {allClients.length > 0 && !searchQuery && categories.length === 0 && difficulty === 'all' && duration === 'all' && frequency === 'all' && sessionLength === 'all' && status === 'all' && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <IntelligenceBar clients={allClients} checkIns={allCheckIns} />
          <div className="mt-4" />
        </div>
      )}

      {/* ── Suggested to assign today ── */}
      {!isLoading && suggested.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-[#1F2A44]">Suggested to assign today</h2>
            <span className="text-xs text-[#9CA3AF] ml-1">Based on your library</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            {suggested.map(p => (
              <SuggestedCard
                key={p.id}
                program={p}
                onAssign={(e) => { e?.stopPropagation?.(); setAssigningProgram(p); }}
                onEdit={() => openBuilder(p)}
              />
            ))}
            {/* CTA card */}
            <div
              onClick={() => setShowCreateModal(true)}
              className="flex-shrink-0 w-56 border-2 border-dashed border-[#D1D5DB] rounded-2xl flex flex-col items-center justify-center p-5 text-center cursor-pointer hover:border-primary hover:bg-[#EEF4FF]/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#F6F7FB] group-hover:bg-[#EEF4FF] flex items-center justify-center mb-2 transition-colors">
                <Plus className="w-4 h-4 text-[#9CA3AF] group-hover:text-primary" />
              </div>
              <p className="text-xs font-semibold text-[#9CA3AF] group-hover:text-primary transition-colors">Build new program</p>
            </div>
          </div>
        </section>
      )}

      {/* ── All Programs ── */}
      <section>
        {isLoading ? (
          <div className={layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
            {[1, 2, 3].map(i => (
              <div key={i} className={layout === 'grid' ? 'h-52 bg-white rounded-2xl border border-[#E7EAF3] animate-pulse' : 'h-16 bg-white rounded-lg border border-[#E7EAF3] animate-pulse'} />
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E7EAF3]">
            <div className="w-14 h-14 rounded-2xl bg-[#F6F7FB] border border-[#E7EAF3] flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-6 h-6 text-[#9CA3AF]" />
            </div>
            <p className="font-semibold text-[#1F2A44]">No programs yet</p>
            <p className="text-sm text-[#6B7280] mt-1 mb-5">Create your first workout program to get started.</p>
            <Button onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4" /> Create Program</Button>
          </div>
        ) : filteredAndSortedPrograms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E7EAF3]">
            <div className="w-14 h-14 rounded-2xl bg-[#F6F7FB] border border-[#E7EAF3] flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-6 h-6 text-[#9CA3AF]" />
            </div>
            <p className="font-semibold text-[#1F2A44]">No programs match your search</p>
            <p className="text-sm text-[#6B7280] mt-1 mb-5">Try different keywords or create a new program.</p>
            <Button onClick={() => { setSearchQuery(''); setDifficulty('all'); setCategories([]); setDuration('all'); setFrequency('all'); setSessionLength('all'); setStatus('all'); }}>
              Clear Filters
            </Button>
          </div>
        ) : layout === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSortedPrograms.map(program => {
              const { assigned, inProgress } = getClientsForProgram(program.id);
              return (
                <ProgramCard
                  key={program.id}
                  program={program}
                  clientsAssigned={assigned}
                  clientsInProgress={inProgress}
                  onEdit={() => openBuilder(program)}
                  onDuplicate={() => {
                    if (!canUseTemplates) { openUpgradeModal('program_templates'); return; }
                    duplicateProgram(program);
                  }}
                  onAssign={() => setAssigningProgram(program)}
                  onPreview={() => setPreviewingProgram(program)}
                  onArchive={() => archiveMutation.mutate(program.id)}
                  onDelete={() => deleteMutation.mutate(program.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedPrograms.map(program => {
              const { assigned, inProgress } = getClientsForProgram(program.id);
              return (
                <ProgramListRow
                  key={program.id}
                  program={program}
                  clientsAssigned={assigned}
                  clientsInProgress={inProgress}
                  onEdit={() => openBuilder(program)}
                  onDuplicate={() => {
                    if (!canUseTemplates) { openUpgradeModal('program_templates'); return; }
                    duplicateProgram(program);
                  }}
                  onAssign={() => setAssigningProgram(program)}
                  onPreview={() => setPreviewingProgram(program)}
                  onArchive={() => archiveMutation.mutate(program.id)}
                  onDelete={() => deleteMutation.mutate(program.id)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* ── Modals ── */}
      {assigningProgram && (
        <AssignModal program={assigningProgram} onClose={() => setAssigningProgram(null)} />
      )}
      {cloningProgram && (
        <CloneToClientDialog
          open={!!cloningProgram}
          onOpenChange={v => !v && setCloningProgram(null)}
          program={cloningProgram}
        />
      )}

      {/* Program Detail Modal */}
      <AnimatePresence>
        {previewingProgram && (
          <ProgramDetailModal
            program={previewingProgram}
            assignedClients={getClientsForProgram(previewingProgram.id).assigned}
            allClients={allClients}
            onClose={() => setPreviewingProgram(null)}
            onAssign={() => {
              setAssigningProgram(previewingProgram);
              setPreviewingProgram(null);
            }}
            onEdit={() => {
              openBuilder(previewingProgram);
              setPreviewingProgram(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Program Creation Modal */}
      <ProgramCreationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProgramCreated={(program) => {
          queryClient.invalidateQueries({ queryKey: ['programs'] });
          toast.success('Program created successfully!');
        }}
      />
    </div>
  );
}