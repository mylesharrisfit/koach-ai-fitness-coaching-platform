import React from 'react';
import { Users, MessageCircle, UserPlus, BarChart2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

function adherenceColor(v) {
  if (v >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', bar: '#22C55E' };
  if (v >= 60) return { text: 'text-amber-600', bg: 'bg-amber-50', bar: '#F59E0B' };
  return { text: 'text-red-500', bg: 'bg-red-50', bar: '#EF4444' };
}

// Placeholder assigned clients — in real usage pass as prop from query
const DEMO_CLIENTS = [];

export default function PlanDetailSidebar({ plan, onAssign }) {
  const clients = DEMO_CLIENTS;
  const avgAdherence = clients.length
    ? Math.round(clients.reduce((s, c) => s + c.adherence, 0) / clients.length)
    : 0;

  return (
    <div className="space-y-5">
      {/* ── Assigned Clients ───────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Assigned Clients
          </h4>
          {clients.length > 0 && (
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{clients.length}</span>
          )}
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-6 bg-secondary/30 rounded-xl">
            <Users className="w-7 h-7 text-muted-foreground/40 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No clients assigned yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map((c, i) => {
              const colors = adherenceColor(c.adherence);
              return (
                <div key={i} className="flex items-center gap-2.5 p-2.5 bg-white border border-[#E7EAF3] rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {c.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${colors.bg} ${colors.text}`}>
                        {c.adherence}%
                      </div>
                      {c.lastLog && <span className="text-[10px] text-muted-foreground">{c.lastLog}</span>}
                    </div>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <Button
          size="sm"
          className="w-full mt-3 gap-1.5 text-xs h-8 bg-gradient-to-r from-primary to-blue-500 text-white border-0"
          onClick={onAssign}
        >
          <UserPlus className="w-3.5 h-3.5" /> Assign to New Client
        </Button>
      </div>

      {/* ── Plan Stats ─────────────────────────────── */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
          <BarChart2 className="w-3.5 h-3.5" /> Plan Stats
        </h4>
        <div className="space-y-2">
          {[
            { label: 'Total assigned', value: `${clients.length} client${clients.length !== 1 ? 's' : ''}` },
            { label: 'Avg. adherence', value: clients.length ? `${avgAdherence}%` : '—' },
            { label: 'Meals configured', value: `${(plan.meals || []).length}` },
            { label: 'Supplements', value: `${(plan.supplements || []).length}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-xs font-bold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}