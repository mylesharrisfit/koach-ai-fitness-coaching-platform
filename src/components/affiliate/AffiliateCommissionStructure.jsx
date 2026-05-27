import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TIERS = [
  { tier: 'Bronze', min: 0, max: 10, rate: 20 },
  { tier: 'Silver', min: 11, max: 25, rate: 25 },
  { tier: 'Gold', min: 26, max: 50, rate: 30 },
  { tier: 'Platinum', min: 51, max: null, rate: 35 },
];

const PLANS = [
  { name: 'Starter', price: 99 },
  { name: 'Pro', price: 149 },
  { name: 'Elite', price: 199 },
  { name: 'Enterprise', price: 299 },
];

export default function AffiliateCommissionStructure({ profile }) {
  const [selectedPlan, setSelectedPlan] = useState(149);
  const [referralCount, setReferralCount] = useState(profile.active_referrals || 5);

  const monthlyEarnings = referralCount * selectedPlan * (profile.commission_rate / 100);

  return (
    <div className="space-y-8">
      {/* Tier breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-black text-slate-900 mb-6">Commission Tiers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((t, i) => {
            const isCurrentTier = profile.active_referrals >= t.min && (t.max === null || profile.active_referrals <= t.max);
            return (
              <motion.div key={i}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  isCurrentTier
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white'
                }`}>
                <p className="font-bold text-slate-900">{t.tier}</p>
                <p className="text-sm text-slate-600 mt-1">{t.min}-{t.max === null ? '∞' : t.max} referrals</p>
                <p className="text-2xl font-black mt-3" style={{ color: isCurrentTier ? '#2563EB' : '#64748B' }}>
                  {t.rate}%
                </p>
                {isCurrentTier && (
                  <p className="text-xs font-bold text-blue-600 mt-2">✓ Current Tier</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Calculator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-black text-slate-900 mb-4">Earnings Calculator</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Plan: {selectedPlan === 99 ? 'Starter' : selectedPlan === 149 ? 'Pro' : selectedPlan === 199 ? 'Elite' : 'Enterprise'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLANS.map(p => (
                <button key={p.price} onClick={() => setSelectedPlan(p.price)}
                  className={`px-3 py-2 rounded-lg font-bold text-sm border transition-all ${
                    selectedPlan === p.price
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-900 hover:border-blue-300'
                  }`}>
                  {p.name}<br/><span className="text-xs">${p.price}/mo</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Number of Referrals
            </label>
            <div className="flex items-center gap-4">
              <input type="range" min="1" max="100" value={referralCount} onChange={(e) => setReferralCount(parseInt(e.target.value))}
                className="flex-1" />
              <span className="text-2xl font-black text-blue-600 min-w-[60px]">{referralCount}</span>
            </div>
          </div>

          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            className="mt-6 p-4 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}>
            <p className="text-white/80 text-sm">Monthly Recurring Revenue</p>
            <p className="text-4xl font-black text-white mt-1">
              ${monthlyEarnings.toFixed(2)}/month
            </p>
            <p className="text-white/60 text-xs mt-2">@ {profile.commission_rate}% commission rate</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}