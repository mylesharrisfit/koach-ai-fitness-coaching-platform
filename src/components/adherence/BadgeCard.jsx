import React from 'react';
import { motion } from 'framer-motion';
import { BADGE_CONFIG, TIER_STYLES } from '@/lib/badges';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function BadgeCard({ badgeKey, earned = false, earnedDate, clientCount = 0, onClick }) {
  const cfg = BADGE_CONFIG[badgeKey];
  if (!cfg) return null;
  const tier = TIER_STYLES[cfg.tier] || TIER_STYLES.bronze;

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all w-full',
        earned
          ? cn(tier.bg, tier.border, 'shadow-sm')
          : 'bg-[#F9FAFB] border-[#E5E7EB] opacity-50 grayscale'
      )}
    >
      <span className="text-3xl leading-none">{cfg.emoji}</span>
      <p className={cn('text-xs font-semibold leading-tight', earned ? 'text-[#111827]' : 'text-[#6B7280]')}>
        {cfg.label}
      </p>
      <span className={cn('text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border', tier.bg, tier.border, tier.text)}>
        {tier.label}
      </span>
      <p className="text-[10px] text-[#9CA3AF] leading-tight">{cfg.desc}</p>
      {earnedDate && (
        <p className="text-[9px] text-[#6B7280]">{format(new Date(earnedDate), 'MMM d, yyyy')}</p>
      )}
      {clientCount > 0 && (
        <span className="text-[9px] bg-white border border-[#E5E7EB] text-[#6B7280] px-1.5 py-0.5 rounded-full">
          {clientCount} client{clientCount !== 1 ? 's' : ''} earned
        </span>
      )}
      {!earned && clientCount === 0 && (
        <span className="text-[9px] text-[#9CA3AF]">Not yet earned</span>
      )}
    </motion.button>
  );
}