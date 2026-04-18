import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import PageHeader from '../components/shared/PageHeader';
import AdherencePanel from '../components/adherence/AdherencePanel';
import AdherenceScore from '../components/adherence/AdherenceScore';
import { averageAdherenceScore, calculateStreak } from '@/lib/adherence';
import { BADGE_CONFIG } from '@/lib/badges';

export default function Adherence() {
  const [awardOpen, setAwardOpen] = useState(false);
  const [awardForm, setAwardForm] = useState({ client_id: '', badge_key: 'pr_hit', earned_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });
  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkins'],
    queryFn: () => base44.entities.CheckIn.list('-date', 300),
  });
  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.ClientBadge.list('-earned_date', 200),
  });

  const awardMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientBadge.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['badges'] }); setAwardOpen(false); },
  });

  const activeClients = clients.filter(c => c.status === 'active');
  const getCheckIns = (id) => checkIns.filter(ci => ci.client_id === id);
  const getBadges = (id) => badges.filter(b => b.client_id === id);

  const atRisk = activeClients.filter(c => {
    const score = averageAdherenceScore(getCheckIns(c.id));
    return score !== null && score < 50;
  });

  const handleAward = (e) => {
    e.preventDefault();
    const client = clients.find(c => c.id === awardForm.client_id);
    awardMutation.mutate({ ...awardForm, client_name: client?.name || '' });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Adherence & Gamification"
        subtitle="Scores, streaks, and achievement badges"
        actions={
          <Button onClick={() => setAwardOpen(true)}>
            <Trophy className="w-4 h-4 mr-2" /> Award Badge
          </Button>
        }
      />

      {/* Alert banner */}
      {atRisk.length > 0 && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 mb-6 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{atRisk.length} client{atRisk.length > 1 ? 's' : ''}</strong> below adherence threshold: {atRisk.map(c => c.name).join(', ')}</span>
        </div>
      )}

      {/* Leaderboard strip */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Adherence Leaderboard</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {activeClients
            .map(c => ({ client: c, score: averageAdherenceScore(getCheckIns(c.id)), streak: calculateStreak(getCheckIns(c.id)) }))
            .filter(x => x.score !== null)
            .sort((a, b) => b.score - a.score)
            .map(({ client, score, streak }, i) => (
              <div key={client.id} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/30">
                {i === 0 && <span className="text-xs text-amber-400 font-semibold">👑 Top</span>}
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {client.name?.[0]}
                </div>
                <p className="text-xs font-medium text-center leading-tight">{client.name}</p>
                <AdherenceScore score={score} size="sm" showLabel={false} />
                <p className="text-[10px] text-muted-foreground">🔥 {streak}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Per-client panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {activeClients.map(client => (
          <div key={client.id} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {client.name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-sm">{client.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{client.goal?.replace('_', ' ')}</p>
              </div>
            </div>
            <AdherencePanel
              client={client}
              checkIns={getCheckIns(client.id)}
              badges={getBadges(client.id)}
            />
          </div>
        ))}
      </div>

      {/* Award badge dialog */}
      <Dialog open={awardOpen} onOpenChange={setAwardOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Award Badge</DialogTitle></DialogHeader>
          <form onSubmit={handleAward} className="space-y-4 mt-2">
            <div>
              <Label>Client</Label>
              <Select value={awardForm.client_id} onValueChange={v => setAwardForm({ ...awardForm, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Badge</Label>
              <Select value={awardForm.badge_key} onValueChange={v => setAwardForm({ ...awardForm, badge_key: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BADGE_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={awardForm.earned_date} onChange={e => setAwardForm({ ...awardForm, earned_date: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setAwardOpen(false)}>Cancel</Button>
              <Button type="submit">Award</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}