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
  one_time: { bg: '#F3F4F6', color: '#374151' },
  monthly: { bg: '#EFF6FF', color: '#2563EB' },
  quarterly: { bg: '#F5F3FF', color: '#7C3AED' },
  annual: { bg: '#F0FDF4', color: '#16A34A' },
  custom: { bg: '#FFFBEB', color: '#D97706' },
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
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #F3F4F6',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.2s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.09)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'}
    >
      {/* Color stripe */}
      <div style={{ height: 5, background: pkg.color_theme || '#2563EB' }} />

      {/* Body */}
      <div style={{ padding: '16px 18px', flex: 1 }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111', margin: 0, lineHeight: 1.3 }}>{pkg.name}</h3>
            {pkg.description && (
              <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {pkg.description}
              </p>
            )}
          </div>
          {/* 3-dot menu */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(o => !o)}
              style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: menuOpen ? '#F3F4F6' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setMenuOpen(false)} />
                <div style={{ position: 'absolute', right: 0, top: 34, background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 101, minWidth: 160, overflow: 'hidden' }}>
                  {[
                    { icon: Edit, label: 'Edit', action: () => { onEdit(); setMenuOpen(false); }, color: '#374151' },
                    { icon: Copy, label: 'Duplicate', action: () => { onDuplicate(); setMenuOpen(false); }, color: '#374151' },
                    { icon: ExternalLink, label: 'Share Link', action: () => { onShare(); setMenuOpen(false); }, color: '#2563EB' },
                    { icon: Archive, label: 'Archive', action: () => { onArchive(); setMenuOpen(false); }, color: '#D97706' },
                    { icon: Trash2, label: 'Delete', action: () => { onDelete(); setMenuOpen(false); }, color: '#DC2626' },
                  ].map(({ icon: Icon, label, action, color }) => (
                    <button key={label} onClick={action}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', fontSize: 13, fontWeight: 500, color, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
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
            <span style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'line-through' }}>${pkg.original_price}</span>
          )}
          <span style={{ fontSize: 26, fontWeight: 900, color: '#111', letterSpacing: '-0.03em' }}>
            ${Number(pkg.price || 0).toLocaleString()}
          </span>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>
            {pkg.billing_type === 'one_time' ? '' : `/ ${pkg.billing_type === 'monthly' ? 'mo' : pkg.billing_type === 'quarterly' ? 'qtr' : pkg.billing_type === 'annual' ? 'yr' : 'custom'}`}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 9999, background: billingColor.bg, color: billingColor.color }}>
            {billing}
          </span>
        </div>

        {/* Duration */}
        {pkg.duration_weeks > 0 && (
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 10 }}>⏱ {pkg.duration_weeks}-week program</div>
        )}

        {/* Inclusions preview */}
        {previewInclusions.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {previewInclusions.map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <Check size={11} color="#16A34A" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#374151' }}>{item}</span>
              </div>
            ))}
            {remaining > 0 && (
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>+{remaining} more included</div>
            )}
          </div>
        )}

        {/* Enrolled chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Users size={13} color="#6B7280" />
          <span style={{ fontSize: 12, color: '#6B7280' }}>{pkg.enrolled_count || 0} clients enrolled</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid #F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {/* Active toggle */}
        <button onClick={onToggleActive}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: pkg.is_active ? '#16A34A' : '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {pkg.is_active ? <ToggleRight size={18} color="#16A34A" /> : <ToggleLeft size={18} color="#9CA3AF" />}
          {pkg.is_active ? 'Active' : 'Inactive'}
        </button>

        {/* Share button */}
        <button onClick={onShare}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: '#fff', border: 'none', cursor: 'pointer' }}>
          <ExternalLink size={12} /> Share
        </button>
      </div>
    </div>
  );
}