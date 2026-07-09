/**
 * AIReplyPanel — rich AI suggestion card that appears above the compose bar
 * Replaces the old inline AIReplyPreview in ComposeBar
 */
import React, { useState } from 'react';
import { Sparkles, X, Check, Edit3, RotateCw, ChevronDown, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONES } from '@/lib/aiMessageAssistant';

export default function AIReplyPanel({
  suggestion,       // { message, tone_label, context_reason }
  loading,
  onUse,
  onEditFirst,
  onRetry,
  onDismiss,
  onChangeTone,
  currentTone = 'auto',
}) {
  const [showTones, setShowTones] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (suggestion?.message) {
      navigator.clipboard.writeText(suggestion.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-3 mb-2 rounded-2xl border border-primary/20 overflow-hidden shadow-md"
      style={{ background: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--ai)) 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-primary/10">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
          <span className="text-[11px] font-bold text-primary">AI Suggested Reply</span>
          {suggestion?.tone_label && !loading && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              {suggestion.tone_label}
            </span>
          )}
        </div>
        <button onClick={onDismiss} className="p-0.5 rounded-full hover:bg-black/10 transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5">
        {loading ? (
          <div className="flex items-center gap-2.5 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Analyzing conversation…</p>
              <p className="text-[10px] text-muted-foreground">Reading check-ins, messages & context</p>
            </div>
          </div>
        ) : suggestion?.message ? (
          <>
            {/* Message preview */}
            <div className="bg-white/80 rounded-xl border border-white px-3 py-2.5 mb-2.5 shadow-sm">
              <p className="text-xs text-foreground leading-relaxed">{suggestion.message}</p>
              {suggestion.context_reason && (
                <p className="text-[10px] text-muted-foreground mt-1.5 italic">💡 {suggestion.context_reason}</p>
              )}
            </div>

            {/* Action row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Use This */}
              <button
                onClick={() => onUse(suggestion.message)}
                className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Check className="w-3 h-3" /> Use This
              </button>

              {/* Edit First */}
              <button
                onClick={() => onEditFirst(suggestion.message)}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 bg-card border border-primary/25 text-primary rounded-full hover:bg-primary/5 transition-colors"
              >
                <Edit3 className="w-3 h-3" /> Edit First
              </button>

              {/* Try Again */}
              <button
                onClick={onRetry}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:bg-muted transition-colors"
              >
                <RotateCw className="w-3 h-3" /> Try Again
              </button>

              {/* Change Tone */}
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowTones(v => !v)}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 bg-card border border-border text-muted-foreground rounded-full hover:bg-muted transition-colors"
                >
                  <Zap className="w-3 h-3" /> Tone <ChevronDown className="w-2.5 h-2.5" />
                </button>
                {showTones && (
                  <div className="absolute bottom-full mb-1 right-0 bg-card border border-border rounded-xl shadow-xl p-1.5 w-52 z-30">
                    {TONES.filter(t => t.key !== 'auto').map(t => (
                      <button
                        key={t.key}
                        onClick={() => { onChangeTone(t.key); setShowTones(false); }}
                        className={cn(
                          'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-primary/5 transition-colors text-left',
                          currentTone === t.key ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'
                        )}
                      >
                        <span>{t.emoji}</span> {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dismiss link */}
            <div className="flex justify-end mt-1.5">
              <button onClick={onDismiss} className="text-[10px] text-muted-foreground hover:text-muted-foreground underline underline-offset-2">
                Dismiss
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}