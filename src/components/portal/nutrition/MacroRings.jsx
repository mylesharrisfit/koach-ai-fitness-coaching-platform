import React from 'react';

function MiniRing({ value, target, color, label, unit = 'g', size = 56, stroke = 5 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const offset = circ * (1 - pct);
  const remaining = Math.max(0, target - value);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="rgba(255,255,255,0.06)" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
            stroke={color} strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-bold leading-none" style={{ color, fontSize: size > 80 ? 18 : 11 }}>
            {Math.round(value)}
          </p>
          {size > 80 && <p className="text-white/30 text-[10px] mt-0.5">{unit}</p>}
        </div>
      </div>
      <p className="text-white/40 text-[9px] font-semibold text-center">{label}</p>
      <p className="text-white/25 text-[8px] text-center">{Math.round(remaining)}{unit} left</p>
    </div>
  );
}

function BigCalorieRing({ consumed, target }) {
  const size = 120;
  const stroke = 8;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const offset = circ * (1 - pct);
  const over = consumed > target;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="rgba(255,255,255,0.06)" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
            stroke={over ? '#EF4444' : 'url(#calGrad)'}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
          <defs>
            <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-white font-bold text-2xl leading-none">{Math.round(consumed)}</p>
          <p className="text-white/30 text-[10px] mt-0.5">of {target}</p>
          <p className="text-white/20 text-[9px]">kcal</p>
        </div>
      </div>
      <p className="text-white/50 text-xs mt-1 font-semibold">
        {over ? `${Math.round(consumed - target)} over` : `${Math.round(target - consumed)} remaining`}
      </p>
    </div>
  );
}

export default function MacroRings({ logged, plan }) {
  const targets = {
    calories: plan?.calories || 2000,
    protein: plan?.protein_g || 150,
    carbs: plan?.carbs_g || 200,
    fats: plan?.fats_g || 65,
    water: 3000, // ml
  };

  return (
    <div className="mx-4 p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
      <div className="flex items-center gap-6">
        {/* Big calorie ring */}
        <BigCalorieRing consumed={logged.calories || 0} target={targets.calories} />

        {/* Macro mini rings */}
        <div className="flex gap-4 flex-1 justify-around">
          <MiniRing value={logged.protein || 0} target={targets.protein} color="#3B82F6" label="Protein" />
          <MiniRing value={logged.carbs || 0} target={targets.carbs} color="#F97316" label="Carbs" />
          <MiniRing value={logged.fats || 0} target={targets.fats} color="#EAB308" label="Fats" />
          <MiniRing value={(logged.water || 0) / 1000} target={targets.water / 1000} color="#06B6D4" label="Water" unit="L" />
        </div>
      </div>
    </div>
  );
}