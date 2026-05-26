import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function StatsStrip({ stats }) {
  const navigate = useNavigate();

  return (
    <div className="px-5">
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
        {stats.map((stat) => (
          <button key={stat.id} onClick={() => stat.path && navigate(stat.path)}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl min-w-[72px]"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-xl">{stat.emoji}</span>
            <p className="text-white font-bold text-sm leading-none">{stat.value}</p>
            <p className="text-white/30 text-[9px] font-medium text-center leading-tight">{stat.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}