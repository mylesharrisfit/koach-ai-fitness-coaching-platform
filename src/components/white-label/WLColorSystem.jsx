import React, { useMemo } from 'react';
import { WLSection, WLRow, WLColorPicker, WLSelect, WLDivider } from './WLHelpers';

function contrastRatio(hex1, hex2) {
  const lum = (hex) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substr(0,2),16)/255;
    const g = parseInt(c.substr(2,2),16)/255;
    const b = parseInt(c.substr(4,2),16)/255;
    const toLinear = x => x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055,2.4);
    return 0.2126*toLinear(r) + 0.7152*toLinear(g) + 0.0722*toLinear(b);
  };
  const l1 = lum(hex1||'rgb(var(--primary))'), l2 = lum(hex2||'rgb(var(--card))');
  const lighter = Math.max(l1,l2), darker = Math.min(l1,l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function ContrastCheck({ fg, bg }) {
  const ratio = useMemo(() => {
    try { return contrastRatio(fg, bg); } catch { return null; }
  }, [fg, bg]);
  if (!ratio) return null;
  const r = ratio.toFixed(1);
  if (ratio >= 4.5) return (
    <div className="flex items-center gap-2 text-xs text-success font-semibold mt-2 bg-success/10 px-3 py-1.5 rounded-lg border border-success">
      ✅ Great contrast — {r}:1 — WCAG AA compliant
    </div>
  );
  if (ratio >= 3) return (
    <div className="flex items-center gap-2 text-xs text-warning font-semibold mt-2 bg-warning/10 px-3 py-1.5 rounded-lg border border-warning">
      ⚠️ Low contrast — {r}:1 — may be hard to read for some users
    </div>
  );
  return (
    <div className="flex items-center gap-2 text-xs text-destructive font-semibold mt-2 bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive">
      ❌ Insufficient contrast — {r}:1 — please choose different colors
    </div>
  );
}

const GRADIENT_DIRS = [
  { value: '90deg', label: 'Left to Right →' },
  { value: '180deg', label: 'Top to Bottom ↓' },
  { value: '135deg', label: 'Diagonal ↘ (default)' },
  { value: 'custom', label: 'Custom angle' },
];

export default function WLColorSystem({ s, set, locked }) {
  const gradAngle = s.gradient_direction === 'custom' ? `${s.gradient_angle || 135}deg` : (s.gradient_direction || '135deg');
  const gradPreview = `linear-gradient(${gradAngle}, ${s.primary_color || 'rgb(var(--primary))'}, ${s.secondary_color || 'rgb(var(--ai))'})`;

  return (
    <WLSection title="Color System" emoji="🎨"
      description="Brand colors applied across buttons, navigation, and accents" locked={locked}>

      <WLRow label="Primary brand color" hint="Buttons, active states, links, highlights">
        <WLColorPicker value={s.primary_color} onChange={v => set('primary_color', v)} />
        <div className="mt-3 flex gap-2 flex-wrap">
          <button className="px-4 py-1.5 rounded-lg text-sm font-bold text-white" style={{ background: s.primary_color || 'rgb(var(--primary))' }}>Button</button>
          <span className="px-2 py-1.5 text-sm font-semibold" style={{ color: s.primary_color || 'rgb(var(--primary))' }}>Link text</span>
          <div className="w-6 h-6 rounded-full" style={{ background: s.primary_color || 'rgb(var(--primary))' }} />
        </div>
        <ContrastCheck fg={s.primary_color || 'rgb(var(--primary))'} bg={s.card_color || 'rgb(var(--card))'} />
      </WLRow>

      <WLRow label="Secondary brand color" hint="Gradients, accents, badges">
        <WLColorPicker value={s.secondary_color} onChange={v => set('secondary_color', v)} />
      </WLRow>

      <WLRow label="Gradient" hint="Used in hero sections and buttons">
        <WLSelect value={s.gradient_direction} onChange={v => set('gradient_direction', v)} options={GRADIENT_DIRS} />
        {s.gradient_direction === 'custom' && (
          <div className="flex items-center gap-3 mt-2">
            <input type="range" min={0} max={360} value={s.gradient_angle || 135} onChange={e => set('gradient_angle', Number(e.target.value))}
              className="flex-1" />
            <span className="text-sm font-mono text-muted-foreground w-12">{s.gradient_angle || 135}°</span>
          </div>
        )}
        <div className="mt-3 h-10 w-full rounded-xl" style={{ background: gradPreview }} />
      </WLRow>

      <WLDivider />

      <WLRow label="Background colors">
        <div className="space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <WLColorPicker value={s.bg_color} onChange={v => set('bg_color', v)} label="Page bg" />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <WLColorPicker value={s.card_color} onChange={v => set('card_color', v)} label="Card bg" />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <WLColorPicker value={s.nav_color} onChange={v => set('nav_color', v)} label="Nav bar" />
          </div>
        </div>
      </WLRow>

      <WLRow label="Text colors">
        <div className="space-y-3">
          <WLColorPicker value={s.text_primary} onChange={v => set('text_primary', v)} label="Primary text" />
          <WLColorPicker value={s.text_secondary} onChange={v => set('text_secondary', v)} label="Secondary text" />
          <WLColorPicker value={s.link_color} onChange={v => set('link_color', v)} label="Links" />
        </div>
        <ContrastCheck fg={s.text_primary || 'rgb(var(--foreground))'} bg={s.bg_color || 'rgb(var(--muted))'} />
      </WLRow>
    </WLSection>
  );
}