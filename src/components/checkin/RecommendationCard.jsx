import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Check, Zap, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRIORITY_STYLES, CATEGORY_ICONS } from '@/lib/decisionEngine';
import { applyRecommendation, getConfirmText } from '@/lib/applyRecommendation';

export default function RecommendationCard({ recommendation: rec, checkIn, client, onApplied }) {
  const [stage, setStage] = useState('idle'); // idle | confirm | applying | done
  const [successMsg, setSuccessMsg] = useState('');

  const styles = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.medium;
  const confirmText = getConfirmText(rec);

  const handleApplyClick = () => {
    if (stage !== 'idle') return;
    setStage('confirm');
  };

  const handleConfirm = async () => {
    setStage('applying');
    try {
      const msg = await applyRecommendation(rec, checkIn, client);
      setSuccessMsg(msg);
      setStage('done');
      toast.success(msg);
      onApplied?.(rec);
    } catch (err) {
      toast.error('Failed: ' + err.message);
      setStage('idle');
    }
  };

  const handleCancel = () => setStage('idle');

  return (
    <div className={cn(
      'relative bg-card border rounded-xl overflow-hidden transition-all duration-200',
      stage === 'done' ? 'opacity-60' : 'hover:border-primary/20',
      stage === 'confirm' && 'border-primary/30 ring-1 ring-primary/20'
    )}>
      {/* Priority bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', styles.bar)} />

      <div className="pl-4 pr-3 py-3 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="text-lg flex-shrink-0 mt-0.5">
            {CATEGORY_ICONS[rec.category] || '⚡'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-xs font-bold">{rec.title}</span>
              <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border capitalize', styles.badge)}>
                {rec.priority}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>
          </div>

          {/* Apply button — hidden during confirm */}
          {stage === 'idle' && (
            <button
              onClick={handleApplyClick}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 active:scale-[0.95] transition-all whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5" /> {rec.actionLabel}
            </button>
          )}

          {stage === 'applying' && (
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Applying…
            </div>
          )}

          {stage === 'done' && (
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Check className="w-3.5 h-3.5" /> Done
            </div>
          )}
        </div>

        {/* Confirmation panel */}
        {stage === 'confirm' && (
          <div className="bg-secondary/40 rounded-lg px-3 py-2.5 space-y-2.5 fade-up">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground leading-snug">{confirmText}</p>
            </div>
            {/* Preview message content for 'message' actions */}
            {rec.action === 'message' && rec.actionData?.content && (
              <p className="text-[11px] text-muted-foreground italic border-l-2 border-primary/30 pl-2 leading-relaxed line-clamp-3">
                "{rec.actionData.content}"
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold active:scale-[0.97] transition-all"
              >
                <Check className="w-3.5 h-3.5" /> Confirm
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary border border-border text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-[0.97] transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}