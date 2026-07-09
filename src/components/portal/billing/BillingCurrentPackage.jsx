import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Settings } from 'lucide-react';
import { format, addMonths } from 'date-fns';

const BILLING_LABEL = { one_time: 'One-time', monthly: '/mo', quarterly: '/quarter', annual: '/year', custom: '' };

function InclusionRow({ label }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
      <span className="text-white/60 text-xs">{label}</span>
    </div>
  );
}

export default function BillingCurrentPackage({ client, packages, invoices, onManage }) {
  const [expanded, setExpanded] = useState(false);

  // Find the most recent paid invoice to infer package
  const paidInvoices = invoices.filter(i => i.status === 'paid').sort((a, b) => new Date(b.paid_date) - new Date(a.paid_date));
  const latestPaid = paidInvoices[0];

  // Try to find a matching package
  const pkg = packages.find(p => p.name === latestPaid?.description?.split(' — ')[0]) || packages.find(p => p.is_active) || null;

  const monthlyRate = client?.monthly_rate;
  const billingStatus = client?.billing_status || 'none';

  if (!monthlyRate && !pkg) {
    return (
      <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-white/40 text-sm">No active package</p>
        <p className="text-white/25 text-xs mt-1">Your coach will set up your billing soon.</p>
      </div>
    );
  }

  const statusColor = billingStatus === 'active' ? 'rgb(var(--success))' : billingStatus === 'past_due' ? 'rgb(var(--warning))' : 'rgb(var(--muted-foreground))';
  const statusLabel = billingStatus === 'active' ? 'Active' : billingStatus === 'past_due' ? 'Past Due' : billingStatus === 'cancelled' ? 'Cancelled' : 'Inactive';

  const nextBilling = addMonths(new Date(), 1);

  const inclusions = pkg ? Object.entries(pkg.inclusions || {}).filter(([, v]) => v === true).map(([k]) =>
    k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  ) : [];
  const customInclusions = pkg?.custom_inclusions || [];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(17,24,39,0.8))', border: '1px solid rgba(37,99,235,0.25)' }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>
                ● {statusLabel}
              </span>
            </div>
            <p className="text-white font-bold text-base">{pkg?.name || 'Coaching Plan'}</p>
            <p className="text-white/40 text-xs mt-0.5">with your coach</p>
          </div>
          <div className="text-right">
            <p className="text-white font-black text-xl">${monthlyRate || pkg?.price || 0}</p>
            <p className="text-white/40 text-xs">{pkg ? BILLING_LABEL[pkg.billing_type] : '/mo'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between py-2.5 px-3 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <span className="text-white/50 text-xs">Next payment</span>
          <span className="text-white text-xs font-bold">{format(nextBilling, 'MMM d, yyyy')}</span>
        </div>

        {(inclusions.length > 0 || customInclusions.length > 0) && (
          <button onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between py-2 text-xs font-semibold text-white/50 hover:text-white/70 transition-colors">
            <span>What's included</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}

        {expanded && (
          <div className="pt-1 pb-2 border-t border-white/10">
            {inclusions.map(inc => <InclusionRow key={inc} label={inc} />)}
            {customInclusions.map(inc => <InclusionRow key={inc} label={inc} />)}
          </div>
        )}

        <button onClick={onManage}
          className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Settings className="w-3.5 h-3.5" />
          Manage Subscription
        </button>
      </div>
    </div>
  );
}