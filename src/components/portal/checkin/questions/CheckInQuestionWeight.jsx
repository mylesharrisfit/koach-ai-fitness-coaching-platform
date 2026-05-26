import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

export default function CheckInQuestionWeight({ value, onChange, lastValue }) {
  const [unit, setUnit] = useState('lbs');
  const numVal = parseFloat(value) || '';

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v ? parseFloat(v) : '');
  };

  const diff = numVal && lastValue ? (numVal - lastValue).toFixed(1) : null;
  const TrendIcon = diff === null ? null : diff < 0 ? TrendingDown : diff > 0 ? TrendingUp : Minus;
  const trendColor = diff === null ? '' : diff < 0 ? '#22C55E' : diff > 0 ? '#EF4444' : '#9CA3AF';

  return (
    <div className="space-y-6">
      {/* Unit toggle */}
      <div className="flex rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {['lbs', 'kg'].map(u => (
          <button key={u} onClick={() => setUnit(u)}
            className="flex-1 py-2.5 text-sm font-bold transition-all"
            style={{
              background: unit === u ? 'rgba(59,130,246,0.3)' : 'transparent',
              color: unit === u ? '#3B82F6' : 'rgba(255,255,255,0.3)',
            }}>
            {u}
          </button>
        ))}
      </div>

      {/* Large number input */}
      <div className="text-center">
        <div className="relative inline-block">
          <input
            type="number"
            inputMode="decimal"
            value={numVal}
            onChange={handleChange}
            placeholder="0"
            className="text-center bg-transparent text-white font-bold outline-none"
            style={{ fontSize: '72px', width: '200px', lineHeight: 1 }}
          />
          <span className="text-white/30 text-2xl font-semibold absolute bottom-4 right-0">{unit}</span>
        </div>
      </div>

      {/* Reference + trend */}
      {lastValue && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-center">
            <p className="text-white/30 text-[10px] uppercase tracking-wide">Last week</p>
            <p className="text-white/60 font-bold text-lg">{lastValue} {unit}</p>
          </div>
          {diff !== null && TrendIcon && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: `${trendColor}15`, border: `1px solid ${trendColor}30` }}>
              <TrendIcon className="w-4 h-4" style={{ color: trendColor }} />
              <span className="font-bold text-sm" style={{ color: trendColor }}>
                {diff > 0 ? '+' : ''}{diff} {unit}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}