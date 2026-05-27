import React from 'react';
import { motion } from 'framer-motion';

const MACRO_ICONS = { protein: '🥩', carbs: '🌾', fats: '🥑', water: '💧' };
const MACRO_COLORS = { protein: '#3B82F6', carbs: '#F59E0B', fats: '#FBBF24', water: '#06B6D4' };

export default function MacroRing({ consumed, target, breakdown }) {
  const pct = Math.min(100, (consumed / target) * 100);
  const remaining = Math.max(0, target - consumed);
  const r = 60;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  const macros = [
    { key: 'protein', label: 'Protein', remaining: breakdown?.protein?.remaining || 0, unit: 'g' },
    { key: 'carbs', label: 'Carbs', remaining: breakdown?.carbs?.remaining || 0, unit: 'g' },
    { key: 'fats', label: 'Fats', remaining: breakdown?.fats?.remaining || 0, unit: 'g' },
    { key: 'water', label: 'Water', remaining: breakdown?.water?.remaining || 0, unit: 'glass' },
  ];

  return (
    <div className="px-4 mb-5">
      <div className="bg-white rounded-[20px] p-6 text-center"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>

        {/* Donut ring */}
        <div className="relative w-48 h-48 mx-auto mb-4 flex items-center justify-center">
          <svg width={196} height={196} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={98} cy={98} r={r} fill="none" strokeWidth={14} stroke="#F1F5F9" />
            <motion.circle
              cx={98} cy={98} r={r} fill="none" strokeWidth={14}
              stroke="url(#macro-grad)"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="macro-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.p
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-900 font-black leading-none"
              style={{ fontSize: 28 }}>
              {Math.round(consumed)}
            </motion.p>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">/ {target} cal</p>
            <p className="text-blue-600 text-[10px] font-bold mt-1">↓ {remaining} left</p>
          </div>
        </div>

        {/* Macro chips */}
        <div className="grid grid-cols-4 gap-2">
          {macros.map(m => (
            <button key={m.key}
              className="flex flex-col items-center p-2.5 rounded-2xl transition-colors"
              style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
              <span className="text-lg leading-none mb-1">{MACRO_ICONS[m.key]}</span>
              <p className="text-[10px] font-black text-slate-700" style={{ color: MACRO_COLORS[m.key] }}>
                {m.remaining.toFixed(0)}{m.unit[0]}
              </p>
              <p className="text-[8px] text-slate-400 font-semibold">{m.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}