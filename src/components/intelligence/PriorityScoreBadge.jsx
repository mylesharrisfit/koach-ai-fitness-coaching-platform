import React from 'react';

export default function PriorityScoreBadge({ score }) {
  if (!score && score !== 0) return null;

  const color = score >= 7
    ? { bg: 'rgb(var(--destructive))', text: 'rgb(var(--destructive))', border: 'rgb(var(--destructive))' }
    : score >= 4
    ? { bg: 'rgb(var(--warning))', text: '#ea580c', border: 'rgb(var(--warning))' }
    : { bg: 'rgb(var(--success))', text: 'rgb(var(--success))', border: 'rgb(var(--success))' };

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