import React from 'react';

export function BSSection({ icon: Icon, title, onReset, children }) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--tc-accent), var(--tc-ai))' }}>
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-bold text-foreground text-base">{title}</h2>
        </div>
        {onReset && (
          <button onClick={onReset} className="text-xs text-muted-foreground hover:text-muted-foreground font-medium transition-colors">
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
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{hint}</p>}
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
          background: value ? 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))' : 'var(--tc-border)',
          transition: 'background 0.2s',
        }}>
        <div className="absolute top-0.5 rounded-full bg-card shadow transition-all"
          style={{ width: 18, height: 18, left: value ? 20 : 2, transition: 'left 0.2s' }} />
      </div>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </button>
  );
}

export function BSSelect({ value, onChange, options, className = '' }) {
  return (
    <div className="relative">
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-xl border border-border text-foreground text-sm focus:outline-none focus:border-primary appearance-none bg-card transition-colors ${className}`}>
        {options.map(o => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
  );
}

export function BSInput({ value, onChange, placeholder, type = 'text', min, max, className = '' }) {
  return (
    <input type={type} value={value ?? ''} onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={placeholder} min={min} max={max}
      className={`w-full px-3 py-2 rounded-xl border border-border text-foreground text-sm focus:outline-none focus:border-primary transition-colors ${className}`} />
  );
}

export function BSTextarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value || ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2.5 rounded-xl border border-border text-foreground text-sm focus:outline-none focus:border-primary resize-none transition-colors" />
  );
}

export function BSDivider() {
  return <div className="border-t border-border" />;
}