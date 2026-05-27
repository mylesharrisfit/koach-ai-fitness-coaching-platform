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
    <div className="mx-4 bg-white p-5 rounded-3xl" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #CFFAFE' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-slate-800 font-bold text-sm">Hydration</p>
        </div>
        <p className="font-black text-sm" style={{ color: '#06B6D4' }}>
          {(waterMl / 1000).toFixed(1)}L <span className="text-slate-400 font-normal text-xs">/ {goalMl / 1000}L</span>
        </p>
      </div>

      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #06B6D4, #0EA5E9)' }}
          initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} transition={{ duration: 0.5 }} />
      </div>

      <div className="flex gap-1.5 flex-wrap mb-4">
        {Array.from({ length: Math.min(cups, 12) }).map((_, i) => (
          <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={() => onAdd(250)}
            className="w-6 h-8 rounded-lg overflow-hidden border transition-all"
            style={{ background: i < filledCups ? 'linear-gradient(180deg, #0EA5E9, #06B6D4)' : '#F0F9FF', borderColor: i < filledCups ? '#0EA5E9' : '#E0F2FE' }}>
            {i < filledCups && <Droplets className="w-3 h-3 text-white mx-auto mt-1" />}
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {QUICK_ADD.map(ml => (
          <button key={ml} onClick={() => onAdd(ml)}
            className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all"
            style={{ background: '#F0F9FF', border: '1.5px solid #BAE6FD', color: '#0284C7', minWidth: 52 }}>
            +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
          </button>
        ))}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input value={customVal} onChange={e => setCustomVal(e.target.value)} placeholder="ml"
            type="number" className="w-14 px-2 py-2.5 rounded-xl text-xs text-center text-slate-700 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-300" />
          <button onClick={() => { if (customVal) { onAdd(Number(customVal)); setCustomVal(''); } }}
            className="px-3 py-2.5 rounded-xl text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #06B6D4, #0EA5E9)' }}>+</button>
        </div>
      </div>
    </div>
  );
}