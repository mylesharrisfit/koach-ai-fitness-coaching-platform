import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';

const QUICK_ADD = [250, 500, 750, 1000];

export default function WaterTracker({ waterMl, goalMl = 3000, onAdd }) {
  const [customVal, setCustomVal] = useState('');
  const pct = Math.min(waterMl / goalMl, 1);
  const cups = Math.ceil(goalMl / 250);
  const filledCups = Math.round(pct * cups);

  return (
    <div className="mx-4 p-4 rounded-2xl" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <p className="text-white font-bold text-sm">Water</p>
        </div>
        <p className="text-cyan-400 text-sm font-bold">
          {(waterMl / 1000).toFixed(1)}L <span className="text-white/30 font-normal">/ {goalMl / 1000}L</span>
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3">
        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #06B6D4, #0EA5E9)' }}
          initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} transition={{ duration: 0.5 }} />
      </div>

      {/* Cup icons */}
      <div className="flex gap-1 flex-wrap mb-3">
        {Array.from({ length: Math.min(cups, 12) }).map((_, i) => (
          <motion.div key={i} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            className="w-5 h-6 rounded-sm flex items-end justify-center overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            {i < filledCups && (
              <motion.div className="w-full" initial={{ height: 0 }} animate={{ height: '100%' }}
                style={{ background: 'rgba(6,182,212,0.5)' }} transition={{ delay: i * 0.03 }} />
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick add */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_ADD.map(ml => (
          <button key={ml} onClick={() => onAdd(ml)}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-cyan-300"
            style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)', minWidth: 52 }}>
            +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
          </button>
        ))}
        <div className="flex items-center gap-1 flex-shrink-0">
          <input value={customVal} onChange={e => setCustomVal(e.target.value)} placeholder="ml"
            type="number" className="w-14 px-2 py-2 rounded-xl text-xs text-center text-white focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.07)' }} />
          <button onClick={() => { if (customVal) { onAdd(Number(customVal)); setCustomVal(''); } }}
            className="px-2 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'rgba(6,182,212,0.2)' }}>
            +
          </button>
        </div>
      </div>
    </div>
  );
}