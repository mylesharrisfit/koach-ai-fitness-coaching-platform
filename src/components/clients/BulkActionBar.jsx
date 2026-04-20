import React, { useState } from 'react';
import { MessageSquare, ClipboardCheck, Flame, X, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function CalorieAdjust({ selectedClients, allCheckIns, onDone }) {
  const [saving, setSaving] = useState(false);

  const adjust = async (delta) => {
    setSaving(true);
    let updated = 0;
    for (const client of selectedClients) {
      if (!client.assigned_nutrition_id) continue;
      const plans = await base44.entities.NutritionPlan.filter({ id: client.assigned_nutrition_id });
      const plan = plans[0];
      if (plan) {
        const newCals = Math.max(1000, (plan.calories || 2000) + delta);
        await base44.entities.NutritionPlan.update(plan.id, { calories: newCals });
        await base44.entities.Message.create({
          client_id: client.id, client_name: client.name, sender: 'coach',
          content: `Your daily calorie target has been updated to ${newCals} kcal (${delta > 0 ? '+' : ''}${delta} adjustment).`,
          tag: 'nutrition', is_read: false,
        });
        updated++;
      }
    }
    setSaving(false);
    toast.success(`Calories adjusted for ${updated} client${updated !== 1 ? 's' : ''}`);
    onDone();
  };

  return (
    <div className="p-3 bg-orange-500/8 border border-orange-500/20 rounded-xl space-y-2">
      <p className="text-xs font-semibold text-orange-400">Adjust daily calories for {selectedClients.length} clients</p>
      <div className="grid grid-cols-4 gap-2">
        {[[-250, '−250'], [-150, '−150'], [+150, '+150'], [+250, '+250']].map(([d, l]) => (
          <button key={d} onClick={() => adjust(d)} disabled={saving}
            className={cn('py-2.5 rounded-lg text-xs font-bold border active:scale-95 transition-all',
              d < 0 ? 'bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20')}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BulkActionBar({ selectedIds, clients, allCheckIns, onClear }) {
  const [panel, setPanel] = useState(null); // 'message' | 'calories'
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);

  const selectedClients = clients.filter(c => selectedIds.has(c.id));
  const count = selectedClients.length;

  if (count === 0) return null;

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    await Promise.all(selectedClients.map(c =>
      base44.entities.Message.create({
        client_id: c.id, client_name: c.name, sender: 'coach',
        content: message.trim(), tag: 'general', is_read: false,
      })
    ));
    setSending(false);
    setMessage('');
    setPanel(null);
    toast.success(`Message sent to ${count} client${count !== 1 ? 's' : ''}`);
    onClear();
  };

  const markReviewed = async () => {
    setMarking(true);
    // Find latest unreviewed check-in per client and mark it
    const checkInsToUpdate = selectedClients.flatMap(c => {
      const ci = allCheckIns
        .filter(ci => ci.client_id === c.id && !ci.coach_responded)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      return ci ? [ci] : [];
    });
    await Promise.all(checkInsToUpdate.map(ci =>
      base44.entities.CheckIn.update(ci.id, { coach_responded: true })
    ));
    setMarking(false);
    toast.success(`Marked ${checkInsToUpdate.length} check-in${checkInsToUpdate.length !== 1 ? 's' : ''} as reviewed`);
    onClear();
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/20 w-full max-w-lg pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-bold">{count} client{count !== 1 ? 's' : ''} selected</span>
          <button onClick={onClear} className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Actions */}
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {/* Send Message */}
            <button
              onClick={() => setPanel(p => p === 'message' ? null : 'message')}
              className={cn('flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all active:scale-95',
                panel === 'message' ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20')}>
              <MessageSquare className="w-4 h-4" />
              Message
            </button>

            {/* Mark Reviewed */}
            <button
              onClick={markReviewed}
              disabled={marking}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 active:scale-95 transition-all disabled:opacity-60">
              {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
              {marking ? 'Marking…' : 'Mark Reviewed'}
            </button>

            {/* Adjust Calories */}
            <button
              onClick={() => setPanel(p => p === 'calories' ? null : 'calories')}
              className={cn('flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all active:scale-95',
                panel === 'calories' ? 'bg-orange-500/15 border-orange-500/30 text-orange-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20')}>
              <Flame className="w-4 h-4" />
              Calories
            </button>
          </div>

          {/* Message panel */}
          {panel === 'message' && (
            <div className="space-y-2">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={`Send a message to ${count} client${count !== 1 ? 's' : ''}...`}
                rows={3}
                className="w-full text-sm bg-secondary/40 border border-border rounded-xl p-3 resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !message.trim()}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 active:scale-95 transition-all"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                {sending ? 'Sending…' : `Send to ${count} Client${count !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {/* Calories panel */}
          {panel === 'calories' && (
            <CalorieAdjust
              selectedClients={selectedClients}
              allCheckIns={allCheckIns}
              onDone={() => { setPanel(null); onClear(); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}