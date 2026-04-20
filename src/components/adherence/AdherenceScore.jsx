import React from 'react';
import { scoreColor, scoreBg, scoreLabel } from '@/lib/adherence';
import { cn } from '@/lib/utils';

export default function AdherenceScore({ score, size = 'md', showLabel = true }) {
  // Pill/badge mode for inline use in cards
  if (size === 'pill') {
    const color = score === null ? 'bg-secondary text-muted-foreground' : score >= 75 ? 'bg-emerald-500/15 text-emerald-400' : score >= 50 ? 'bg-amber-500/15 text-amber-400' : 'bg-destructive/15 text-destructive';
    const label = scoreLabel(score);
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full', color)}>
        {score !== null ? score : '–'}{score !== null ? '%' : ''} {showLabel && <span className="font-normal opacity-70">· {label}</span>}
      </span>
    );
  }

  const ring = score === null ? 0 : Math.round((score / 100) * 100);
  const sizes = {
    sm: { outer: 'w-10 h-10', text: 'text-xs', label: 'text-[10px]' },
    md: { outer: 'w-14 h-14', text: 'text-sm', label: 'text-xs' },
    lg: { outer: 'w-20 h-20', text: 'text-xl', label: 'text-xs' },
  };
  const s = sizes[size];
  const color = scoreColor(score);
  const bg = scoreBg(score);
  const label = scoreLabel(score);

  const pct = score !== null ? score : 0;
  const r = size === 'lg' ? 34 : size === 'md' ? 24 : 17;
  const circ = 2 * Math.PI * r;
  const svgSize = size === 'lg' ? 80 : size === 'md' ? 56 : 40;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={svgSize/2} cy={svgSize/2} r={r} fill="none" stroke="currentColor" strokeWidth={size === 'lg' ? 6 : 4} className="text-secondary" />
          <circle
            cx={svgSize/2} cy={svgSize/2} r={r} fill="none"
            strokeWidth={size === 'lg' ? 6 : 4}
            stroke={`hsl(var(--${score >= 80 ? 'accent' : score >= 60 ? 'chart-4' : 'destructive'}))`}
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