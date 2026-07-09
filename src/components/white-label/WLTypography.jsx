import React from 'react';
import { WLSection, WLRow, WLSelect } from './WLHelpers';

const FONTS = [
  { value: 'system', label: 'System Default (SF Pro / Roboto)' },
  { value: 'Inter', label: 'Inter (Recommended)' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
];

const WEIGHTS = [
  { value: '400', label: 'Regular (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'SemiBold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'ExtraBold (800)' },
];

const WEIGHT_MAP = { '400': 400, '500': 500, '600': 600, '700': 700, '800': 800 };

export default function WLTypography({ s, set, locked, enterpriseLocked }) {
  const font = s.font_primary === 'system' ? 'inherit' : (s.font_primary || 'Inter');
  const weight = WEIGHT_MAP[s.font_heading_weight || '700'];

  return (
    <WLSection title="Typography" emoji="✍️"
      description="Font settings applied to the client portal" locked={locked}>

      <WLRow label="Primary font" hint="Used throughout the client portal">
        <WLSelect value={s.font_primary || 'Inter'} onChange={v => set('font_primary', v)} options={FONTS} />
      </WLRow>

      <WLRow label="Heading weight" hint="Font weight applied to headings and titles">
        <WLSelect value={s.font_heading_weight || '700'} onChange={v => set('font_heading_weight', v)} options={WEIGHTS} />
      </WLRow>

      <WLRow label="Preview">
        <div className="p-5 rounded-xl bg-muted border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Font Preview — {s.font_primary || 'Inter'}</p>
          <h2 className="text-2xl mb-1" style={{ fontFamily: font, fontWeight: weight }}>
            {s.business_name || 'Your Coaching Business'}
          </h2>
          <p className="text-base mb-1" style={{ fontFamily: font, fontWeight: 600 }}>Weekly Check-In Due</p>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: font, fontWeight: 400 }}>
            Your progress this week has been incredible. Keep pushing toward your goals!
          </p>
          <div className="flex gap-2 mt-3">
            <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ fontFamily: font, fontWeight: 600, background: s.primary_color || 'var(--tc-primary)' }}>
              Start Workout
            </button>
            <button className="px-4 py-2 rounded-xl text-sm font-medium border border-border text-foreground" style={{ fontFamily: font }}>
              View Plan
            </button>
          </div>
        </div>
      </WLRow>

      {enterpriseLocked && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-ai/10 border border-ai">
          <span className="text-lg">🔒</span>
          <div>
            <p className="text-sm font-bold text-ai">Custom Font Upload</p>
            <p className="text-xs text-ai">Upload your own font files — available on Enterprise plan</p>
          </div>
        </div>
      )}
    </WLSection>
  );
}