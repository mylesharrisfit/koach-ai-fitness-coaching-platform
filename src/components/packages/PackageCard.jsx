import React, { useState } from 'react';
import { MoreVertical, Users, Edit, Copy, Archive, Trash2, ExternalLink, ToggleLeft, ToggleRight, Check } from 'lucide-react';

const BILLING_LABELS = {
  one_time: 'One-time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
  custom: 'Custom Plan',
};

const BILLING_COLORS = {
  one_time: { bg: 'var(--tc-muted)', color: 'var(--tc-foreground)' },
  monthly: { bg: 'var(--tc-accent)', color: 'var(--tc-primary)' },
  quarterly: { bg: 'var(--tc-ai)', color: 'var(--tc-ai)' },
  annual: { bg: 'var(--tc-success)', color: 'var(--tc-success)' },
  custom: { bg: 'var(--tc-warning)', color: 'var(--tc-warning)' },
};

const INCLUSION_LABELS = {
  custom_program: 'Custom workout program',
  weekly_updates: 'Weekly program updates',
  meal_plan: 'Personalized meal plan',
  weekly_checkins: 'Weekly check-ins',
  unlimited_messaging: 'Unlimited messaging',
  progress_tracking: 'Progress tracking',
  nutrition_coaching: 'Nutrition coaching',
  app_access: '24/7 App access',
};

export default function PackageCard({ pkg, onEdit, onDuplicate, onArchive, onDelete, onToggleActive, onShare }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const billing = BILLING_LABELS[pkg.billing_type] || 'Custom';
  const billingColor = BILLING_COLORS[pkg.billing_type] || BILLING_COLORS.monthly;

  const allInclusions = [
    ...Object.entries(pkg.inclusions || {})
      .filter(([k, v]) => v === true || (k === 'video_calls' && v && v !== 'none'))
      .map(([k, v]) => {
        if (k === 'video_calls') return `Video calls (${v.replace(/_/g, ' ')})`;
        return INCLUSION_LABELS[k] || k;
      }),
    ...(pkg.custom_inclusions || []),
  ];

  const previewInclusions = allInclusions.slice(0, 3);
  const remaining = allInclusions.length - 3;

  return (
    <div style={{
      background: 'var(--tc-card)',
      borderRadius: 16,
      border: '1px solid var(--tc-muted)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.2s',
      boxShadow: '0 1px 4px color-mix(in srgb, black 5%, transparent)',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px color-mix(in srgb, black 9%, transparent)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px color-mix(in srgb, black 5%, transparent)'}
    >
      {/* Color stripe */}
      <div style={{ height: 5, background: pkg.color_theme || 'var(--tc-primary)' }} />

      {/* Body */}
      <div style={{ padding: '16px 18px', flex: 1 }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--tc-foreground)', margin: 0, lineHeight: 1.3 }}>{pkg.name}</h3>
            {pkg.description && (
              <p style={{ fontSize: 12, color: 'var(--tc-muted-foreground)', margin: '4px 0 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {pkg.description}
              </p>
            )}
          </div>
          {/* 3-dot menu */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(o => !o)}
              style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: menuOpen ? 'var(--tc-muted)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tc-muted-foreground)' }}>
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setMenuOpen(false)} />
                <div style={{ position: 'absolute', right: 0, top: 34, background: 'var(--tc-card)', border: '1px solid var(--tc-muted)', borderRadius: 12, boxShadow: '0 8px 24px color-mix(in srgb, black 12%, transparent)', zIndex: 101, minWidth: 160, overflow: 'hidden' }}>
                  {[
                    { icon: Edit, label: 'Edit', action: () => { onEdit(); setMenuOpen(false); }, color: 'var(--tc-foreground)' },
                    { icon: Copy, label: 'Duplicate', action: () => { onDuplicate(); setMenuOpen(false); }, color: 'var(--tc-foreground)' },
                    { icon: ExternalLink, label: 'Share Link', action: () => { onShare(); setMenuOpen(false); }, color: 'var(--tc-primary)' },
                    { icon: Archive, label: 'Archive', action: () => { onArchive(); setMenuOpen(false); }, color: 'var(--tc-warning)' },
                    { icon: Trash2, label: 'Delete', action: () => { onDelete(); setMenuOpen(false); }, color: 'var(--tc-destructive)' },
                  ].map(({ icon: Icon, label, action, color }) => (
                    <button key={label} onClick={action}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', fontSize: 13, fontWeight: 500, color, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--tc-background)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '12px 0 10px' }}>
          {pkg.original_price && (
            <span style={{ fontSize: 14, color: 'var(--tc-muted-foreground)', textDecoration: 'line-through' }}>${pkg.original_price}</span>
          )}
          <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--tc-foreground)', letterSpacing: '-0.03em' }}>
            ${Number(pkg.price || 0).toLocaleString()}
          </span>
          <span style={{ fontSize: 11, color: 'var(--tc-muted-foreground)' }}>
            {pkg.billing_type === 'one_time' ? '' : `/ ${pkg.billing_type === 'monthly' ? 'mo' : pkg.billing_type === 'quarterly' ? 'qtr' : pkg.billing_type === 'annual' ? 'yr' : 'custom'}`}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 9999, background: billingColor.bg, color: billingColor.color }}>
            {billing}
          </span>
        </div>

        {/* Duration */}
        {pkg.duration_weeks > 0 && (
          <div style={{ fontSize: 11, color: 'var(--tc-muted-foreground)', marginBottom: 10 }}>⏱ {pkg.duration_weeks}-week program</div>
        )}

        {/* Inclusions preview */}
        {previewInclusions.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {previewInclusions.map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <Check size={11} color="var(--tc-success)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--tc-foreground)' }}>{item}</span>
              </div>
            ))}
            {remaining > 0 && (
              <div style={{ fontSize: 11, color: 'var(--tc-muted-foreground)', marginTop: 2 }}>+{remaining} more included</div>
            )}
          </div>
        )}

        {/* Enrolled chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Users size={13} color="var(--tc-muted-foreground)" />
          <span style={{ fontSize: 12, color: 'var(--tc-muted-foreground)' }}>{pkg.enrolled_count || 0} clients enrolled</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--tc-background)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {/* Active toggle */}
        <button onClick={onToggleActive}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: pkg.is_active ? 'var(--tc-success)' : 'var(--tc-muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {pkg.is_active ? <ToggleRight size={18} color="var(--tc-success)" /> : <ToggleLeft size={18} color="var(--tc-muted-foreground)" />}
          {pkg.is_active ? 'Active' : 'Inactive'}
        </button>

        {/* Share button */}
        <button onClick={onShare}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, background: 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))', color: 'var(--tc-primary-foreground)', border: 'none', cursor: 'pointer' }}>
          <ExternalLink size={12} /> Share
        </button>
      </div>
    </div>
  );
}