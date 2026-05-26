import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { BADGE_CONFIG, TIER_STYLES } from '@/lib/badges';

export default function RecentWins({ badges }) {
  if (!badges?.length) return null;
  const recent = badges.slice(0, 3);

  return (
    <div className="mx-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white font-bold text-base">Recent Wins 🏆</p>
      </div>
      <div className="space-y-2">
        {recent.map((badge, i) => {
          const cfg = BADGE_CONFIG[badge.badge_key];
          const tier = cfg ? TIER_STYLES[cfg.tier] : null;
          return (
            <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
              className="flex items-center gap-3 p-3.5 rounded-2xl"
              style={{
                background: tier ? `${tier.accent}10` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${tier ? `${tier.accent}30` : 'rgba(255,255,255,0.08)'}`,
              }}>
              <span className="text-2xl flex-shrink-0">{cfg?.emoji || '🏆'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{cfg?.label || badge.badge_key}</p>
                <p className="text-white/30 text-[10px]">{badge.earned_date ? format(parseISO(badge.earned_date), 'MMM d') : ''}</p>
              </div>
              {tier && <span className="text-[10px] font-bold uppercase tracking-wide flex-shrink-0" style={{ color: tier.accent }}>{tier.label}</span>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}