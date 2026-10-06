import React from 'react';
import { cn } from '@/lib/utils';

/** Coaching priority (0–10): red when the client needs you now. */
export default function PriorityScoreBadge({ score }) {
  if (!score && score !== 0) return null;

  const tone = score >= 7
    ? 'bg-destructive/10 text-destructive'
    : score >= 4
    ? 'bg-warning-soft text-warning'
    : 'bg-secondary text-muted-foreground';

  return (
    <span
      className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[12px] font-semibold tabular-nums', tone)}
      title={`Coaching priority ${score} of 10`}
    >
      {score}
    </span>
  );
}
