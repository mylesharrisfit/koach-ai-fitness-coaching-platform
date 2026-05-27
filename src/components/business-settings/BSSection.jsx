import React from 'react';

export function BSSection({ icon: Icon, title, onReset, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)' }}>
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="font-bold text-slate-800 text-base">{title}</h2>
        </div>
        {onReset && (
          <button onClick={onReset} className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">
            Restore Defaults
          </button>
        )}
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

export function BSRow({ label, hint, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
      <div className="sm:w-56 flex-shrink-0 pt-0.5">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function BSToggle({ value, onChange, label }) {
  return (
    <button onClick={() => onChange(!value)}
      className="flex items-center gap-2 group"
      type="button">
      <div className="relative w-10 h-5.5 rounded-full transition-all flex-shrink-0"
        style={{
          width: 40, height: 22,
          background: value ? 'linear-gradient(135deg, #2563EB, #7C3AED)' : '#E2E8F0',
          transition: 'background 0.2s',
        }}>
        <div className="absolute top-0.5 rounded-full bg-white shadow transition-all"
          style={{ width: 18, height: 18, left: value ? 20 : 2, transition: 'left 0.2s' }} />
      </div>
      {label && <span className="text-sm text-slate-600">{label}</span>}
    </button>
  );
}

export function BSSelect({ value, onChange, options, className = '' }) {
  return (
    <div className="relative">
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-400 appearance-none bg-white transition-colors ${className}`}>
        {options.map(o => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
  );
}

export function BSInput({ value, onChange, placeholder, type = 'text', min, max, className = '' }) {
  return (
    <input type={type} value={value ?? ''} onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={placeholder} min={min} max={max}
      className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-400 transition-colors ${className}`} />
  );
}

export function BSTextarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value || ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-400 resize-none transition-colors" />
  );
}

export function BSDivider() {
  return <div className="border-t border-slate-100" />;
}