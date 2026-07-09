import React, { useState } from 'react';

const FIELDS = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'arms', label: 'Arms' },
  { key: 'thighs', label: 'Thighs' },
];

export default function CheckInQuestionMeasurements({ value, onChange, lastMeasurements }) {
  const [unit, setUnit] = useState('in');
  const measurements = value || {};

  const setField = (key, val) => {
    onChange({ ...measurements, [key]: parseFloat(val) || '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {['in', 'cm'].map(u => (
          <button key={u} onClick={() => setUnit(u)}
            className="flex-1 py-2.5 text-sm font-bold transition-all"
            style={{ background: unit === u ? 'rgb(var(--primary) / 0.3)' : 'transparent', color: unit === u ? 'rgb(var(--primary))' : 'rgba(255,255,255,0.3)' }}>
            {u}
          </button>
        ))}
      </div>

      {FIELDS.map(f => (
        <div key={f.key} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm font-semibold">{f.label}</span>
            {lastMeasurements?.[f.key] && (
              <span className="text-white/25 text-[10px]">Last: {lastMeasurements[f.key]} {unit}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={measurements[f.key] || ''}
              onChange={e => setField(f.key, e.target.value)}
              placeholder="—"
              className="flex-1 bg-transparent text-white text-xl font-bold outline-none placeholder-white/20"
              style={{ fontSize: '28px' }}
            />
            <span className="text-white/30 text-sm">{unit}</span>
          </div>
          <p className="text-white/20 text-[10px] mt-1">Optional</p>
        </div>
      ))}
    </div>
  );
}