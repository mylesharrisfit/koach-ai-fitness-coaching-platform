import React from 'react';
import { averageAdherenceScore, calculateStreak, detectEarnedBadges, scoreColor, checkInScore } from '@/lib/adherence';
import { BADGE_CONFIG } from '@/lib/badges';
import { Flame, Moon, Dumbbell, Salad, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdherenceScore from './AdherenceScore';
import BadgeRow from './BadgeRow';

function MetricBar({ label, value, icon: Icon, color }) {
  if (value == null) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[#374151]">
          <Icon className={cn('w-3.5 h-3.5', color)} />
          <span>{label}</span>
        </div>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', value >= 75 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-destructive')}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function ScoreTrend({ checkIns }) {
  const scores = checkIns.slice(0, 4).map(checkInScore).filter(s => s !== null);
  if (scores.length < 2) return null;
  const diff = scores[0] - scores[scores.length - 1];
  if (Math.abs(diff) < 3) return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  return diff > 0
    ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
    : <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
}

export default function AdherencePanel({ client, checkIns, badges = [] }) {
  const score = averageAdherenceScore(checkIns, 4);
  const streak = calculateStreak(checkIns);
  const autoEarned = detectEarnedBadges(checkIns);
  const allBadgeKeys = [...new Set([...badges.map(b => b.badge_key), ...autoEarned])];
  const latest = checkIns[0];

  const isAlert = score !== null && score < 50;

  return (
    <div className={cn(
      'rounded-xl border p-4 space-y-4',
      isAlert ? 'bg-red-50 border-red-100' : 'bg-white border-[#E7EAF3]'
    )}>
      {/* Top row: score + streak + trend */}
      <div className="flex items-center gap-4">
        <AdherenceScore score={score} size="md" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Adherence Score</span>
            <ScoreTrend checkIns={checkIns} />
            {isAlert && (
              <span className="text-xs text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded-full">⚠ Alert</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-[#374151]">
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-medium text-[#1F2A44]">{streak}</span> check-in streak
            </div>
          </div>
        </div>
      </div>

      {/* Metric bars */}
      {latest && (
        <div className="space-y-2.5">
          <MetricBar label="Training" value={latest.compliance_training} icon={Dumbbell} color="text-primary" />
          <MetricBar label="Nutrition" value={latest.compliance_nutrition} icon={Salad} color="text-accent" />
          {latest.sleep_hours != null && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#374151]">
                  <Moon className="w-3.5 h-3.5 text-violet-400" />
                  <span>Sleep</span>
                </div>
                <span className="font-medium">{latest.sleep_hours}h</span>
              </div>
              <div className="h-1.5 bg-[#E7EAF3] rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', latest.sleep_hours >= 7 ? 'bg-emerald-500' : latest.sleep_hours >= 6 ? 'bg-amber-400' : 'bg-red-400')}
                  style={{ width: `${Math.min(100, (latest.sleep_hours / 9) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Badges */}
      <div>
        <p className="text-xs text-[#374151] mb-2 font-medium">Achievements</p>
        <BadgeRow earnedKeys={allBadgeKeys} max={5} />
      </div>
    </div>
  );
}