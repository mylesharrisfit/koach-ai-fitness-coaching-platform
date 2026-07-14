import React, { useState } from 'react';
import KoachLogo from '@/components/brand/KoachLogo.jsx';

/**
 * Shared chrome for the Supabase-auth pages (Step 3a). Reuses the same design
 * tokens already used by ClientSetup.jsx — no new styling system introduced.
 */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-5" style={{ background: 'var(--tc-sidebar)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, var(--tc-primary) 0%, transparent 65%)', filter: 'blur(80px)' }} />
      </div>
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
        <KoachLogo size={56} rounded="rounded-2xl" glow bg />
        <div className="w-full space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.03em' }}>{title}</h1>
            {subtitle && <p className="text-sm text-white/40 leading-relaxed">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthField({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full px-4 py-3.5 pr-16 rounded-xl bg-[var(--kc-w-5)] border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-primary/60 transition-colors"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-white/30 hover:text-white/60 transition-colors">
            {show ? 'HIDE' : 'SHOW'}
          </button>
        )}
      </div>
    </div>
  );
}

export function AuthError({ message }) {
  if (!message) return null;
  return (
    <div className="px-4 py-3 rounded-xl text-xs font-medium text-destructive"
      style={{ background: 'color-mix(in srgb, var(--tc-destructive) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--tc-destructive) 20%, transparent)' }}>
      {message}
    </div>
  );
}

export function AuthNotice({ message }) {
  if (!message) return null;
  return (
    <div className="px-4 py-3 rounded-xl text-xs font-medium"
      style={{ color: 'var(--tc-success)', background: 'color-mix(in srgb, var(--tc-success) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--tc-success) 20%, transparent)' }}>
      {message}
    </div>
  );
}

export function AuthSubmit({ disabled, children }) {
  return (
    <button type="submit" disabled={disabled}
      className="w-full py-4 rounded-xl font-bold text-base text-primary-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: 'linear-gradient(135deg, var(--tc-primary), var(--tc-primary))', boxShadow: '0 0 24px color-mix(in srgb, var(--tc-primary) 25%, transparent)' }}>
      {children}
    </button>
  );
}
