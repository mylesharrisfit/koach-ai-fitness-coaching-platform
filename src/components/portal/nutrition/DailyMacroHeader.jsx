import React from 'react';
import { motion } from 'framer-motion';
import { getMacroColor } from '@/lib/nutritionUtils';

function MacroBar({ label, consumed, target, color, emoji }) {
  const pct = target > 0 ? Math.min(110, (consumed / target) * 100) : 0;
  const barColor = getMacroColor(pct);
  const remaining = Math.max(0, target - consumed);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-muted-foreground">{emoji} {label}</span>
        <span className="text-muted-foreground">{Math.round(consumed)}<span className="text-border">/{target}g</span></span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: barColor }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {pct > 100 ? <span className="text-destructive font-semibold">Over by {Math.round(consumed - target)}g</span>
          : `${Math.round(remaining)}g remaining`}
      </p>
    </div>
  );
}

export default function DailyMacroHeader({ totals, targets }) {
  const calPct = targets.calories > 0 ? Math.min(110, (totals.calories / targets.calories) * 100) : 0;
  const remaining = Math.max(0, targets.calories - totals.calories);
  const r = 52, circ = 2 * Math.PI * r;
  const offset = circ * (1 - calPct / 100);
  const calColor = getMacroColor(calPct);

  return (
    <div className="bg-card mx-4 mb-3 rounded-[20px] p-4"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgb(var(--muted))' }}>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative flex-shrink-0">
          <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={60} cy={60} r={r} fill="none" strokeWidth={12} stroke="rgb(var(--muted))" />
            <motion.circle
              cx={60} cy={60} r={r} fill="none" strokeWidth={12}
              stroke={calColor}
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-black text-foreground leading-none">{Math.round(totals.calories)}</p>
            <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">/ {targets.calories}</p>
            <p className="text-[9px] font-bold mt-0.5" style={{ color: calColor }}>
              {calPct > 100 ? 'OVER' : `${Math.round(remaining)} left`}
            </p>
          </div>
        </div>

        {/* Macro bars */}
        <div className="flex-1 space-y-2.5">
          <MacroBar label="Protein" emoji="💪" consumed={totals.protein} target={targets.protein} />
          <MacroBar label="Carbs"   emoji="🌾" consumed={totals.carbs}   target={targets.carbs} />
          <MacroBar label="Fats"    emoji="🥑" consumed={totals.fats}    target={targets.fats} />
        </div>
      </div>
    </div>
  );
}