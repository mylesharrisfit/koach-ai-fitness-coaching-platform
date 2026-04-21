import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Target, Calendar, Users, Check } from 'lucide-react';
import { format, differenceInDays, isAfter, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const TYPE_CONFIG = {
  steps: { emoji: '👟', label: 'Steps', unit: 'steps' },
  workouts: { emoji: '🏋️', label: 'Workouts', unit: 'sessions' },
  water: { emoji: '💧', label: 'Water', unit: 'glasses' },
  streak: { emoji: '🔥', label: 'Streak', unit: 'days' },
  custom: { emoji: '🎯', label: 'Custom', unit: 'units' },
};

function ChallengeCard({ challenge, isCoach, onToggle, onDelete }) {
  const isActive = challenge.is_active && isAfter(parseISO(challenge.end_date), new Date());
  const daysLeft = differenceInDays(parseISO(challenge.end_date), new Date());
  const cfg = TYPE_CONFIG[challenge.type] || TYPE_CONFIG.custom;

  return (
    <div className={cn(
      "bg-white border rounded-2xl p-5 space-y-3 transition-all shadow-sm",
      isActive ? "border-blue-100" : "border-[#E7EAF3] opacity-70"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{challenge.emoji || cfg.emoji}</span>
          <div>
            <p className="font-semibold text-sm">{challenge.title}</p>
            <p className="text-xs text-muted-foreground">{cfg.label} challenge</p>
          </div>
        </div>
        {isActive ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
            {daysLeft >= 0 ? `${daysLeft}d left` : 'Ended'}
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F6F7FB] border border-[#E7EAF3] text-[#6B7280]">Inactive</span>
        )}
      </div>
      {challenge.description && <p className="text-xs text-[#6B7280]">{challenge.description}</p>}
      <div className="flex items-center gap-4 text-xs text-[#6B7280]">
        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Goal: {challenge.goal?.toLocaleString()} {cfg.unit}</span>
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Ends {format(parseISO(challenge.end_date), 'MMM d')}</span>
      </div>
      {isCoach && (
        <div className="flex items-center gap-2 pt-1 border-t border-[#E7EAF3]">
          <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => onToggle(challenge)}>
            {challenge.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive hover:text-destructive" onClick={() => onDelete(challenge.id)}>
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}

export default function WeeklyChallenges({ isCoach }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'workouts', goal: '', start_date: format(new Date(), 'yyyy-MM-dd'), end_date: '', emoji: '', is_active: true });
  const queryClient = useQueryClient();

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.Challenge.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['challenges'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Challenge.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Challenge.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges'] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, goal: Number(form.goal) });
  };

  const active = challenges.filter(c => c.is_active);
  const past = challenges.filter(c => !c.is_active);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6B7280] uppercase font-semibold tracking-wider">Active Challenges</p>
        {isCoach && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowForm(true)}>
            <Plus className="w-3 h-3 mr-1" /> New Challenge
          </Button>
        )}
      </div>

      {active.length === 0 ? (
        <div className="text-center py-10 text-[#6B7280] border border-dashed border-[#E7EAF3] rounded-2xl bg-[#F6F7FB]">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No active challenges.</p>
          {isCoach && <p className="text-xs mt-1">Create one to motivate your community!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {active.map(c => <ChallengeCard key={c.id} challenge={c} isCoach={isCoach} onToggle={(ch) => updateMutation.mutate({ id: ch.id, data: { is_active: !ch.is_active } })} onDelete={(id) => deleteMutation.mutate(id)} />)}
        </div>
      )}

      {past.length > 0 && (
        <>
          <p className="text-xs text-[#6B7280] uppercase font-semibold tracking-wider mt-4">Past Challenges</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {past.map(c => <ChallengeCard key={c.id} challenge={c} isCoach={isCoach} onToggle={(ch) => updateMutation.mutate({ id: ch.id, data: { is_active: !ch.is_active } })} onDelete={(id) => deleteMutation.mutate(id)} />)}
          </div>
        </>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Create Challenge</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <Label className="text-xs">Emoji</Label>
                <Input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} placeholder="🏆" className="text-center" />
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Title *</Label>
                <Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="7-Day Workout Challenge" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Complete 7 workouts in 7 days..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Goal ({TYPE_CONFIG[form.type]?.unit})</Label>
                <Input required type="number" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} placeholder="e.g. 5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label className="text-xs">End Date *</Label><Input required type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" size="sm">Create Challenge</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}