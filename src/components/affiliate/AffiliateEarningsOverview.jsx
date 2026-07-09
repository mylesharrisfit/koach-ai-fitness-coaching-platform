import React from 'react';
import { motion } from 'framer-motion';

export default function AffiliateEarningsOverview({ profile }) {
  const cards = [
    {
      label: 'Total Earned',
      value: `$${profile.total_earned.toFixed(2)}`,
      color: 'var(--tc-success)',
      lightBg: 'var(--tc-success)',
      icon: '💵',
    },
    {
      label: 'This Month',
      value: `$${profile.month_earnings.toFixed(2)}`,
      color: 'var(--tc-primary)',
      lightBg: 'var(--tc-accent)',
      icon: '📅',
    },
    {
      label: 'Pending Clearance',
      value: `$${profile.pending_balance.toFixed(2)}`,
      color: 'var(--tc-warning)',
      lightBg: 'var(--tc-warning)',
      icon: '⏳',
    },
    {
      label: 'Active Referrals',
      value: profile.active_referrals,
      color: 'var(--tc-ai)',
      lightBg: 'var(--tc-ai)',
      icon: '👥',
    },
    {
      label: 'Conversion Rate',
      value: `${(profile.conversion_rate || 0).toFixed(1)}%`,
      color: 'var(--kc-ec4899)',
      lightBg: 'var(--kc-fce7f3)',
      icon: '🎯',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
          className="rounded-2xl p-5 border border-border"
          style={{ background: card.lightBg }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{card.icon}</span>
            <p className="text-xs font-bold text-muted-foreground uppercase">{card.label}</p>
          </div>
          <p className="text-2xl font-black" style={{ color: card.color }}>
            {card.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}