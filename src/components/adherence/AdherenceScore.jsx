import React from 'react';
import { scoreColor, scoreBg, scoreLabel } from '@/lib/adherence';
import { cn } from '@/lib/utils';

export default function AdherenceScore({ score, size = 'md', showLabel = true }) {
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

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn('rounded-full border-2 flex items-center justify-center', s.outer, bg)}>
        <span className={cn('font-heading font-bold', s.text, color)}>
          {score !== null ? score : '–'}
        </span>
      </div>
      {showLabel && (
        <span className={cn('font-medium', s.label, color)}>{label}</span>
      )}
    </div>
  );
}