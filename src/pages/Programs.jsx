import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Plus, Dumbbell, Clock, BarChart3, Edit, Trash2, Copy,
  Users, Lock, Zap, Target, Flame, ChevronRight, Layers
} from 'lucide-react';
import { hasFeature, getLimit } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CloneToClientDialog from '../components/programs/CloneToClientDialog';
import IntelligenceBar from '@/components/intelligence/IntelligenceBar';
import LimitBanner from '@/components/subscription/LimitBanner';
import { useUpgradeModal } from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

/* ── Assign to Client Modal ── */
function AssignModal({ program, onClose }) {
  const [selected, setSelected] = useState('');
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const assignMutation = useMutation({
    mutationFn: () => base44.entities.Client.update(selected, { assigned_program_id: program.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Program assigned!');
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-[#E7EAF3]">
          <DialogTitle className="text-base font-bold text-[#1F2A44]">Assign to Client</DialogTitle>
          <p className="text-xs text-[#6B7280] mt-0.5 truncate">"{program.title}"</p>
        </div>
        <div className="p-4 space-y-3">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="border-[#E7EAF3] bg-[#F6F7FB]">
              <SelectValue placeholder="Select a client..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 text-xs border-[#E7EAF3]" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 text-xs" disabled={!selected || assignMutation.isPending}
              onClick={() => assignMutation.mutate()}>
              {assignMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Program Card ── */
function ProgramCard({ program, onEdit, onDuplicate, onAssign, onDelete, canTemplate }) {
  const [hovered, setHovered] = useState(false);
  const catMeta = CATEGORY_META[program.category] || CATEGORY_META.custom;
  const CatIcon = catMeta.icon;
  const estMins = estSessionMins(program);
  const workoutCount = program.workouts?.length || 0;
  const exerciseCount = program.workouts?.reduce((s, w) => s + (w.exercises?.length || 0), 0) || 0;

  return (
    <div
      className="bg-white border border-[#E7EAF3] rounded-2xl overflow-hidden transition-all hover:border-blue-200 hover:shadow-md group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card body — click to edit */}
      <div className="p-5 cursor-pointer" onClick={onEdit}>
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-lg border capitalize', DIFFICULTY_STYLES[program.difficulty] || 'bg-[#F6F7FB] text-[#374151] border-[#E7EAF3]')}>
            {program.difficulty || 'custom'}
          </span>
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-lg border flex items-center gap-1', catMeta.color)}>
            <CatIcon className="w-2.5 h-2.5" />
            {catMeta.label}
          </span>
          {program.is_template && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg border bg-indigo-50 text-indigo-700 border-indigo-100">
              Template
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[#1F2A44] text-[15px] leading-snug mb-1">{program.title}</h3>
        {program.description && (
          <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed mb-3">{program.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
          {program.duration_weeks && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {program.duration_weeks}wk
            </span>
          )}
          {program.days_per_week && (
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> {program.days_per_week}×/wk
            </span>
          )}
          {workoutCount > 0 && (
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3 h-3" /> {workoutCount} days
            </span>
          )}
          {estMins && (
            <span className="flex items-center gap-1 ml-auto text-primary font-medium">
              ~{estMins}min/session
            </span>
          )}
        </div>
      </div>

      {/* Action bar — always visible on mobile, hover on desktop */}
      <div className={cn(
        'border-t border-[#F6F7FB] bg-[#FAFBFE] flex items-center px-4 py-2.5 gap-1 transition-all',
        'opacity-100 md:opacity-0 md:group-hover:opacity-100',
        hovered && 'md:opacity-100'
      )}>
        <button onClick={onAssign}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-[#EEF4FF] hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
          <Users className="w-3 h-3" /> Assign
        </button>
        <button onClick={onDuplicate}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#374151] bg-[#F6F7FB] hover:bg-[#ECEEF5] px-3 py-1.5 rounded-lg transition-colors">
          <Copy className="w-3 h-3" /> Duplicate
        </button>
        <button onClick={onEdit}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#374151] bg-[#F6F7FB] hover:bg-[#ECEEF5] px-3 py-1.5 rounded-lg transition-colors">
          <Edit className="w-3 h-3" /> Edit
        </button>
        <button onClick={onDelete}
          className="ml-auto flex items-center justify-center w-7 h-7 rounded-lg text-[#D1D5DB] hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
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
  const [assigningProgram, setAssigningProgram] = useState(null);
  const [cloningProgram, setCloningProgram] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });

  const duplicateProgram = (program) => {
    const { id, created_date, updated_date, created_by, ...rest } = program;
    createMutation.mutate({ ...rest, title: `${rest.title} (Copy)` });
    toast.success('Program duplicated');
  };

  const openBuilder = (program = null) => navigate('/program-builder', { state: { program } });

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

      {/* ── Intelligence Bar ── */}
      {allClients.length > 0 && (
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
              onClick={() => openBuilder()}
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
        <h2 className="text-sm font-bold text-[#374151] mb-3">All Programs</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-52 bg-white rounded-2xl border border-[#E7EAF3] animate-pulse" />)}
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E7EAF3]">
            <div className="w-14 h-14 rounded-2xl bg-[#F6F7FB] border border-[#E7EAF3] flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-6 h-6 text-[#9CA3AF]" />
            </div>
            <p className="font-semibold text-[#1F2A44]">No programs yet</p>
            <p className="text-sm text-[#6B7280] mt-1 mb-5">Create your first workout program to get started.</p>
            <Button onClick={() => openBuilder()}><Plus className="w-4 h-4" /> Create Program</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map(program => (
              <ProgramCard
                key={program.id}
                program={program}
                canTemplate={canUseTemplates}
                onEdit={() => openBuilder(program)}
                onDuplicate={() => {
                  if (!canUseTemplates) { openUpgradeModal('program_templates'); return; }
                  duplicateProgram(program);
                }}
                onAssign={() => setAssigningProgram(program)}
                onDelete={() => deleteMutation.mutate(program.id)}
              />
            ))}
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
    </div>
  );
}