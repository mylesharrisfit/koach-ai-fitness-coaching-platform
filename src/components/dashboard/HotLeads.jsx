import React from 'react';
import { Flame, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { isAfter, subDays } from 'date-fns';

export default function HotLeads({ clients }) {
  const recent = clients
    .filter(c => {
      const isProspect = c.status === 'prospect';
      const isNewActive = c.status === 'active' && c.start_date && isAfter(new Date(c.start_date), subDays(new Date(), 14));
      return isProspect || isNewActive;
    })
    .slice(0, 5);

  const goalLabels = {
    weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', strength: 'Strength',
    endurance: 'Endurance', flexibility: 'Flexibility', general_fitness: 'General Fitness'
  };

  return (
    <div className="bg-card border border-warning/30 rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-warning/20 flex items-center justify-center">
            <Flame className="w-4 h-4 text-warning" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-warning">Hot Leads</h2>
        </div>
        <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full font-medium">{recent.length}</span>
      </div>

      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No new leads right now</p>
      ) : (
        <div className="space-y-3">
          {recent.map(client => (
            <div key={client.id} className="flex items-center gap-3 p-3 rounded-xl bg-warning/5 border border-warning/10">
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-warning text-xs font-bold flex-shrink-0">
                {client.name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{client.name}</p>
                <p className="text-xs text-muted-foreground">{goalLabels[client.goal] || 'No goal set'}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                client.status === 'prospect'
                  ? 'bg-warning/20 text-warning'
                  : 'bg-success/20 text-success'
              }`}>
                {client.status === 'prospect' ? 'Prospect' : 'New'}
              </span>
            </div>
          ))}
        </div>
      )}

      <Link to="/clients" className="block mt-4">
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground text-xs">
          Manage Clients <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
}