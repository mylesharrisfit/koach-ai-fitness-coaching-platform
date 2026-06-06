import React from 'react';
import { Search, X } from 'lucide-react';

export default function RefSearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 placeholder:text-slate-400"
      />
      {value && (
        <button onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}