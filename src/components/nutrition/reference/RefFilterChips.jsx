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
              ? 'bg-sidebar text-white border-border'
              : 'bg-card text-muted-foreground border-border hover:border-border'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}