import React, { useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { Zap, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function TrialBanner({ user }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (!user || dismissed) return null;

  const billingStatus = user.billing_status;
  const isPastDue = ['past_due', 'unpaid', 'incomplete'].includes(billingStatus);
  const isTrialing = billingStatus === 'trialing';

  // Trial banner
  if (isTrialing && user.subscription_renewal_date) {
    const daysLeft = differenceInDays(parseISO(user.subscription_renewal_date), new Date());
    if (daysLeft < 0) return null;

    const urgency = daysLeft <= 3;

    return (
      <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm mb-5 ${
        urgency
          ? 'bg-amber-500/10 border border-amber-500/30'
          : 'bg-blue-500/10 border border-blue-500/20'
      }`}>
        <div className={`flex items-center gap-2 ${urgency ? 'text-amber-300' : 'text-blue-300'}`}>
          <Zap className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">
            🎉 You're on a free trial —{' '}
            <span className="font-bold">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</span>
            {urgency && ' · Trial ending soon!'}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/subscription')}
            className="text-xs font-bold text-white px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)' }}
          >
            Upgrade Now
          </button>
          <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Past-due banner — not dismissable
  if (isPastDue) {
    const handleFixPayment = async () => {
      const res = await base44.functions.invoke('stripeCheckout', {
        action: 'portal',
        cancel_url: window.location.href,
      });
      if (res.data?.url) window.open(res.data.url, '_blank');
    };

    return (
      <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm mb-5 bg-red-500/10 border border-red-500/30">
        <div className="flex items-center gap-2 text-red-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">
            ⚠️ Payment failed — please update your billing info to keep your account active
          </span>
        </div>
        <button
          onClick={handleFixPayment}
          className="flex items-center gap-1.5 text-xs font-bold text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0"
        >
          <ExternalLink className="w-3 h-3" /> Fix Payment
        </button>
      </div>
    );
  }

  return null;
}