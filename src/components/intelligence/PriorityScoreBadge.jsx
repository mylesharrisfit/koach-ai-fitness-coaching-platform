import React from 'react';

export default function PriorityScoreBadge({ score }) {
  if (!score && score !== 0) return null;

  const color = score >= 7
    ? { bg: 'var(--tc-destructive)', text: 'var(--tc-destructive)', border: 'var(--tc-destructive)' }
    : score >= 4
    ? { bg: 'var(--tc-warning)', text: 'var(--kc-ea580c)', border: 'var(--tc-warning)' }
    : { bg: 'var(--tc-success)', text: 'var(--tc-success)', border: 'var(--tc-success)' };

  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border tabular-nums"
      style={color}
      title={`Coaching Priority Score: ${score}/10`}
    >
      {score >= 7 ? '🔴' : score >= 4 ? '🟡' : '🟢'} {score}
    </span>
  );
}