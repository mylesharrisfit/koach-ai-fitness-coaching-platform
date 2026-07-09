/**
 * TopRecommendationBadge
 * Shows the single highest-priority coaching recommendation for a client.
 * Compact pill for list rows; full card with confirm flow for expanded views.
 */
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Check, Zap, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTopRecommendation, PRIORITY_STYLES, CATEGORY_ICONS } from '@/lib/decisionEngine';
import { applyRecommendation, getConfirmText } from '@/lib/applyRecommendation';

export default function TopRecommendationBadge({ checkIn, client, allClientCIs = [], onApply, compact = false }) {
  const [stage, setStage] = useState('idle'); // idle | confirm | applying | done
  const [successMsg, setSuccessMsg] = useState('');

  const rec = getTopRecommendation(checkIn, client, allClientCIs);
  if (!rec) return null;

  const styles = PRIORITY_STYLES[rec.priority];
  const confirmText = getConfirmText(rec);

  const handleApplyClick = (e) => {
    e.stopPropagation();
    if (stage !== 'idle') return;
    setStage('confirm');
  };

  const handleConfirm = async (e) => {
    e?.stopPropagation();
    setStage('applying');
    try {
      const msg = await applyRecommendation(rec, checkIn, client);
      setSuccessMsg(msg);
      setStage('done');
      toast.success(msg);
      onApply?.();
    } catch (err) {
      toast.error(err.message);
      setStage('idle');
    }
  };

  const handleCancel = (e) => {
    e?.stopPropagation();
    setStage('idle');
  };

  /* ── Compact pill (for collapsed client card rows) ── */
  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex-wrap',
        stage === 'done' ? 'opacity-60 bg-success/8 border-success/20 text-success' : styles.badge
      )}>
        <span className="flex-shrink-0">{CATEGORY_ICONS[rec.category]}</span>
        <span className="truncate max-w-[150px]">
          {stage === 'done' ? successMsg : rec.title}
        </span>

        {stage === 'idle' && (
          <button
            onClick={handleApplyClick}
            className="flex-shrink-0 flex items-center gap-0.5 ml-auto opacity-80 hover:opacity-100 transition-opacity"
          >
            <Zap className="w-3 h-3" />
          </button>
        )}
        {stage === 'applying' && <Loader2 className="w-3 h-3 animate-spin ml-auto flex-shrink-0" />}
        {stage === 'done' && <Check className="w-3 h-3 ml-auto flex-shrink-0" />}

        {/* Inline confirm for compact */}
        {stage === 'confirm' && (
          <div className="w-full flex items-center gap-1.5 mt-1 pt-1 border-t border-current/20">
            <p className="text-[10px] flex-1 opacity-80 leading-tight">{confirmText}</p>
            <button
              onClick={handleConfirm}
              className="flex-shrink-0 flex items-center gap-0.5 px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-bold active:scale-95"
            >
              <Check className="w-2.5 h-2.5" /> Yes
            </button>
            <button
              onClick={handleCancel}
              className="flex-shrink-0 px-2 py-1 rounded bg-secondary border border-border text-[10px] font-semibold text-muted-foreground active:scale-95"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Full card (for expanded views / FastReview) ── */
  return (
    <div className={cn(
      'rounded-xl border transition-all',
      stage === 'done' ? 'opacity-60 bg-card/40 border-border' : styles.badge,
      stage === 'confirm' && 'ring-1 ring-current/30'
    )}>
      {/* Main row */}
      <div className="flex items-start gap-2.5 px-4 py-3">
        <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', styles.dot)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm">{CATEGORY_ICONS[rec.category]}</span>
            <p className="text-sm font-bold leading-tight">{rec.title}</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{rec.reason}</p>
        </div>
      </div>

      {/* Action area */}
      <div className="px-4 pb-3">
        {stage === 'idle' && (
          <button
            onClick={handleApplyClick}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border bg-card/60 hover:bg-card border-current/30 transition-all active:scale-[0.98]"
          >
            <Zap className="w-3.5 h-3.5" /> {rec.actionLabel}
          </button>
        )}

        {stage === 'confirm' && (
          <div className="space-y-2.5 fade-up">
            <div className="flex items-start gap-2 bg-card/40 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-70" />
              <p className="text-xs leading-snug">{confirmText}</p>
            </div>
            {rec.action === 'message' && rec.actionData?.content && (
              <p className="text-[11px] text-muted-foreground italic border-l-2 border-current/30 pl-2 leading-relaxed line-clamp-3">
                "{rec.actionData.content}"
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold active:scale-[0.97] transition-all"
              >
                <Check className="w-3.5 h-3.5" /> Confirm & Apply
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center justify-center px-3 py-2 rounded-lg bg-card border border-border text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-[0.97] transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {stage === 'applying' && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Applying…
          </div>
        )}

        {stage === 'done' && (
          <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-success">
            <Check className="w-3.5 h-3.5" /> {successMsg}
          </div>
        )}
      </div>
    </div>
  );
}