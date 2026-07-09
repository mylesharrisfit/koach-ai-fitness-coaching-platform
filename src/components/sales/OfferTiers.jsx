import React from 'react';
import { Crown, Users, Tag, TrendingUp } from 'lucide-react';

const TIERS = [
  {
    key: 'one_on_one',
    label: '1:1 Coaching',
    icon: Crown,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    desc: 'Fully personalised, highest value',
    typical: '$300–$800/mo',
  },
  {
    key: 'group',
    label: 'Group Coaching',
    icon: Users,
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    desc: 'Scalable community coaching',
    typical: '$49–$197/mo',
  },
  {
    key: 'low_ticket',
    label: 'Low Ticket',
    icon: Tag,
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    desc: 'Programs, plans, courses',
    typical: '$27–$97 one-time',
  },
];

export default function OfferTiers({ leads }) {
  const countByTier = (key) => leads.filter(l => l.offer_tier === key).length;
  const closedByTier = (key) => leads.filter(l => l.offer_tier === key && l.stage === 'active_client').length;
  const revenueByTier = (key) => leads.filter(l => l.offer_tier === key && l.stage === 'active_client').reduce((s, l) => s + (l.deal_value || 0), 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Offer Tiers</h2>
      </div>
      <div className="space-y-3">
        {TIERS.map(tier => (
          <div key={tier.key} className={`flex items-center gap-4 p-4 rounded-xl border ${tier.bg} ${tier.border}`}>
            <div className={`w-9 h-9 rounded-lg bg-card flex items-center justify-center flex-shrink-0 ${tier.border} border`}>
              <tier.icon className={`w-4 h-4 ${tier.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${tier.color}`}>{tier.label}</p>
              <p className="text-xs text-muted-foreground">{tier.desc} · {tier.typical}</p>
            </div>
            <div className="text-right flex-shrink-0 space-y-0.5">
              <p className="text-sm font-bold">{countByTier(tier.key)} leads</p>
              <p className="text-xs text-muted-foreground">{closedByTier(tier.key)} closed · ${revenueByTier(tier.key).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}