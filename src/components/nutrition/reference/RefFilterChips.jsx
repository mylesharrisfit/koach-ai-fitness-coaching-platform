import React from 'react';

export default function RefFilterChips({ options, active, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            active === opt
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}