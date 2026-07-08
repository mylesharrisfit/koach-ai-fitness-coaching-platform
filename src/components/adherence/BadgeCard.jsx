import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BADGE_CONFIG, TIER_STYLES } from '@/lib/badges';
import { format } from 'date-fns';
import { Lock } from 'lucide-react';

// Inline keyframes injected once
const SHIMMER_STYLE = `
@keyframes badgeShimmer {
  0%   { transform: translateX(-120%) skewX(-20deg); }
  100% { transform: translateX(220%) skewX(-20deg); }
}
@keyframes borderPulse {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}
@keyframes eliteGlow {
  0%, 100% { box-shadow: 0 0 16px 3px rgba(37,99,235,0.45), 0 0 40px 6px rgba(120,60,255,0.25); }
  50%       { box-shadow: 0 0 28px 8px rgba(37,99,235,0.7),  0 0 60px 12px rgba(120,60,255,0.45); }
}
`;

let styleInjected = false;
function injectStyle() {
  if (styleInjected || typeof document === 'undefined') return;
  const s = document.createElement('style');
  s.textContent = SHIMMER_STYLE;
  document.head.appendChild(s);
  styleInjected = true;
}
injectStyle();

export default function BadgeCard({ badgeKey, earned = false, earnedDate, clientCount = 0, onClick, progress, progressMax, light = false }) {
  const [hovered, setHovered] = useState(false);
  const cfg = BADGE_CONFIG[badgeKey];
  if (!cfg) return null;
  const tier = TIER_STYLES[cfg.tier] || TIER_STYLES.bronze;
  const isElite = cfg.tier === 'elite';
  const showProgress = !earned && progress != null && progressMax != null;
  const progressPct = showProgress ? Math.min(100, Math.round((progress / progressMax) * 100)) : 0;

  const cardStyle = earned ? {
    background: `radial-gradient(ellipse at 30% 20%, ${tier.bg}ee 0%, ${tier.bg} 100%)`,
    border: `1px solid ${hovered ? tier.accent : tier.border}`,
    boxShadow: hovered
      ? `0 0 24px 6px ${tier.glowHover}, 0 8px 32px rgba(0,0,0,0.5)`
      : `0 0 14px 2px ${tier.glow}, 0 4px 16px rgba(0,0,0,0.4)`,
    animation: isElite ? 'eliteGlow 2.4s ease-in-out infinite' : undefined,
  } : light ? {
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  } : {
    background: '#18191F',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      style={cardStyle}
      className="relative flex flex-col items-center gap-1.5 p-3.5 rounded-2xl text-center w-full overflow-hidden cursor-pointer"
    >
      {/* Elite animated border */}
      {isElite && earned && (
        <span
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, transparent 40%, rgba(37,99,235,0.25) 50%, transparent 60%)',
            animation: 'borderPulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Shimmer sweep (elite earned + hover) */}
      {isElite && earned && hovered && (
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.13) 50%, transparent 65%)',
            animation: 'badgeShimmer 0.75s ease forwards',
          }}
        />
      )}

      {/* Lock overlay for unearned */}
      {!earned && (
        <span className="absolute top-2 right-2 opacity-40">
          <Lock size={10} color={light ? '#D1D5DB' : '#9CA3AF'} />
        </span>
      )}

      {/* Emoji */}
      <motion.span
        className="text-3xl leading-none select-none"
        animate={earned ? { scale: [1, 1.12, 1] } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{ filter: earned ? 'none' : 'grayscale(1)', opacity: earned ? 1 : 0.35 }}
      >
        {cfg.emoji}
      </motion.span>

      {/* Name */}
      <p
        className="text-[11px] font-bold leading-tight"
        style={{ color: earned ? tier.text : (light ? '#111827' : '#4B5563') }}
      >
        {cfg.label}
      </p>

      {/* Tier pill */}
      <span
        className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
        style={earned
          ? { background: `${tier.accent}22`, color: tier.accent, border: `1px solid ${tier.accent}55` }
          : light
            ? { background: '#F3F4F6', color: '#9CA3AF', border: '1px solid #E5E7EB' }
            : { background: 'rgba(255,255,255,0.04)', color: '#4B5563', border: '1px solid rgba(255,255,255,0.08)' }
        }
      >
        {tier.label}
      </span>

      {/* Description */}
      <p className="text-[9px] leading-tight" style={{ color: earned ? `${tier.accent}99` : (light ? '#6B7280' : '#374151') }}>
        {cfg.desc}
      </p>

      {/* Earned date */}
      {earned && earnedDate && (
        <p className="text-[9px]" style={{ color: `${tier.accent}70` }}>
          Unlocked {format(new Date(earnedDate), 'MMM d')}
        </p>
      )}

      {/* Client count */}
      {clientCount > 0 && (
        <span
          className="text-[9px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: `${tier.accent}18`, color: tier.accent, border: `1px solid ${tier.accent}30` }}
        >
          {clientCount} earned
        </span>
      )}

      {/* Progress ring for unearned */}
      {showProgress && (
        <div className="flex flex-col items-center gap-0.5 mt-0.5">
          <div className={`w-full rounded-full h-1 overflow-hidden ${light ? 'bg-[#E5E7EB]' : 'bg-[#1F2937]'}`}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #3B82F6, #60A5FA)' }}
            />
          </div>
          <span className="text-[9px] text-[#4B5563]">{progress}/{progressMax}</span>
        </div>
      )}
    </motion.button>
  );
}