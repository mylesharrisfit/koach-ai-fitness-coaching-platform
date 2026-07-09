import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

export default function WaterTracker({ glasses = 0, goal = 8, onUpdate }) {
  const pct = Math.min(100, (glasses / goal) * 100);

  const toggleGlass = (index) => {
    if (index < glasses) {
      onUpdate(index);
    } else if (index === glasses) {
      onUpdate(glasses + 1);
    }
  };

  return (
    <div className="mx-4 bg-card rounded-[20px] p-5 mb-5"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgb(var(--muted))' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground font-black text-lg">💧 Water Intake</h3>
        <p className="text-muted-foreground text-xs font-semibold">{glasses} of {goal} glasses</p>
      </div>

      {/* Water drops visual */}
      <div className="flex justify-center gap-2 mb-5">
        {Array.from({ length: goal }).map((_, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.85 }}
            onClick={() => toggleGlass(i)}
            className="w-12 h-14 rounded-full flex items-center justify-center text-2xl transition-all"
            style={{
              background: i < glasses
                ? 'linear-gradient(135deg, #06B6D4, #0891B2)'
                : 'rgba(0,0,0,0.05)',
              border: i < glasses ? 'none' : '1.5px dashed rgb(var(--muted-foreground))',
              boxShadow: i < glasses ? '0 2px 8px rgba(6,182,212,0.25)' : 'none',
            }}>
            {i < glasses ? '💧' : '○'}
          </motion.button>
        ))}
      </div>

      {/* Quick buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onUpdate(Math.max(0, glasses - 1))}
          className="flex-1 py-3 rounded-xl font-bold text-sm text-muted-foreground flex items-center justify-center gap-1.5"
          style={{ background: 'rgb(var(--muted))', border: '1px solid rgb(var(--border))' }}>
          <Minus className="w-4 h-4" /> Glass
        </button>
        <button
          onClick={() => onUpdate(glasses + 1)}
          className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5"
          style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)', boxShadow: '0 2px 8px rgba(6,182,212,0.25)' }}>
          <Plus className="w-4 h-4" /> Glass
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 rounded-full" style={{ background: 'rgb(var(--border))' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #06B6D4, #0891B2)' }} />
      </div>

      {/* Goal text */}
      <p className="text-muted-foreground text-[10px] font-semibold mt-2 text-center">
        Goal: {goal} glasses ({(goal * 250)}ml)
      </p>
    </div>
  );
}