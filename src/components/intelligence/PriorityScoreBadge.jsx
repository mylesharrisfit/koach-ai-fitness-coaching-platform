import React from 'react';

export default function PriorityScoreBadge({ score }) {
  if (!score && score !== 0) return null;

  const color = score >= 7
    ? { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' }
    : score >= 4
    ? { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' }
    : { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };

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