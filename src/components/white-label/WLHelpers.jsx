import React from 'react';
import { Lock } from 'lucide-react';

export function WLSection({ title, emoji, description, locked, children }) {
  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-opacity ${locked ? 'border-slate-200 opacity-60' : 'border-slate-200'}`}
      style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">{title}</h2>
            {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
          </div>
        </div>
        {locked && <Lock className="w-4 h-4 text-slate-400" />}
      </div>
      <div className={`p-6 space-y-5 ${locked ? 'pointer-events-none select-none' : ''}`}>{children}</div>
    </div>
  );
}

export function WLRow({ label, hint, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
      <div className="sm:w-48 flex-shrink-0 pt-0.5">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function WLToggle({ value, onChange, label, disabled }) {
  return (
    <button onClick={() => !disabled && onChange(!value)} disabled={disabled} type="button"
      className={`flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="relative rounded-full transition-all flex-shrink-0"
        style={{ width: 40, height: 22, background: value ? 'linear-gradient(135deg, #2563EB, #7C3AED)' : '#E2E8F0' }}>
        <div className="absolute top-0.5 rounded-full bg-white shadow transition-all"
          style={{ width: 18, height: 18, left: value ? 20 : 2, transition: 'left 0.15s' }} />
      </div>
      {label && <span className="text-sm text-slate-600">{label}</span>}
    </button>
  );
}

export function WLInput({ value, onChange, placeholder, className = '' }) {
  return (
    <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-400 transition-colors ${className}`} />
  );
}

export function WLColorPicker({ value, onChange, label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 rounded-xl border-2 border-slate-200 overflow-hidden flex-shrink-0 cursor-pointer">
        <input type="color" value={value || '#2563EB'} onChange={e => onChange(e.target.value)}
          className="absolute -inset-2 w-16 h-16 cursor-pointer border-none outline-none opacity-100" />
      </div>
      <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#2563EB"
        className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm font-mono focus:outline-none focus:border-blue-400" />
      {label && <span className="text-sm text-slate-500">{label}</span>}
    </div>
  );
}

export function WLSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-400 appearance-none bg-white">
        {options.map(o => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
  );
}

export function WLDivider() { return <div className="border-t border-slate-100" />; }

export function WLUploadButton({ label, hint, url, onChange, accept = 'image/*' }) {
  const ref = React.useRef();
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { base44 } = await import('@/api/base44Client');
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
  };
  return (
    <div className="flex items-center gap-4">
      {url && <img src={url} alt="preview" className="h-12 w-12 rounded-xl object-contain border border-slate-200 bg-slate-50 p-1 flex-shrink-0" />}
      <div>
        <button onClick={() => ref.current?.click()} type="button"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
          {url ? 'Change' : 'Upload'} {label}
        </button>
        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
        {url && <button onClick={() => onChange('')} type="button" className="block text-xs text-red-400 hover:text-red-600 mt-0.5 font-medium">Remove</button>}
      </div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={handleUpload} />
    </div>
  );
}