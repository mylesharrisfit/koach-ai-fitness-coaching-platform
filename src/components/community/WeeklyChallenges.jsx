import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Target, Calendar, Users, Dumbbell, Footprints, Flame, TrendingDown, Trophy, X } from 'lucide-react';
import { format, differenceInDays, isAfter, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BADGE_CONFIG } from '@/lib/badges';

const TYPE_CONFIG = {
  steps:        { label: 'Steps',       icon: Footprints,   unit: 'steps' },
  workouts:     { label: 'Workouts',    icon: Dumbbell,     unit: 'sessions' },
  streak:       { label: 'Streak',      icon: Flame,        unit: 'days' },
  weight_loss:  { label: 'Weight Loss', icon: TrendingDown, unit: 'lbs' },
  custom:       { label: 'Custom',      icon: Target,       unit: 'units' },
};

const BLANK_FORM = {
  title: '', description: '', type: 'workouts', goal: '',
  start_date: format(new Date(), 'yyyy-MM-dd'), end_date: '', reward_badge: '', is_active: true,
};

function ChallengeCard({ challenge, isCoach, onToggle, onDelete }) {
  const isActive = challenge.is_active && challenge.end_date && isAfter(parseISO(challenge.end_date), new Date());
  const daysLeft = challenge.end_date ? differenceInDays(parseISO(challenge.end_date), new Date()) : null;
  const cfg = TYPE_CONFIG[challenge.type] || TYPE_CONFIG.custom;
  const CfgIcon = cfg.icon;
  const rewardBadge = challenge.reward_badge ? BADGE_CONFIG[challenge.reward_badge] : null;
  const participants = challenge.participants || [];

  const progressPct = challenge.goal > 0 && challenge.completed_count != null
    ? Math.min(100, Math.round((challenge.completed_count / (challenge.goal || 1)) * 100))
    : null;

  return (
    <div className={cn('bg-white border rounded-xl p-4 space-y-3 transition-all', isActive ? 'border-[#E5E7EB]' : 'border-[#E5E7EB] opacity-60')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
            <CfgIcon className="w-4 h-4 text-[#374151]" />
          </div>
          <div>
            <p className="font-semibold text-sm text-[#111827]">{challenge.title}</p>
            <p className="text-xs text-[#9CA3AF]">{cfg.label} challenge</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isActive && daysLeft !== null && (
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border',
              daysLeft <= 2 ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]' : 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]')}>
              {daysLeft <= 0 ? 'Ended' : `${daysLeft}d left`}
            </span>
          )}
          {!isActive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] text-[#9CA3AF]">Inactive</span>}
        </div>
      </div>

      {challenge.description && <p className="text-xs text-[#6B7280] leading-relaxed">{challenge.description}</p>}

      {/* Progress bar */}
      {progressPct !== null && (
        <div>
          <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-1">
            <span>{challenge.completed_count || 0} / {challenge.goal} {cfg.unit}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
            <div className="h-full bg-[#111827] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-[#6B7280] flex-wrap">
        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Goal: {challenge.goal?.toLocaleString()} {cfg.unit}</span>
        {challenge.end_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Ends {format(parseISO(challenge.end_date), 'MMM d')}</span>}
        {participants.length > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {participants.length} joined</span>}
      </div>

      {/* Reward badge */}
      {rewardBadge && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFBEB] border border-[#FEF08A] rounded-lg">
          <Trophy className="w-3.5 h-3.5 text-[#D97706]" />
          <span className="text-xs font-semibold text-[#D97706]">Reward: {rewardBadge.label} badge</span>
        </div>
      )}

      {isCoach && (
        <div className="flex items-center gap-2 pt-1 border-t border-[#F3F4F6]">
          <button onClick={() => onToggle(challenge)} className="text-[10px] font-semibold px-3 py-1 rounded-lg border border-[#E5E7EB] text-[#374151] hover:border-[#111827] transition-colors">
            {challenge.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={() => onDelete(challenge.id)} className="text-[10px] font-semibold px-3 py-1 rounded-lg border border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function WeeklyChallenges({ isCoach, compact, groupId }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const queryClient = useQueryClient();

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges', groupId],
    queryFn: () => groupId
      ? base44.entities.Challenge.filter({ group_id: groupId }, '-created_date')
      : base44.entities.Challenge.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.Challenge.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['challenges', groupId] }); setShowForm(false); setForm(BLANK_FORM); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Challenge.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges', groupId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Challenge.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges', groupId] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, goal: Number(form.goal), group_id: groupId || undefined });
  };

  const active = challenges.filter(c => c.is_active);
  const past = challenges.filter(c => !c.is_active);

  const shownActive = compact ? active.slice(0, 2) : active;

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Active Challenges</p>
          {isCoach && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#111827] text-white rounded-lg hover:bg-black transition-colors">
              <Plus className="w-3 h-3" /> New Challenge
            </button>
          )}
        </div>
      )}

      {shownActive.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-[#E5E7EB] rounded-xl bg-[#F9FAFB]">
          <Target className="w-7 h-7 mx-auto mb-2 text-[#D1D5DB]" />
          <p className="text-sm text-[#374151]">No active challenges</p>
          {isCoach && !compact && <p className="text-xs text-[#9CA3AF] mt-1">Create one to motivate your community!</p>}
        </div>
      ) : (
        <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
          {shownActive.map(c => (
            <ChallengeCard key={c.id} challenge={c} isCoach={isCoach}
              onToggle={(ch) => updateMutation.mutate({ id: ch.id, data: { is_active: !ch.is_active } })}
              onDelete={(id) => deleteMutation.mutate(id)} />
          ))}
        </div>
      )}

      {!compact && past.length > 0 && (
        <>
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mt-2">Past Challenges</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {past.map(c => (
              <ChallengeCard key={c.id} challenge={c} isCoach={isCoach}
                onToggle={(ch) => updateMutation.mutate({ id: ch.id, data: { is_active: !ch.is_active } })}
                onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </div>
        </>
      )}

      {/* Create Challenge Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#111827] font-semibold">Create Challenge</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-semibold text-[#374151]">Challenge Name *</Label>
              <Input className="mt-1" required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="7-Day Workout Challenge" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#374151]">Description</Label>
              <Input className="mt-1" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Complete 7 workouts in 7 days…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#374151]">Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => {
                      const Icon = v.icon;
                      return <SelectItem key={k} value={k}><span className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{v.label}</span></SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#374151]">Goal ({TYPE_CONFIG[form.type]?.unit})</Label>
                <Input className="mt-1" required type="number" value={form.goal} onChange={e => setForm(f => ({...f, goal: e.target.value}))} placeholder="e.g. 5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#374151]">Start Date</Label>
                <Input className="mt-1" type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#374151]">End Date *</Label>
                <Input className="mt-1" required type="date" value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#374151]">Reward Badge (optional)</Label>
              <Select value={form.reward_badge} onValueChange={v => setForm(f => ({...f, reward_badge: v}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a badge reward…" /></SelectTrigger>
                <SelectContent className="max-h-48">
                  <SelectItem value={null}>No reward</SelectItem>
                  {Object.entries(BADGE_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-[#E5E7EB] text-sm font-semibold text-[#374151] rounded-lg hover:bg-[#F9FAFB] transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#111827] text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors">Create Challenge</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}