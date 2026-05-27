import React, { useState } from 'react';
import { WLSection, WLRow, WLToggle, WLSelect, WLColorPicker, WLInput, WLUploadButton, WLDivider } from './WLHelpers';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const NAV_STYLES = [
  { value: 'bottom', label: 'Bottom bar (default)' },
  { value: 'side', label: 'Side navigation' },
  { value: 'tab', label: 'Tab bar' },
];
const NAV_BGS = [
  { value: 'brand', label: 'Brand color' },
  { value: 'white', label: 'White' },
  { value: 'dark', label: 'Dark' },
];
const SPLASH_ANIMATIONS = [
  { value: 'spinner', label: 'Spinner' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'logo', label: 'Logo animation' },
];
const LOGIN_BG_TYPES = [
  { value: 'gradient', label: 'Gradient' },
  { value: 'solid', label: 'Solid color' },
  { value: 'image', label: 'Image' },
];
const DOMAIN_STATUS = {
  pending: { icon: Clock, color: '#D97706', bg: '#FFFBEB', label: 'Pending DNS setup' },
  verified: { icon: CheckCircle, color: '#2563EB', bg: '#EFF6FF', label: 'Domain verified' },
  active: { icon: CheckCircle, color: '#059669', bg: '#ECFDF5', label: 'Active & live' },
  error: { icon: AlertCircle, color: '#DC2626', bg: '#FEF2F2', label: 'DNS error — check records' },
};

export default function WLPortalBranding({ s, set, locked, eliteLocked, enterpriseLocked }) {
  const [showDnsInstructions, setShowDnsInstructions] = useState(false);
  const domainStatus = DOMAIN_STATUS[s.custom_domain_status || 'pending'];
  const StatusIcon = domainStatus.icon;

  return (
    <WLSection title="Client Portal Branding" emoji="📱"
      description="Customize the look and feel of your client-facing app" locked={locked}>

      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Header & Navigation</p>
      <WLRow label="Show business logo" hint="Display your logo in the portal header">
        <WLToggle value={s.portal_show_logo !== false} onChange={v => set('portal_show_logo', v)} />
      </WLRow>
      <WLRow label="Navigation style" hint="Layout for the client portal navigation">
        <WLSelect value={s.portal_nav_style || 'bottom'} onChange={v => set('portal_nav_style', v)} options={NAV_STYLES} />
      </WLRow>
      <WLRow label="Navigation bar color">
        <WLSelect value={s.portal_nav_bg || 'white'} onChange={v => set('portal_nav_bg', v)} options={NAV_BGS} />
      </WLRow>
      <WLRow label="Hide 'Powered by KOACH AI'" hint="Remove KOACH AI badge from footer (Elite+)">
        <WLToggle value={s.portal_hide_koach_badge || false} onChange={v => set('portal_hide_koach_badge', v)} disabled={eliteLocked} />
        {eliteLocked && <p className="text-xs text-amber-600 font-medium mt-1">⭐ Available on Elite and above</p>}
      </WLRow>

      <WLDivider />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Screen</p>
      <WLRow label="Custom splash screen">
        <WLToggle value={s.splash_enabled !== false} onChange={v => set('splash_enabled', v)} />
      </WLRow>
      {s.splash_enabled !== false && (
        <>
          <WLRow label="Splash background">
            <WLColorPicker value={s.splash_bg_color} onChange={v => set('splash_bg_color', v)} />
          </WLRow>
          <WLRow label="Loading animation">
            <WLSelect value={s.splash_animation || 'spinner'} onChange={v => set('splash_animation', v)} options={SPLASH_ANIMATIONS} />
          </WLRow>
        </>
      )}

      <WLDivider />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Login Page</p>
      <WLRow label="Background type">
        <WLSelect value={s.login_bg_type || 'gradient'} onChange={v => set('login_bg_type', v)} options={LOGIN_BG_TYPES} />
      </WLRow>
      {s.login_bg_type !== 'image' ? (
        <WLRow label="Background color">
          <WLColorPicker value={s.login_bg_color} onChange={v => set('login_bg_color', v)} />
        </WLRow>
      ) : (
        <WLRow label="Background image">
          <WLUploadButton label="Background Image" url={s.login_bg_image_url} onChange={v => set('login_bg_image_url', v)} hint="1920×1080px recommended" />
        </WLRow>
      )}
      <WLRow label="Show logo on login page">
        <WLToggle value={s.login_show_logo !== false} onChange={v => set('login_show_logo', v)} />
      </WLRow>
      <WLRow label="Welcome headline">
        <WLInput value={s.login_headline} onChange={v => set('login_headline', v)}
          placeholder={`Welcome to ${s.business_name || 'Your Coaching App'}`} />
      </WLRow>
      <WLRow label="Welcome subtitle">
        <WLInput value={s.login_subtitle} onChange={v => set('login_subtitle', v)}
          placeholder="Sign in to access your training dashboard" />
      </WLRow>

      <WLDivider />
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            Custom Domain
            {enterpriseLocked && <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">Enterprise only</span>}
          </p>
          <WLRow label="Domain" hint="e.g. app.mylesharrisfitness.com">
            <WLInput value={s.custom_domain} onChange={v => { set('custom_domain', v); setShowDnsInstructions(!!v); }}
              placeholder="app.yourdomain.com"
              className={enterpriseLocked ? 'opacity-50 pointer-events-none' : ''} />
            {s.custom_domain && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: domainStatus.bg }}>
                <StatusIcon className="w-4 h-4 flex-shrink-0" style={{ color: domainStatus.color }} />
                <span className="text-xs font-semibold" style={{ color: domainStatus.color }}>{domainStatus.label}</span>
                <span className="text-xs text-slate-400 ml-1">· SSL auto-provisioned</span>
              </div>
            )}
          </WLRow>
          {showDnsInstructions && s.custom_domain && !enterpriseLocked && (
            <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-bold text-slate-700 mb-2">DNS Setup Instructions</p>
              <div className="space-y-1 font-mono text-xs">
                <p className="text-slate-600">Add a CNAME record to your DNS provider:</p>
                <div className="bg-white border border-slate-200 rounded-lg p-2 mt-1">
                  <p><span className="text-blue-600">Type:</span> CNAME</p>
                  <p><span className="text-blue-600">Name:</span> {s.custom_domain.split('.')[0]}</p>
                  <p><span className="text-blue-600">Value:</span> portal.koach.ai</p>
                  <p><span className="text-blue-600">TTL:</span> 300</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400">💡 Custom domain requires Enterprise plan and DNS access. Allow up to 48 hours for DNS propagation.</p>
    </WLSection>
  );
}