import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { TIERS } from '@/lib/subscription';
import confetti from 'canvas-confetti';

const PLAN_NAMES = {
  starter: 'Starter', pro: 'Pro', elite: 'Elite', enterprise: 'Enterprise',
};

export default function SuccessScreen({ tier, price, billing, nextDate, email, onClose }) {
  const navigate = useNavigate();
  const tierName = PLAN_NAMES[tier] || tier;

  useEffect(() => {
    // Fire confetti
    const end = Date.now() + 2000;
    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#ffffff'];
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0f1e] p-8 text-center shadow-2xl">
        {/* Logo / Icon */}
        <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 40px rgba(139,92,246,0.4)' }}>
          ⚡
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Welcome to {tierName}! 🎉</h2>
        <p className="text-slate-400 text-sm mb-8">Your new features are now active — let's build something great</p>

        {/* Summary card */}
        <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 mb-8 text-left space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Plan</span>
            <span className="text-white font-semibold">{tierName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Amount</span>
            <span className="text-white font-semibold">${price}/mo ({billing})</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Next billing</span>
            <span className="text-white">{nextDate}</span>
          </div>
          {email && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Receipt sent to</span>
              <span className="text-white">{email}</span>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
          >
            Explore New Features →
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-slate-300 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Receipt
          </button>
        </div>
      </div>
    </div>
  );
}