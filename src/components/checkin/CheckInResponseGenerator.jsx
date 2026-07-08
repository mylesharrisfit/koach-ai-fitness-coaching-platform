/**
 * CheckInResponseGenerator — AI-powered check-in response button + preview
 * Shown in CheckInReviewDrawer / CheckInDetailDrawer
 */
import React, { useState } from 'react';
import { Sparkles, Loader2, Check, Edit3, RotateCw, ChevronDown, ChevronUp, Target, Star } from 'lucide-react';
import { generateCheckInResponse } from '@/lib/aiMessageAssistant';

export default function CheckInResponseGenerator({ client, checkIn, previousCheckIns = [], onInsert }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const generate = async () => {
    setLoading(true);
    setResult(null);
    setExpanded(true);
    const res = await generateCheckInResponse(client, checkIn, previousCheckIns);
    setResult(res);
    setLoading(false);
  };

  const handleRetry = async () => {
    setRetryCount(r => r + 1);
    await generate();
  };

  if (!client || !checkIn) return null;

  return (
    <div className="rounded-xl border border-primary/20 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #EEF4FF, #F5F3FF)' }}>
      {/* Trigger / header */}
      <button
        onClick={result ? () => setExpanded(v => !v) : generate}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:opacity-90 transition-opacity"
      >
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-primary">
            {loading ? 'Generating response…' : result ? 'AI Response Ready' : '✨ Generate AI Response'}
          </p>
          <p className="text-[11px] text-[#6B7280]">
            {loading ? 'Analyzing check-in data…' : result ? 'Tap to expand, edit & send' : 'Personalized based on all check-in data'}
          </p>
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
        ) : result ? (
          expanded ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />
        ) : null}
      </button>

      {/* Result panel */}
      {expanded && (loading || result) && (
        <div className="border-t border-primary/10 px-4 py-3 space-y-3 bg-white/50">
          {loading ? (
            <div className="flex items-center gap-2 py-1">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <p className="text-xs text-[#6B7280]">Reading check-in, trends & context…</p>
            </div>
          ) : result ? (
            <>
              {/* AI response text */}
              <div className="bg-white rounded-xl border border-white shadow-sm px-3.5 py-3">
                <p className="text-xs text-[#1F2A44] leading-relaxed whitespace-pre-wrap">{result.response}</p>
              </div>

              {/* Highlights */}
              {result.highlights?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" /> What went well
                  </p>
                  <div className="space-y-1">
                    {result.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        <p className="text-[11px] text-[#374151]">{h}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coaching points */}
              {result.coaching_points?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Target className="w-3 h-3 text-blue-400" /> Coaching points
                  </p>
                  <div className="space-y-1">
                    {result.coaching_points.map((p, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                        <p className="text-[11px] text-[#374151]">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onInsert(result.response)}
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Check className="w-3 h-3" /> Use This
                </button>
                <button
                  onClick={() => onInsert(result.response, true)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 bg-white border border-primary/25 text-primary rounded-full hover:bg-primary/5 transition-colors"
                >
                  <Edit3 className="w-3 h-3" /> Edit First
                </button>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 bg-white border border-gray-200 text-[#6B7280] rounded-full hover:bg-gray-50 transition-colors ml-auto"
                >
                  <RotateCw className="w-3 h-3" /> Regenerate
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}