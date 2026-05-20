import React from 'react';
import { BADGE_CONFIG, TIER_STYLES } from '@/lib/badges';

export default function AchievementToast({ badge, clientName }) {
  const tier = TIER_STYLES[badge.tier] || TIER_STYLES.bronze;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl"
      style={{
        background: '#111827',
        border: `1px solid ${tier.accent}40`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 12px ${tier.glow}`,
        minWidth: 260,
        maxWidth: 320,
      }}
    >
      <span className="text-3xl leading-none flex-shrink-0">{badge.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${tier.accent}99` }}>
          Achievement Unlocked!
        </p>
        <p className="text-sm font-black text-white leading-tight">{badge.label}</p>
        {clientName && (
          <p className="text-xs mt-0.5 truncate" style={{ color: `${tier.accent}80` }}>
            {clientName} · {badge.desc}
          </p>
        )}
      </div>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base"
        style={{ background: `${tier.accent}20`, border: `1px solid ${tier.accent}40` }}
      >
        🏅
      </div>
    </div>
  );
}

// Helper: fire a toast for a single badge
export function showAchievementToast(toastFn, badgeKey, clientName) {
  const cfg = BADGE_CONFIG[badgeKey];
  if (!cfg) return;
  toastFn.custom((t) => (
    <AchievementToast badge={cfg} clientName={clientName} />
  ), { duration: 4000 });
}