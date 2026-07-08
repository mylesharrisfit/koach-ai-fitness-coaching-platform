import React from 'react';
import { scoreColor, scoreLabel } from '@/lib/adherence';
import { cn } from '@/lib/utils';

/** Colour for SVG stroke — green 80+, yellow 60–79, red <60 */
function strokeHsl(score) {
  if (score === null || score === undefined) return 'hsl(var(--muted-foreground))';
  if (score >= 80) return 'hsl(var(--accent))';
  if (score >= 60) return 'hsl(var(--chart-4))';
  return 'hsl(var(--destructive))';
}

/** Inline pill badge */
export function AdherencePill({ score, showLabel = true }) {
  const color = score === null
    ? 'bg-secondary text-muted-foreground'
    : score >= 80 ? 'bg-emerald-500/15 text-emerald-400'
    : score >= 60 ? 'bg-amber-500/15 text-amber-400'
    : 'bg-destructive/15 text-destructive';

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full', color)}>
      {score !== null ? `${score}%` : '–'}
      {showLabel && score !== null && (
        <span className="font-normal opacity-70">· {scoreLabel(score)}</span>
      )}
    </span>
  );
}

/** Horizontal bar breakdown showing each component */
export function AdherenceBreakdown({ breakdown }) {
  if (!breakdown) return null;
  const items = [breakdown.training, breakdown.nutrition, breakdown.sleep, breakdown.checkin];
  return (
    <div className="space-y-1.5">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground w-16 flex-shrink-0">{item.label}</span>
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700',
                item.score === null ? 'w-0' :
                item.score >= 80 ? 'bg-emerald-400' :
                item.score >= 60 ? 'bg-amber-400' : 'bg-destructive'
              )}
              style={{ width: item.score !== null ? `${item.score}%` : '0%' }}
            />
          </div>
          <span className={cn('text-[11px] font-bold w-7 text-right tabular-nums', scoreColor(item.score))}>
            {item.score !== null ? `${item.score}` : '–'}
          </span>
          <span className="text-[10px] text-muted-foreground">{item.weight}%</span>
        </div>
      ))}
    </div>
  );
}

/** Main circular gauge */
export default function AdherenceScore({ score, size = 'md', showLabel = true }) {
  // Pill/badge mode
  if (size === 'pill') {
    return <AdherencePill score={score} showLabel={showLabel} />;
  }

  const sizes = {
    sm: { outer: 'w-10 h-10', text: 'text-xs', label: 'text-[10px]', r: 17, svgSize: 40, sw: 4 },
    md: { outer: 'w-14 h-14', text: 'text-sm', label: 'text-xs',     r: 24, svgSize: 56, sw: 4 },
    lg: { outer: 'w-20 h-20', text: 'text-xl', label: 'text-xs',     r: 34, svgSize: 80, sw: 6 },
  };
  const s = sizes[size] || sizes.md;
  const color = scoreColor(score);
  const label = scoreLabel(score);
  const pct = score !== null ? score : 0;
  const circ = 2 * Math.PI * s.r;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: s.svgSize, height: s.svgSize }}>
        <svg width={s.svgSize} height={s.svgSize} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={s.svgSize / 2} cy={s.svgSize / 2} r={s.r}
            fill="none" strokeWidth={s.sw}
            stroke="currentColor" className="text-secondary"
          />
          <circle
            cx={s.svgSize / 2} cy={s.svgSize / 2} r={s.r}
            fill="none" strokeWidth={s.sw}
            stroke={strokeHsl(score)}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-heading font-bold stat-number', s.text, color)}>
            {score !== null ? score : '–'}
          </span>
        </div>
      </div>
      {showLabel && <span className={cn('font-semibold', s.label, color)}>{label}</span>}
    </div>
  );
}