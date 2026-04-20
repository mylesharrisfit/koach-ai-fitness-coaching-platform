import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { compositeAdherenceScore, scoreColor } from '@/lib/adherence';

function WeightArrow({ current, prev }) {
  if (!current || !prev) return null;
  const diff = (current - prev).toFixed(1);
  const n = Number(diff);
  if (n < 0) return <span className="text-emerald-400 flex items-center gap-0.5 text-[10px] font-bold"><TrendingDown className="w-3 h-3" />{diff}</span>;
  if (n > 0) return <span className="text-destructive flex items-center gap-0.5 text-[10px] font-bold"><TrendingUp className="w-3 h-3" />+{diff}</span>;
  return <span className="text-muted-foreground flex items-center gap-0.5 text-[10px]"><Minus className="w-3 h-3" />0</span>;
}

function MiniTrendBar({ checkIns }) {
  // Last 5 adherence scores as a sparkline-style bar
  const scores = checkIns.slice(0, 5).reverse().map(ci => compositeAdherenceScore([ci]));
  if (scores.every(s => s === null)) return null;
  return (
    <div className="flex items-end gap-0.5 h-5">
      {scores.map((s, i) => {
        const h = s !== null ? Math.max(4, Math.round((s / 100) * 20)) : 2;
        const color = s === null ? 'bg-secondary' : s >= 80 ? 'bg-emerald-400' : s >= 60 ? 'bg-amber-400' : 'bg-destructive';
        return <div key={i} className={cn('w-2 rounded-sm opacity-80', color)} style={{ height: `${h}px` }} />;
      })}
    </div>
  );
}

export default function ClientFeedbackHistory({ checkIns = [] }) {
  const [expanded, setExpanded] = useState(false);

  // Only check-ins with coach responses, sorted newest first
  const responded = checkIns
    .filter(ci => ci.coach_notes)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const all = checkIns.sort((a, b) => new Date(b.date) - new Date(a.date));
  const hasHistory = all.length > 0;

  if (!hasHistory) return null;

  const avgAdherence = compositeAdherenceScore(all.slice(0, 4));
  const weightPoints = all.filter(ci => ci.weight).slice(0, 5);
  const latestWeight = weightPoints[0]?.weight;
  const prevWeight = weightPoints[1]?.weight;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-2 group"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">
            History · {all.length} check-in{all.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Trend sparkline */}
          <MiniTrendBar checkIns={all} />
          {/* Weight */}
          {latestWeight && (
            <div className="flex items-center gap-1 text-xs">
              <span className="font-semibold tabular-nums">{latestWeight}<span className="text-muted-foreground font-normal"> lbs</span></span>
              <WeightArrow current={latestWeight} prev={prevWeight} />
            </div>
          )}
          {/* Adherence avg */}
          {avgAdherence !== null && (
            <span className={cn('text-xs font-bold tabular-nums', scoreColor(avgAdherence))}>
              {avgAdherence}%
            </span>
          )}
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          }
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {responded.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No coach responses yet</p>
          ) : (
            responded.map((ci, i) => {
              const score = compositeAdherenceScore([ci]);
              const prevCi = all[all.indexOf(ci) + 1];
              return (
                <div key={ci.id} className="bg-secondary/40 rounded-xl p-3 space-y-1.5">
                  {/* Date + metrics row */}
                  <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                      {format(parseISO(ci.date), 'MMM d, yyyy')}
                    </span>
                    <div className="flex items-center gap-2.5">
                      {ci.weight && (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-semibold tabular-nums">{ci.weight} lbs</span>
                          <WeightArrow current={ci.weight} prev={prevCi?.weight} />
                        </div>
                      )}
                      {score !== null && (
                        <span className={cn('text-[11px] font-bold', scoreColor(score))}>{score}% adh.</span>
                      )}
                      {ci.compliance_training != null && (
                        <span className="text-[10px] text-muted-foreground">
                          T:{ci.compliance_training}% N:{ci.compliance_nutrition ?? '?'}%
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Coach response */}
                  <p className="text-xs text-foreground leading-relaxed line-clamp-3">
                    {ci.coach_notes}
                  </p>
                </div>
              );
            })
          )}

          {/* Weeks with no response */}
          {all.length > responded.length && (
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              +{all.length - responded.length} check-in{all.length - responded.length !== 1 ? 's' : ''} without a response
            </p>
          )}
        </div>
      )}
    </div>
  );
}