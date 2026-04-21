import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Check, Zap, ChevronRight, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateRecommendations, PRIORITY_STYLES, CATEGORY_ICONS } from '@/lib/decisionEngine';
import { applyRecommendation, getConfirmText } from '@/lib/applyRecommendation';
import { Link } from 'react-router-dom';

function MiniRecRow({ rec, checkIn, client }) {
  const [stage, setStage] = useState('idle'); // idle | confirm | applying | done
  const [successMsg, setSuccessMsg] = useState('');
  const styles = PRIORITY_STYLES[rec.priority];
  const confirmText = getConfirmText(rec);

  const handleApplyClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (stage !== 'idle') return;
    setStage('confirm');
  };

  const handleConfirm = async (e) => {
    e.stopPropagation();
    setStage('applying');
    try {
      const msg = await applyRecommendation(rec, checkIn, client);
      setSuccessMsg(msg);
      setStage('done');
      toast.success(msg);
    } catch (err) {
      toast.error(err.message);
      setStage('idle');
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setStage('idle');
  };

  return (
    <div className={cn(
      'rounded-xl border bg-card transition-all',
      stage === 'done' ? 'opacity-50' : 'hover:border-primary/20',
      stage === 'confirm' && 'border-primary/30 ring-1 ring-primary/15'
    )}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', styles.dot)} />
        <span className="text-sm flex-shrink-0">{CATEGORY_ICONS[rec.category]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{rec.title}</p>
          <p className="text-[11px] text-muted-foreground truncate">{client?.name || checkIn.client_name}</p>
        </div>

        {stage === 'idle' && (
          <button
            onClick={handleApplyClick}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 active:scale-95 transition-all whitespace-nowrap"
          >
            <Zap className="w-3 h-3" /> {rec.actionLabel}
          </button>
        )}
        {stage === 'applying' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />}
        {stage === 'done' && (
          <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-400">
            <Check className="w-3 h-3" /> Done
          </span>
        )}
        {stage === 'confirm' && (
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold active:scale-95 transition-all"
            >
              <Check className="w-3 h-3" /> Yes
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Confirm details row */}
      {stage === 'confirm' && (
        <div className="px-3 pb-2.5 fade-up">
          <div className="flex items-start gap-1.5 bg-secondary/40 rounded-lg px-2.5 py-2">
            <AlertCircle className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-foreground leading-snug">{confirmText}</p>
          </div>
          {rec.action === 'message' && rec.actionData?.content && (
            <p className="mt-1.5 text-[10px] text-muted-foreground italic border-l-2 border-primary/30 pl-2 leading-relaxed line-clamp-2">
              "{rec.actionData.content}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecommendationsWidget({ clients, checkIns }) {
  const { topRecs } = useMemo(() => {
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
      if (recs[0]) allRecs.push({ rec: recs[0], checkIn: ci, client });
    }

    const ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
    allRecs.sort((a, b) => ORDER[a.rec.priority] - ORDER[b.rec.priority]);

    return { topRecs: allRecs.slice(0, 5) };
  }, [clients, checkIns]);

  if (!topRecs.length) return null;

  const urgentCount = topRecs.filter(r => r.rec.priority === 'critical' || r.rec.priority === 'high').length;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <span className="font-heading font-bold text-sm">Recommended Actions</span>
          {urgentCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30">
              {urgentCount} urgent
            </span>
          )}
        </div>
        <Link to="/checkin-review" className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-primary transition-colors font-medium">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="p-3 space-y-2">
        {topRecs.map(({ rec, checkIn, client }) => (
          <MiniRecRow key={`${rec.id}-${checkIn.id}`} rec={rec} checkIn={checkIn} client={client} />
        ))}
      </div>
    </div>
  );
}