import React, { useMemo } from 'react';
import { Plus, TrendingDown, TrendingUp, Minus } from 'lucide-react';

const MEASUREMENTS = [
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'chest', label: 'Chest' },
  { key: 'arms', label: 'Arms' },
  { key: 'thighs', label: 'Thighs' },
];

export default function MeasurementsCard({ checkIns, onLogMeasurements }) {
  const data = useMemo(() => {
    const withMeasurements = checkIns.filter(ci => ci.measurements && Object.keys(ci.measurements).length > 0);
    if (!withMeasurements.length) return null;
    const first = withMeasurements[0];
    const last = withMeasurements[withMeasurements.length - 1];

    return MEASUREMENTS.map(m => {
      const startVal = first?.measurements?.[m.key];
      const currentVal = last?.measurements?.[m.key];
      const change = startVal && currentVal ? (currentVal - startVal) : null;
      // History for sparkline
      const history = withMeasurements.map(ci => ci.measurements?.[m.key]).filter(Boolean);
      return { ...m, start: startVal, current: currentVal, change, history };
    }).filter(m => m.start || m.current);
  }, [checkIns]);

  function Sparkline({ values }) {
    if (!values || values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const w = 48, h = 20;
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg width={w} height={h} className="flex-shrink-0">
        <polyline points={pts} fill="none" stroke="rgba(59,130,246,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-bold text-sm">📏 Body Measurements</p>
        </div>
        <div className="py-8 text-center">
          <p className="text-white/30 text-xs">No measurements logged yet</p>
          <button onClick={onLogMeasurements} className="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
            + Log Measurements
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-white font-bold text-sm">📏 Body Measurements</p>
        <button onClick={onLogMeasurements}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold"
          style={{ background: 'rgba(59,130,246,0.2)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.25)' }}>
          <Plus className="w-3 h-3" /> Log
        </button>
      </div>

      <div className="space-y-2">
        {data.map(m => {
          const isProgress = m.change !== null && m.change < 0;
          const isRegress = m.change !== null && m.change > 0;
          const TrendIcon = isProgress ? TrendingDown : isRegress ? TrendingUp : Minus;
          const trendColor = isProgress ? '#22C55E' : isRegress ? '#EF4444' : 'rgba(255,255,255,0.3)';

          return (
            <div key={m.key} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-white/60 text-xs font-semibold">{m.label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {m.start && <span className="text-white/25 text-[10px]">{m.start}"</span>}
                  {m.start && m.current && <span className="text-white/15 text-[9px]">→</span>}
                  {m.current && <span className="text-white text-sm font-bold">{m.current}"</span>}
                </div>
              </div>
              {m.change !== null && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
                  <span className="text-[10px] font-bold" style={{ color: trendColor }}>
                    {m.change > 0 ? '+' : ''}{m.change}"
                  </span>
                </div>
              )}
              <Sparkline values={m.history} />
            </div>
          );
        })}
      </div>
    </div>
  );
}