/**
 * AIFollowUpChip — smart follow-up reminder shown in the client info sidebar
 * Detects when coach hasn't messaged a client in X days and suggests action
 */
import React, { useState } from 'react';
import { Sparkles, Loader2, MessageSquare, X } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { generateAIReply } from '@/lib/aiMessageAssistant';
import { cn } from '@/lib/utils';

export default function AIFollowUpChip({ client, allMessages, checkIns = [], onInsert }) {
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!client || dismissed) return null;

  const clientMessages = allMessages.filter(m => m.client_id === client.id);
  const sortedMsgs = [...clientMessages].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const lastCoachMsg = sortedMsgs.find(m => m.sender === 'coach');
  const daysSinceCoach = lastCoachMsg
    ? differenceInDays(new Date(), new Date(lastCoachMsg.created_date))
    : 999;

  // Only show if coach hasn't messaged in 3+ days
  if (daysSinceCoach < 3) return null;

  const firstName = client.name?.split(' ')[0] || client.name;

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateAIReply(client, allMessages, checkIns, 'casual');
    setLoading(false);
    if (result?.message) onInsert(result.message);
  };

  const label = daysSinceCoach === 999
    ? `Haven't messaged ${firstName} yet`
    : daysSinceCoach >= 7
    ? `${daysSinceCoach} days since last message to ${firstName}`
    : `${daysSinceCoach} days since you messaged ${firstName}`;

  const urgency = daysSinceCoach >= 7 ? 'high' : 'medium';

  return (
    <div className={cn(
      'rounded-xl border p-3 mx-3 mb-2',
      urgency === 'high'
        ? 'bg-destructive/10 border-destructive'
        : 'bg-warning/10 border-warning'
    )}>
      <div className="flex items-start gap-2 mb-2">
        <Sparkles className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', urgency === 'high' ? 'text-destructive' : 'text-warning')} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-[11px] font-semibold leading-tight', urgency === 'high' ? 'text-destructive' : 'text-warning')}>
            Follow-up suggested
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</p>
        </div>
        <button onClick={() => setDismissed(true)} className="flex-shrink-0 p-0.5 hover:opacity-60 transition-opacity">
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={cn(
          'w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-lg transition-colors',
          urgency === 'high'
            ? 'bg-destructive hover:bg-destructive text-white'
            : 'bg-warning hover:bg-warning text-white'
        )}
      >
        {loading ? (
          <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
        ) : (
          <><MessageSquare className="w-3 h-3" /> Generate Follow-up</>
        )}
      </button>
    </div>
  );
}