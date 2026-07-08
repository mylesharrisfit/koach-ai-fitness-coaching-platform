import React from 'react';

function Ring({ value, max, color, size = 80, label, icon }) {
  const pct = Math.min(1, (value || 0) / max);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={8} className="text-secondary" />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={8}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base">{icon}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold">{value || 0}<span className="text-muted-foreground font-normal">/{max}</span></p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function DailyRings({ log }) {
  return (
    <div className="flex justify-around items-center py-4 px-2">
      <Ring value={log?.workout_done ? 1 : 0} max={1} color="#3b82f6" icon="🏋️" label="Workout" />
      <Ring value={log?.meals_logged} max={4} color="#10b981" icon="🥗" label="Meals" />
      <Ring value={log?.water_glasses} max={8} color="#06b6d4" icon="💧" label="Water" />
      <Ring value={log?.steps} max={10000} color="#f59e0b" icon="👟" label="Steps" />
    </div>
  );
}