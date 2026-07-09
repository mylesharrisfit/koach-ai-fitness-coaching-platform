import React from 'react';

export function NSection({ title, emoji, onReset, onTest, children }) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden" style={{ boxShadow: '0 1px 8px color-mix(in srgb, black 5%, transparent)' }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/60">
        <div className="flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <h2 className="font-bold text-foreground text-sm">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {onTest && (
            <button onClick={onTest}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-accent border border-primary hover:bg-accent transition-colors">
              Send Test
            </button>
          )}
          <button onClick={onReset}
            className="text-xs text-muted-foreground hover:text-muted-foreground font-medium transition-colors">
            Reset
          </button>
        </div>
      </div>
      <div className="divide-y divide-muted">{children}</div>
    </div>
  );
}

export function NToggle({ value, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative flex-shrink-0 rounded-full transition-all ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ width: 40, height: 22 }}
      type="button"
    >
      <div className="absolute inset-0 rounded-full transition-all"
        style={{ background: value ? 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))' : 'var(--tc-border)' }} />
      <div className="absolute top-0.5 rounded-full bg-card shadow transition-all"
        style={{ width: 18, height: 18, left: value ? 20 : 2, transition: 'left 0.15s' }} />
    </button>
  );
}

export function NDelivery({ value = 'push_email', onChange, options = ['off', 'push', 'email', 'push_email'] }) {
  const LABELS = { off: 'Off', push: 'Push', email: 'Email', push_email: 'Push + Email' };
  return (
    <div className="flex items-center gap-1">
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
          style={{
            background: value === o ? 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))' : 'var(--tc-muted)',
            color: value === o ? 'white' : 'var(--tc-muted-foreground)',
          }}>
          {LABELS[o]}
        </button>
      ))}
    </div>
  );
}

export function NSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value ?? ''} onChange={e => onChange(e.target.value)}
        className="pl-2.5 pr-7 py-1.5 rounded-lg border border-border text-xs text-foreground font-semibold focus:outline-none focus:border-primary appearance-none bg-card">
        {options.map(o => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
      <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
  );
}

export function NMultiCheck({ values = [], onChange, options }) {
  const toggle = (v) => {
    const next = values.includes(v) ? values.filter(x => x !== v) : [...values, v];
    onChange(next);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const val = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        const active = values.includes(val);
        return (
          <button key={val} onClick={() => toggle(val)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
            style={{
              background: active ? 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))' : 'var(--tc-muted)',
              color: active ? 'white' : 'var(--tc-muted-foreground)',
            }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function NRow({ enabled, title, description, locked, children, onToggle }) {
  return (
    <div className={`px-6 py-4 transition-colors ${!enabled && !locked ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <NToggle value={enabled} onChange={onToggle} disabled={locked} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {locked && <span className="text-[10px] bg-warning/10 text-warning font-bold px-2 py-0.5 rounded-full">Required</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
          {enabled && <div className="mt-3 flex flex-wrap gap-3 items-center">{children}</div>}
        </div>
      </div>
    </div>
  );
}