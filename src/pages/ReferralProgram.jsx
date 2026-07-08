import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const TIERS = [
  { min: 0, max: 5, rate: 50, emoji: '🌱' },
  { min: 6, max: 10, rate: 75, emoji: '🚀' },
  { min: 11, max: Infinity, rate: 100, emoji: '⭐' },
];

function getTierInfo(referrals) {
  return TIERS.find(t => referrals >= t.min && referrals <= t.max) || TIERS[2];
}

function getNextTier(referrals) {
  if (referrals < 6) return TIERS[1];
  if (referrals < 11) return TIERS[2];
  return null;
}

function maskEmail(email) {
  const [name, domain] = email.split('@');
  return `${name[0]}***@${domain}`;
}

export default function ReferralProgram({ user }) {
  const [expandedTerms, setExpandedTerms] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: program } = useQuery({
    queryKey: ['referral-program', user?.email],
    queryFn: () => base44.entities.ReferralProgram.filter({ coach_email: user?.email }, '', 1).then(r => r[0]),
    enabled: !!user?.email,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals', user?.email],
    queryFn: () => base44.entities.Referral.filter({ referrer_email: user?.email }, '-date_referred', 100),
    enabled: !!user?.email,
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['referral-payouts', user?.email],
    queryFn: () => base44.entities.ReferralPayout.filter({ coach_email: user?.email }, '-requested_date', 50),
    enabled: !!user?.email,
  });

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied! ✓');
  };

  const handleShare = (platform) => {
    const link = program?.referral_link || '';
    const message = `Hey! I use KOACH AI to run my entire online coaching business. Use my link to get started: ${link}`;
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
      email: `mailto:?subject=Check out KOACH AI&body=${encodeURIComponent(message)}`,
    };
    if (navigator.share && platform === 'whatsapp') {
      navigator.share({ text: message });
    } else if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
  };

  const currentTier = getTierInfo(program?.total_referrals || 0);
  const nextTier = getNextTier(program?.total_referrals || 0);
  const progressToNext = nextTier
    ? ((program?.total_referrals || 0) - (nextTier.min - 1)) / (nextTier.max - nextTier.min + 1)
    : 100;

  const filteredReferrals = filterStatus === 'all' 
    ? referrals 
    : referrals.filter(r => r.status === filterStatus);

  return (
    <div className="pb-20 bg-gradient-to-b from-white to-slate-50">
      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-8 rounded-b-3xl text-white text-center"
        style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.25)' }}>
        <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Earn Passive Income</p>
        <h1 className="text-3xl font-black mb-2">Earn with every coach you refer 💰</h1>
        <p className="text-white/80 text-sm mb-4">Get $50 for every coach who signs up and stays for 30 days</p>
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {TIERS.map(t => (
            <span key={t.min} className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
              {t.emoji} {t.min}-{t.max}: ${t.rate}/ref
            </span>
          ))}
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="px-4 mt-6 grid grid-cols-2 gap-3">
        {[
          { label: 'Total Earned', value: `$${program?.total_earned || 0}`, color: '#10B981', icon: '$' },
          { label: 'Pending', value: `$${program?.pending_balance || 0}`, color: '#F59E0B', icon: '⏳' },
          { label: 'This Month', value: `$${program?.month_earnings || 0}`, color: '#2563EB', icon: '📊' },
          { label: 'Referrals', value: program?.total_referrals || 0, color: '#7C3AED', icon: '👥' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
            <p className="text-slate-500 text-xs font-semibold mb-1">{stat.label}</p>
            <p className="text-slate-900 font-black text-xl">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Referral Links */}
      <div className="px-4 mt-6">
        <h2 className="text-slate-900 font-black text-lg mb-3">Your Referral Links</h2>
        <div className="bg-white rounded-2xl p-4 space-y-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
          {/* Referral Link */}
          <div>
            <p className="text-slate-500 text-xs font-bold mb-2">Full Link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 rounded-xl text-sm font-mono text-slate-700 bg-slate-50 border border-slate-200 truncate">
                {program?.referral_link || 'Loading...'}
              </div>
              <button onClick={() => handleCopy(program?.referral_link || '')}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <Copy className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>

          {/* Referral Code */}
          <div>
            <p className="text-slate-500 text-xs font-bold mb-2">Code</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 rounded-xl text-lg font-black text-slate-900 bg-blue-50 border border-blue-200 text-center">
                {program?.referral_code || 'LOADING'}
              </div>
              <button onClick={() => handleCopy(program?.referral_code || '')}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <Copy className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Options */}
      <div className="px-4 mt-6">
        <h2 className="text-slate-900 font-black text-lg mb-3">Share & Earn</h2>
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: '🐦', label: 'Twitter', key: 'twitter' },
              { icon: '📘', label: 'Facebook', key: 'facebook' },
              { icon: '💼', label: 'LinkedIn', key: 'linkedin' },
              { icon: '📧', label: 'Email', key: 'email' },
              { icon: '💬', label: 'WhatsApp', key: 'whatsapp' },
              { icon: '📋', label: 'Copy', key: 'copy' },
            ].map(s => (
              <button key={s.key}
                onClick={() => s.key === 'copy' ? handleCopy(`Hey! I use KOACH AI to run my entire online coaching business. Programs, nutrition plans, check-ins, payments — all in one place. Use my link to get started: ${program?.referral_link}`) : handleShare(s.key)}
                className="py-3 rounded-xl flex flex-col items-center gap-1 text-xs font-bold transition-all hover:bg-slate-50"
                style={{ border: '1px solid #F1F5F9' }}>
                <span className="text-lg">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      {nextTier && (
        <div className="px-4 mt-6">
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-900 font-bold">Next Tier Unlocking</p>
              <span className="text-sm font-bold text-slate-500">{nextTier.min - (program?.total_referrals || 0)} more referrals</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <motion.div animate={{ width: `${progressToNext * 100}%` }} transition={{ duration: 0.5 }}
                className="h-full" style={{ background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }} />
            </div>
            <p className="text-xs text-slate-500 mt-2">Unlock {nextTier.emoji} ${nextTier.rate}/referral tier</p>
          </div>
        </div>
      )}

      {/* Referrals List */}
      <div className="px-4 mt-6">
        <h2 className="text-slate-900 font-black text-lg mb-3">Referral Tracker</h2>
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {['all', 'signed_up', 'active_30_days', 'paid', 'expired'].map(status => (
            <button key={status}
              onClick={() => setFilterStatus(status)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
              style={{
                background: filterStatus === status ? '#2563EB' : '#F1F5F9',
                color: filterStatus === status ? 'white' : '#64748B',
              }}>
              {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {filteredReferrals.map(ref => (
            <motion.div key={ref.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-slate-900 font-bold text-sm">{ref.referred_coach_name}</p>
                  <p className="text-slate-400 text-xs">{maskEmail(ref.referred_coach_email)}</p>
                  <p className="text-slate-500 text-[10px] mt-1">{new Date(ref.date_referred).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-900 font-black text-sm">${ref.commission_amount}</p>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full inline-block mt-1"
                    style={{
                      background: { signed_up: '#DBEAFE', active_30_days: '#D1FAE5', paid: '#F3F4F6', expired: '#FEE2E2' }[ref.status],
                      color: { signed_up: '#0369A1', active_30_days: '#065F46', paid: '#374151', expired: '#991B1B' }[ref.status],
                    }}>
                    {ref.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payout Section */}
      <div className="px-4 mt-6 mb-6">
        <h2 className="text-slate-900 font-black text-lg mb-3">Payout</h2>
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
          <div>
            <p className="text-slate-500 text-xs font-bold mb-1">Available Balance</p>
            <p className="text-slate-900 font-black text-2xl">${program?.pending_balance || 0}</p>
            <p className="text-slate-400 text-xs mt-1">Minimum payout: $50</p>
          </div>
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={!program || program.pending_balance < 50}
            className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ background: program?.pending_balance >= 50 ? 'linear-gradient(135deg, #2563EB, #7C3AED)' : '#D1D5DB' }}>
            Request Payout
          </button>
        </div>

        {/* Payout History */}
        <div className="mt-6">
          <h3 className="text-slate-900 font-bold text-base mb-3">Payout History</h3>
          <div className="space-y-2">
            {payouts.map(p => (
              <div key={p.id} className="bg-white rounded-xl p-3 flex items-center justify-between text-sm"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
                <div>
                  <p className="text-slate-900 font-bold">${p.amount}</p>
                  <p className="text-slate-400 text-xs">{new Date(p.requested_date).toLocaleDateString()}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: p.status === 'paid' ? '#D1FAE5' : '#FEF3C7', color: p.status === 'paid' ? '#065F46' : '#92400E' }}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="px-4 pb-6">
        <button onClick={() => setExpandedTerms(!expandedTerms)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-slate-200"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="font-bold text-slate-900 text-sm">Referral Program Terms</p>
          {expandedTerms ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {expandedTerms && (
          <div className="mt-2 bg-white rounded-xl p-4 text-xs text-slate-600 space-y-2 border border-slate-200">
            <p>• Referred coach must sign up using your unique link</p>
            <p>• Must remain active for 30 days to earn commission</p>
            <p>• Commissions paid after 30-day retention period</p>
            <p>• No self-referrals or fraudulent activity</p>
            <p>• KOACH AI reserves right to modify program terms</p>
            <a href="/terms" className="text-blue-600 font-bold">View full terms →</a>
          </div>
        )}
      </div>
    </div>
  );
}