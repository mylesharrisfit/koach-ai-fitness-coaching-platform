import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Check, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateRecommendations, PRIORITY_STYLES, CATEGORY_ICONS } from '@/lib/decisionEngine';
import { Link } from 'react-router-dom';

function MiniRecRow({ rec, checkIn, client, onApplied }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const styles = PRIORITY_STYLES[rec.priority];

  const handleApply = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (applied || applying) return;
    setApplying(true);

    try {
      if (rec.action === 'adjust_calories') {
        if (!client?.assigned_nutrition_id) { toast.error('No nutrition plan assigned'); setApplying(false); return; }
        const plans = await base44.entities.NutritionPlan.filter({ id: client.assigned_nutrition_id });
        const plan = plans[0];
        if (plan) {
          const newCals = Math.max(1000, (plan.calories || 2000) + rec.actionData.delta);
          await Promise.all([
            base44.entities.NutritionPlan.update(plan.id, { calories: newCals }),
            base44.entities.Message.create({
              client_id: checkIn.client_id, client_name: checkIn.client_name,
              sender: 'coach',
              content: `Your daily calorie target has been updated to ${newCals} kcal (${rec.actionData.delta > 0 ? '+' : ''}${rec.actionData.delta} kcal).`,
              tag: 'nutrition', is_read: false,
            }),
          ]);
          toast.success(`Calories → ${newCals} kcal ✓`);
        }
      } else if (rec.action === 'adjust_cardio') {
        const msg = rec.actionData.direction === 'up'
          ? 'Your cardio has been increased — add 1 extra session or +20 min this week.'
          : 'Your cardio has been reduced — drop 1 session or −15 min this week.';
        await Promise.all([
          base44.entities.CheckIn.update(checkIn.id, { coach_notes: (checkIn.coach_notes || '') + '\n[Cardio] ' + msg, coach_responded: true }),
          base44.entities.Message.create({ client_id: checkIn.client_id, client_name: checkIn.client_name, sender: 'coach', content: msg, tag: 'training', is_read: false }),
        ]);
        toast.success('Cardio adjusted ✓');
      } else if (rec.action === 'message') {
        await base44.entities.Message.create({
          client_id: checkIn.client_id, client_name: checkIn.client_name,
          sender: 'coach', content: rec.actionData.content,
          tag: rec.actionData.tag || 'general', is_read: false,
        });
        toast.success('Message sent ✓');
      } else if (rec.action === 'maintain') {
        await base44.entities.CheckIn.update(checkIn.id, { coach_responded: true });
        toast.success('Marked reviewed ✓');
      }
      setApplied(true);
      onApplied?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-card transition-all',
      applied ? 'opacity-50' : 'hover:border-primary/20'
    )}>
      {/* priority dot */}
      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', styles.dot)} />

      {/* icon + text */}
      <span className="text-sm flex-shrink-0">{CATEGORY_ICONS[rec.category]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{rec.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{client?.name || checkIn.client_name}</p>
      </div>

      {/* apply */}
      <button
        onClick={handleApply}
        disabled={applied || applying}
        className={cn(
          'flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95',
          applied
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default'
            : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
        )}
      >
        {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : applied ? <Check className="w-3 h-3" /> : <><Zap className="w-3 h-3" />{rec.actionLabel}</>}
      </button>
    </div>
  );
}

export default function RecommendationsWidget({ clients, checkIns }) {
  // Build: latest check-in per client + cisByClient map
  const { topRecs, cisByClient, clientMap } = useMemo(() => {
    const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));
    const cisByClient = {};
    for (const ci of checkIns) {
      if (!cisByClient[ci.client_id]) cisByClient[ci.client_id] = [];
      cisByClient[ci.client_id].push(ci);
    }

    const allRecs = [];
    const seen = new Set();
    for (const ci of checkIns) {
      if (seen.has(ci.client_id)) continue;
      seen.add(ci.client_id);
      const clientCIs = cisByClient[ci.client_id] || [];
      const client = clientMap[ci.client_id];
      const recs = generateRecommendations(ci, client, clientCIs);
      recs.slice(0, 1).forEach(rec => allRecs.push({ rec, checkIn: ci, client }));
    }

    // Sort by priority globally
    const ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
    allRecs.sort((a, b) => ORDER[a.rec.priority] - ORDER[b.rec.priority]);

    return { topRecs: allRecs.slice(0, 5), cisByClient, clientMap };
  }, [clients, checkIns]);

  if (!topRecs.length) return null;

  const criticalCount = topRecs.filter(r => r.rec.priority === 'critical').length;
  const highCount = topRecs.filter(r => r.rec.priority === 'high').length;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <span className="font-heading font-bold text-sm">Recommended Actions</span>
          {(criticalCount > 0 || highCount > 0) && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30">
              {criticalCount + highCount} urgent
            </span>
          )}
        </div>
        <Link to="/checkin-review" className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-primary transition-colors font-medium">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* rows */}
      <div className="p-3 space-y-2">
        {topRecs.map(({ rec, checkIn, client }) => (
          <MiniRecRow
            key={`${rec.id}-${checkIn.id}`}
            rec={rec}
            checkIn={checkIn}
            client={client}
          />
        ))}
      </div>
    </div>
  );
}