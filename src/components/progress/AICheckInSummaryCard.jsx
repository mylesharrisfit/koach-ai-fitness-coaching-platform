import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

/* Generates a fast post-check-in summary card for the coach review panel */
function buildPrompt(client, checkIn, prevCheckIn, allCIs) {
  const weightDelta = checkIn.weight && prevCheckIn?.weight
    ? (checkIn.weight - prevCheckIn.weight).toFixed(1)
    : null;
  const totalLost = allCIs.length >= 2
    ? (allCIs[allCIs.length - 1].weight - allCIs[0].weight).toFixed(1)
    : null;

  const moodTrend = allCIs.slice(-3).map(ci => ({ great: 5, good: 4, okay: 3, tired: 2, stressed: 1 }[ci.mood] || 3));
  const moodDirection = moodTrend.length >= 2
    ? (moodTrend[moodTrend.length - 1] > moodTrend[0] ? 'improving' : moodTrend[moodTrend.length - 1] < moodTrend[0] ? 'declining' : 'stable')
    : 'insufficient data';

  return `You are an AI fitness coach generating a quick check-in summary for a coach dashboard.
Be concise, specific, and data-driven. Write like a smart colleague briefing a coach.

CLIENT: ${client?.name || 'Client'}
GOAL: ${client?.goal?.replace(/_/g, ' ') || 'general fitness'}
TOTAL CHECK-INS: ${allCIs.length}

THIS CHECK-IN (${checkIn.date}):
- Weight: ${checkIn.weight ? `${checkIn.weight} lbs` : 'not recorded'}${weightDelta ? ` (${weightDelta > 0 ? '+' : ''}${weightDelta} from last week)` : ''}
- Total weight change: ${totalLost ? `${totalLost} lbs` : 'n/a'}
- Training compliance: ${checkIn.compliance_training ?? 'n/a'}%
- Nutrition compliance: ${checkIn.compliance_nutrition ?? 'n/a'}%
- Mood: ${checkIn.mood || 'not recorded'} (trend: ${moodDirection})
- Energy: ${checkIn.energy_level ?? 'n/a'}/10
- Stress: ${checkIn.stress_level ?? 'n/a'}/10
- Sleep: ${checkIn.sleep_hours ?? 'n/a'} hrs
- Client notes: ${checkIn.notes || 'none'}

${prevCheckIn ? `PREVIOUS CHECK-IN: weight ${prevCheckIn.weight ?? 'n/a'} lbs, training ${prevCheckIn.compliance_training ?? 'n/a'}%, nutrition ${prevCheckIn.compliance_nutrition ?? 'n/a'}%` : 'FIRST CHECK-IN'}

Generate JSON:
{
  "summary": "3-4 sentence plain English summary of this check-in for the coach. Name the client. Note the most important data points, any positive changes, and one concern if present.",
  "week_vs_prev": "one sentence comparing this week to last week (or note it's the first)",
  "coaching_focus": "One sentence: the single most important thing for the coach to address this week",
  "sentiment": "great|good|okay|concerning",
  "key_wins": ["win 1", "win 2"],
  "red_flags": ["flag 1 if present, else leave empty array"]
}`;
}

const SENTIMENT_CONFIG = {
  great: { border: 'border-emerald-300', bg: 'bg-emerald-50', dot: 'bg-emerald-500', label: '🟢 Strong week' },
  good: { border: 'border-blue-300', bg: 'bg-blue-50', dot: 'bg-blue-500', label: '🔵 Good week' },
  okay: { border: 'border-amber-300', bg: 'bg-amber-50', dot: 'bg-amber-500', label: '🟡 Average week' },
  concerning: { border: 'border-red-300', bg: 'bg-red-50', dot: 'bg-red-500', label: '🔴 Needs attention' },
};

export default function AICheckInSummaryCard({ client, checkIn, allClientCIs = [], autoGenerate = true }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const sorted = [...allClientCIs].filter(ci => ci.date).sort((a, b) => new Date(a.date) - new Date(b.date));
  const prevCheckIn = sorted.length >= 2 ? sorted[sorted.length - 2] : null;

  const generate = async () => {
    if (!checkIn || allClientCIs.length < 1) return;
    setLoading(true);
    setSummary(null);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(client, checkIn, prevCheckIn, sorted),
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          week_vs_prev: { type: 'string' },
          coaching_focus: { type: 'string' },
          sentiment: { type: 'string' },
          key_wins: { type: 'array', items: { type: 'string' } },
          red_flags: { type: 'array', items: { type: 'string' } },
        }
      }
    });
    setSummary(result);
    setLoading(false);
  };

  useEffect(() => {
    if (autoGenerate && checkIn && allClientCIs.length >= 1) {
      generate();
    }
  }, [checkIn?.id]);

  const cfg = SENTIMENT_CONFIG[summary?.sentiment] || SENTIMENT_CONFIG.okay;

  return (
    <div className={cn('rounded-2xl border p-4 space-y-3', summary ? `${cfg.border} ${cfg.bg}` : 'border-[#E7EAF3] bg-white')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">AI Check-in Summary</p>
        </div>
        <div className="flex items-center gap-2">
          {summary && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/70 border border-current/20">
              {cfg.label}
            </span>
          )}
          <button onClick={generate} disabled={loading} className="p-1 rounded-lg hover:bg-black/5 transition-colors text-[#6B7280]">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-xs text-[#6B7280]">Analyzing check-in data...</span>
        </div>
      )}

      {summary && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-[#374151] leading-relaxed">{summary.summary}</p>

          {summary.week_vs_prev && (
            <p className="text-xs text-[#6B7280] italic">{summary.week_vs_prev}</p>
          )}

          {summary.coaching_focus && (
            <div className="flex items-start gap-2 bg-white/80 rounded-xl p-2.5">
              <span className="text-primary text-xs font-bold flex-shrink-0">🎯 Focus:</span>
              <p className="text-xs text-[#374151] font-semibold">{summary.coaching_focus}</p>
            </div>
          )}

          {summary.key_wins?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {summary.key_wins.map((w, i) => (
                <span key={i} className="text-[11px] font-medium px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">✓ {w}</span>
              ))}
            </div>
          )}

          {summary.red_flags?.filter(Boolean).length > 0 && (
            <div className="space-y-1">
              {summary.red_flags.filter(Boolean).map((f, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                  <span className="flex-shrink-0">⚠️</span> {f}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !summary && (
        <button onClick={generate} className="w-full text-xs text-primary font-semibold py-2 border border-dashed border-primary/30 rounded-xl hover:bg-primary/5 transition-colors">
          ✨ Generate AI Summary
        </button>
      )}
    </div>
  );
}