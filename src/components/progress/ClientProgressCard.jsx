import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Scale, TrendingUp, TrendingDown, Minus, AlertTriangle, Lock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import ClientAnalyticsView from './ClientAnalyticsView';
import AdherenceScore from '../adherence/AdherenceScore';
import { averageAdherenceScore } from '@/lib/adherence';

const moodEmojis = { great: '😄', good: '🙂', okay: '😐', tired: '😴', stressed: '😰' };

function getTrend(checkIns, field) {
  const vals = checkIns.filter(ci => ci[field] != null).map(ci => ci[field]);
  if (vals.length < 2) return 'neutral';
  const first = vals[vals.length - 1];
  const last = vals[0];
  const diff = last - first;
  if (field === 'weight' || field === 'body_fat_pct') {
    return diff < -0.5 ? 'down-good' : diff > 0.5 ? 'up-bad' : 'neutral';
  }
  return diff > 0 ? 'up-good' : diff < 0 ? 'down-bad' : 'neutral';
}

function TrendIcon({ trend }) {
  if (trend === 'down-good' || trend === 'up-good') return <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />;
  if (trend === 'up-bad' || trend === 'down-bad') return <TrendingUp className="w-3.5 h-3.5 text-destructive" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

function detectPlateau(checkIns, field) {
  const recent = checkIns.filter(ci => ci[field] != null).slice(0, 4);
  if (recent.length < 3) return false;
  const daySpan = differenceInDays(new Date(recent[0].date), new Date(recent[recent.length - 1].date));
  if (daySpan < 10) return false;
  const vals = recent.map(ci => ci[field]);
  const range = Math.max(...vals) - Math.min(...vals);
  return range < 1.5;
}

export default function ClientProgressCard({ client, checkIns, showGraphs = true }) {
  const [expanded, setExpanded] = useState(false);
  const latest = checkIns[0];
  const weightTrend = getTrend(checkIns, 'weight');
  const bfTrend = getTrend(checkIns, 'body_fat_pct');
  const plateau = detectPlateau(checkIns, 'weight');

  return (
    <div className="bg-white border border-[#E7EAF3] rounded-2xl overflow-hidden transition-all hover:border-blue-200 shadow-sm">
      {/* Header row */}
      <button
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-[#F6F7FB] transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
          {client.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{client.name}</p>
            {plateau && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs gap-1">
                <AlertTriangle className="w-3 h-3" /> Plateau
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {checkIns.length} check-ins · Last: {latest ? format(new Date(latest.date), 'MMM d') : 'None'}
          </p>
        </div>

        {/* Adherence score — Pro+ only */}
        {showGraphs && (
          <div className="hidden sm:block mr-2">
            <AdherenceScore score={averageAdherenceScore(checkIns)} size="sm" showLabel={false} />
          </div>
        )}

        {/* Quick stats */}
        <div className="hidden sm:flex items-center gap-4 mr-4">
          {latest?.weight && (
            <div className="flex items-center gap-1.5 text-sm">
              <Scale className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{latest.weight} lbs</span>
              {showGraphs && <TrendIcon trend={weightTrend} />}
            </div>
          )}
          {showGraphs && latest?.body_fat_pct && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-[#6B7280] text-xs">BF%</span>
              <span>{latest.body_fat_pct}%</span>
              <TrendIcon trend={bfTrend} />
            </div>
          )}
          {showGraphs && latest?.mood && (
            <span className="text-lg">{moodEmojis[latest.mood]}</span>
          )}
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {/* Expanded Analytics */}
      {expanded && (
        <div className="border-t border-[#E7EAF3]">
          {showGraphs ? (
            <ClientAnalyticsView client={client} checkIns={checkIns} />
          ) : (
            <div className="p-5 space-y-3">
              {/* Basic: show recent weight + notes only */}
              {checkIns.slice(0, 5).map(ci => (
                <div key={ci.id} className="flex items-start gap-3 text-sm">
                  <span className="text-[#6B7280] text-xs w-20 flex-shrink-0 pt-0.5">{format(new Date(ci.date), 'MMM d')}</span>
                  <div className="flex-1">
                    {ci.weight && <span className="font-medium">{ci.weight} lbs</span>}
                    {ci.notes && <p className="text-[#6B7280] text-xs mt-0.5">{ci.notes}</p>}
                  </div>
                </div>
              ))}
              {checkIns.length === 0 && <p className="text-[#6B7280] text-sm">No check-ins yet.</p>}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E7EAF3] text-xs text-[#6B7280]">
                <Lock className="w-3.5 h-3.5" />
                Analytics graphs, trends & compliance charts available on Pro+.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}