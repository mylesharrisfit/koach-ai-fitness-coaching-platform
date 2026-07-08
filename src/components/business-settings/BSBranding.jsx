import React, { useRef } from 'react';
import { Palette, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BSSection, BSRow, BSInput, BSTextarea, BSDivider } from './BSSection';

const BRAND_COLORS = ['#2563EB', '#7C3AED', '#DC2626', '#059669', '#D97706', '#0891B2', '#DB2777', '#374151'];

const DEFAULTS = {
  brand_color: '#2563EB', logo_url: '',
  email_signature: '', reply_to_email: '',
};

export default function BSBranding({ s, set }) {
  const logoRef = useRef();

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('logo_url', file_url);
  };

  return (
    <BSSection icon={Palette} title="Branding & Appearance" onReset={() => Object.entries(DEFAULTS).forEach(([k, v]) => set(k, v))}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coach Dashboard Branding</p>
      <BSRow label="Business logo">
        <div className="flex items-center gap-4">
          {s.logo_url && (
            <img src={s.logo_url} alt="logo" className="h-12 w-auto rounded-xl border border-slate-200 object-contain bg-white p-1" />
          )}
          <button onClick={() => logoRef.current?.click()}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
            {s.logo_url ? 'Change Logo' : 'Upload Logo'}
          </button>
          {s.logo_url && (
            <button onClick={() => set('logo_url', '')} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
          )}
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>
      </BSRow>
      <BSRow label="Primary brand color" hint="Used for accents in your dashboard">
        <div className="flex items-center gap-3 flex-wrap">
          {BRAND_COLORS.map(c => (
            <button key={c} onClick={() => set('brand_color', c)}
              className="w-8 h-8 rounded-full transition-all"
              style={{ background: c, boxShadow: s.brand_color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none' }} />
          ))}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 overflow-hidden">
              <input type="color" value={s.brand_color || '#2563EB'} onChange={e => set('brand_color', e.target.value)}
                className="w-full h-full scale-125 cursor-pointer border-none outline-none" />
            </div>
            <span className="text-xs text-slate-400 font-mono">{s.brand_color || '#2563EB'}</span>
          </div>
        </div>
      </BSRow>

      <BSDivider />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client Portal Branding</p>
      <BSRow label="White label settings" hint="Full branding customization for your client portal">
        <Link to="/white-label"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
          <ExternalLink className="w-4 h-4" /> Open White Label Settings
        </Link>
        <p className="text-xs text-amber-600 mt-2 font-medium">⚡ Full white label branding available on Elite plan and above</p>
      </BSRow>

      <BSDivider />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Branding</p>
      <BSRow label="Email signature">
        <BSTextarea value={s.email_signature} onChange={v => set('email_signature', v)}
          placeholder="[Coach Name] | [Business Name] | [Website]" rows={3} />
      </BSRow>
      <BSRow label="Reply-to email">
        <BSInput value={s.reply_to_email} onChange={v => set('reply_to_email', v)} placeholder="coach@yourdomain.com" />
      </BSRow>
    </BSSection>
  );
}