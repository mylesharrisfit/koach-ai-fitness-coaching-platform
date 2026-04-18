import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const UPSELL_OFFERS = [
  { tier: 'one_on_one', label: '1:1 Upgrade', desc: 'Move to fully personalised 1:1 coaching', value: '$500/mo' },
  { tier: 'group', label: 'Group Add-on', desc: 'Join the group coaching community', value: '$97/mo' },
  { tier: 'low_ticket', label: 'Training Plan', desc: 'Self-guided 12-week program', value: '$47 one-time' },
];

export default function UpsellPrompts({ clients, programs }) {
  // Clients whose assigned program was created > 8 weeks ago or has no assignment recently checked
  const completingClients = clients.filter(c => {
    if (c.status !== 'active') return false;
    if (!c.assigned_program_id) return true;
    const prog = programs.find(p => p.id === c.assigned_program_id);
    if (!prog) return false;
    const weeks = prog.duration_weeks || 8;
    if (!c.start_date) return false;
    const daysSinceStart = (Date.now() - new Date(c.start_date).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceStart >= weeks * 7 * 0.85;
  }).slice(0, 5);

  if (completingClients.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Upsell Opportunities</h2>
        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">{completingClients.length}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">These clients are near program completion — great time to offer an upgrade.</p>

      <div className="space-y-3">
        {completingClients.map(client => (
          <div key={client.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {client.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{client.name}</p>
              <p className="text-xs text-muted-foreground">Nearing program end · perfect time to re-enroll</p>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              {UPSELL_OFFERS.map(offer => (
                <span key={offer.tier} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                  {offer.label} {offer.value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Link to="/messages" className="block mt-4">
        <Button variant="outline" size="sm" className="w-full text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
          Message These Clients <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
}