import React from 'react';
import { motion } from 'framer-motion';

const SCALE_EMOJIS = { 1: '😫', 2: '😞', 3: '😕', 4: '🙁', 5: '😐', 6: '🙂', 7: '😊', 8: '😁', 9: '🤩', 10: '🔥' };

function getScaleColor(val, max = 10) {
  const pct = val / max;
  if (pct <= 0.3) return 'rgb(var(--destructive))';
  if (pct <= 0.5) return 'rgb(var(--warning))';
  if (pct <= 0.7) return '#EAB308';
  return 'rgb(var(--success))';
}

function getScaleLabel(val, label) {
  const labels = {
    0: 'Not tracked', 1: 'Very Low', 2: 'Low', 3: 'Below Average', 4: 'Slightly Below',
    5: 'Average', 6: 'Good', 7: 'Good', 8: 'Very Good', 9: 'Excellent', 10: 'Outstanding'
  };
  return `${label}: ${val} — ${labels[val] || ''}`;
}

export default function CheckInQuestionScale({ value, onChange, min = 1, max = 10, label, isNumber = false, lastValue }) {
  const numVal = parseFloat(value) || (isNumber ? '' : min);
  const color = numVal ? getScaleColor(numVal, max) : 'rgb(var(--muted-foreground))';

  if (isNumber) {
    return (
      <div className="text-center space-y-6">
        <div className="relative inline-block">
          <input
            type="number"
            inputMode="decimal"
            value={numVal}
            onChange={e => onChange(e.target.value)}
            placeholder="0"
            className="text-center bg-transparent text-white font-bold outline-none"
            style={{ fontSize: '72px', width: '180px', lineHeight: 1 }}
          />
        </div>
        {lastValue && (
          <p className="text-white/30 text-sm">Last: <span className="text-white/50 font-semibold">{lastValue}</span></p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Big number display */}
      <div className="text-center">
        <motion.div key={numVal}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block">
          <span className="font-black text-8xl" style={{ color }}>
            {numVal || '—'}
          </span>
        </motion.div>
        <p className="text-2xl mt-1">{SCALE_EMOJIS[numVal] || ''}</p>
        {numVal && <p className="text-white/40 text-sm mt-2">{getScaleLabel(numVal, label)}</p>}
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={min} max={max} step={1}
          value={numVal || min}
          onChange={e => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${((numVal - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((numVal - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-white/20">{min}</span>
          <span className="text-[10px] text-white/20">{max}</span>
        </div>
      </div>

      {/* Tap markers */}
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
          <button key={n} onClick={() => onChange(n)}
            className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
            style={{
              background: numVal === n ? `${getScaleColor(n, max)}25` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${numVal === n ? getScaleColor(n, max) + '50' : 'transparent'}`,
            }}>
            <span className="text-xs font-bold" style={{ color: numVal === n ? getScaleColor(n, max) : 'rgba(255,255,255,0.3)' }}>{n}</span>
          </button>
        ))}
      </div>

      {lastValue !== undefined && lastValue !== null && (
        <p className="text-white/25 text-xs text-center">Last week: <span className="text-white/40 font-semibold">{lastValue}/10</span></p>
      )}
    </div>
  );
}