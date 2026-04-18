import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, subDays } from 'date-fns';
import { ClipboardList, Star, ChevronDown, ChevronUp, Upload, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import PageHeader from '../components/shared/PageHeader';
import AdherenceScore from '../components/adherence/AdherenceScore';
import { checkInScore } from '@/lib/adherence';
import BehaviorNudge from '@/components/subscription/BehaviorNudge';
import { getActiveNudges } from '@/lib/upgradeNudges';
import { useUpgradeModal } from '@/components/layout/AppLayout';
import { hasFeature } from '@/lib/subscription';

const MOOD_EMOJI = { great: '😄', good: '🙂', okay: '😐', tired: '😴', stressed: '😰' };

function CheckInCard({ checkIn, client }) {
  const [expanded, setExpanded] = useState(false);
  const [coachNote, setCoachNote] = useState(checkIn.notes || '');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReply, setAiReply] = useState('');
  const queryClient = useQueryClient();
  const score = checkInScore(checkIn);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CheckIn.update(checkIn.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checkins-review'] }),
  });

  const generateAIReply = async () => {
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a fitness coach reviewing a weekly check-in for client "${client?.name || 'the client'}".
Check-in data:
- Weight: ${checkIn.weight || 'N/A'} lbs
- Body Fat: ${checkIn.body_fat_pct || 'N/A'}%
- Mood: ${checkIn.mood || 'N/A'}
- Sleep: ${checkIn.sleep_hours || 'N/A'}h
- Training compliance: ${checkIn.compliance_training || 'N/A'}%
- Nutrition compliance: ${checkIn.compliance_nutrition || 'N/A'}%
- Client notes: ${checkIn.notes || 'None'}

Write a warm, encouraging, and specific coach reply (max 80 words). Acknowledge their numbers, praise effort, and give one actionable tip.`,
    });
    setAiReply(result);
    setAiLoading(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Summary row */}
      <button className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors text-left" onClick={() => setExpanded(!expanded)}>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
          {client?.name?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{client?.name || checkIn.client_name}</p>
            <span className="text-xs text-muted-foreground">{format(new Date(checkIn.date), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            {checkIn.weight && <span>⚖️ {checkIn.weight} lbs</span>}
            {checkIn.mood && <span>{MOOD_EMOJI[checkIn.mood]} {checkIn.mood}</span>}
            {checkIn.compliance_training != null && <span>💪 {checkIn.compliance_training}%</span>}
            {checkIn.compliance_nutrition != null && <span>🥗 {checkIn.compliance_nutrition}%</span>}
          </div>
        </div>
        <AdherenceScore score={score} size="sm" showLabel={false} />
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Photo grid */}
          {checkIn.photo_urls?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Progress Photos</p>
              <div className="flex gap-2 flex-wrap">
                {checkIn.photo_urls.map((url, i) => (
                  <img key={i} src={url} alt="progress" className="w-24 h-24 object-cover rounded-lg border border-border" />
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Weight', value: checkIn.weight ? `${checkIn.weight} lbs` : null },
              { label: 'Body Fat', value: checkIn.body_fat_pct ? `${checkIn.body_fat_pct}%` : null },
              { label: 'Sleep', value: checkIn.sleep_hours ? `${checkIn.sleep_hours}h` : null },
              { label: 'Mood', value: checkIn.mood ? `${MOOD_EMOJI[checkIn.mood]} ${checkIn.mood}` : null },
            ].filter(m => m.value).map(m => (
              <div key={m.label} className="bg-secondary/30 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground mb-1">{m.label}</p>
                <p className="text-sm font-semibold">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Measurements */}
          {checkIn.measurements && Object.values(checkIn.measurements).some(v => v) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Measurements (inches)</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(checkIn.measurements).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="text-xs">
                    <span className="text-muted-foreground capitalize">{k}: </span>
                    <span className="font-medium">{v}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client notes */}
          {checkIn.notes && (
            <div className="bg-secondary/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Client Notes</p>
              <p className="text-sm">{checkIn.notes}</p>
            </div>
          )}

          {/* AI Reply generator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Coach Response</p>
              <Button size="sm" variant="outline" onClick={generateAIReply} disabled={aiLoading} className="h-7 text-xs gap-1.5">
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Draft
              </Button>
            </div>
            {aiReply && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm text-foreground">
                {aiReply}
                <div className="flex gap-2 mt-2">
                  <Button size="sm" className="h-7 text-xs" onClick={() => { setCoachNote(aiReply); setAiReply(''); }}>Use This</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAiReply('')}>Dismiss</Button>
                </div>
              </div>
            )}
            <Textarea
              value={coachNote}
              onChange={e => setCoachNote(e.target.value)}
              placeholder="Write your coaching response..."
              className="text-sm resize-none"
              rows={3}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={() => updateMutation.mutate({ notes: coachNote })} disabled={updateMutation.isPending}>
                Save Response
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckInReview() {
  const [filter, setFilter] = useState('week');
  const [currentUser, setCurrentUser] = useState(null);
  const { openUpgradeModal } = useUpgradeModal();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });
  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkins-review'],
    queryFn: () => base44.entities.CheckIn.list('-date', 200),
  });

  const cutoff = filter === 'week' ? subDays(new Date(), 7)
    : filter === 'month' ? subDays(new Date(), 30)
    : new Date(0);

  const filtered = checkIns.filter(ci => new Date(ci.date) >= cutoff);
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

  // Show AI nudge if user has 5+ check-ins and doesn't have the AI feature
  const hasAI = hasFeature(currentUser, 'ai_checkin_responses');
  const aiNudges = !hasAI ? getActiveNudges({
    user: currentUser,
    clientCount: clients.length,
    checkInCount: checkIns.length,
  }).filter(n => n.id.startsWith('checkin_ai_hint')) : [];
  const aiNudge = aiNudges[0] || null;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Check-in Review"
        subtitle="Review and respond to all client check-ins"
        actions={
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            {['week', 'month', 'all'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn('text-xs px-3 py-1.5 rounded-md font-medium transition-colors capitalize', filter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                {f === 'week' ? 'This Week' : f === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>
        }
      />

      {aiNudge && (
        <BehaviorNudge nudge={aiNudge} onUpgrade={openUpgradeModal} className="mb-6" />
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <ClipboardList className="w-12 h-12 opacity-30" />
          <p className="text-sm">No check-ins in this period</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">{filtered.length} check-in{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.map(ci => (
            <CheckInCard key={ci.id} checkIn={ci} client={clientMap[ci.client_id]} />
          ))}
        </div>
      )}
    </div>
  );
}