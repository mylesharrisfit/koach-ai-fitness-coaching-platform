import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, ChevronDown, ChevronUp, MessageSquare, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getAtRiskClients, SEVERITY_CONFIG } from '@/lib/riskEngine';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

function RiskScoreRing({ score }) {
  const color = score >= 60 ? 'text-destructive' : score >= 30 ? 'text-chart-4' : 'text-muted-foreground';
  return (
    <div className={cn('w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0', color,
      score >= 60 ? 'border-destructive/40 bg-destructive/10' : score >= 30 ? 'border-chart-4/40 bg-chart-4/10' : 'border-border bg-secondary'
    )}>
      {score}
    </div>
  );
}

function ClientRiskRow({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const { client, flags, riskScore, lastCheckInDate } = entry;
  const highFlags = flags.filter(f => f.severity === 'high');
  const otherFlags = flags.filter(f => f.severity !== 'high');

  return (
    <div className="rounded-xl border border-border bg-secondary/30 overflow-hidden transition-all">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/60 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <RiskScoreRing score={riskScore} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{client.name}</p>
            {highFlags.length > 0 && (
              <span className="text-[10px] font-semibold bg-destructive/15 text-destructive px-1.5 py-0.5 rounded border border-destructive/20">
                {highFlags.length} critical
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lastCheckInDate
              ? `Last check-in ${formatDistanceToNow(parseISO(lastCheckInDate), { addSuffix: true })}`
              : 'No check-ins recorded'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{flags.length} flag{flags.length !== 1 ? 's' : ''}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-3 pb-3 pt-2 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {flags.map(flag => (
              <span
                key={flag.key}
                title={flag.detail}
                className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full border', SEVERITY_CONFIG[flag.severity].color)}
              >
                {flag.label}
              </span>
            ))}
          </div>
          {flags.some(f => f.detail) && (
            <ul className="space-y-1">
              {flags.map(flag => flag.detail && (
                <li key={flag.key} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className={cn('w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0', {
                    'bg-destructive': flag.severity === 'high',
                    'bg-chart-4': flag.severity === 'medium',
                    'bg-muted-foreground': flag.severity === 'low',
                  })} />
                  {flag.detail}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 pt-1">
            <Link to="/messages" className="flex-1">
              <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5">
                <MessageSquare className="w-3 h-3" /> Message
              </Button>
            </Link>
            <Link to="/checkin-review" className="flex-1">
              <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5">
                <Calendar className="w-3 h-3" /> Check-in
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AtRiskClients({ clients, checkIns }) {
  const [showAll, setShowAll] = useState(false);
  const atRisk = getAtRiskClients(clients, checkIns);
  const displayed = showAll ? atRisk : atRisk.slice(0, 4);

  return (
    <div className={cn('bg-card rounded-2xl p-4 sm:p-6 border', atRisk.length > 0 ? 'border-destructive/25' : 'border-border')}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', atRisk.length > 0 ? 'bg-destructive/20' : 'bg-secondary')}>
            <AlertTriangle className={cn('w-4 h-4', atRisk.length > 0 ? 'text-destructive' : 'text-muted-foreground')} />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider">Needs Attention</h2>
        </div>
        {atRisk.length > 0 && (
          <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-semibold">
            {atRisk.length} client{atRisk.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {atRisk.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
            <span className="text-lg">🎉</span>
          </div>
          <p className="text-sm font-medium">All clients on track</p>
          <p className="text-xs text-muted-foreground mt-0.5">No risk flags detected this week</p>
        </div>
      ) : (
        <>
          {/* Risk breakdown bar */}
          <div className="flex gap-3 mb-4 text-xs">
            {[
              { label: 'High Risk', count: atRisk.filter(e => e.riskScore >= 60).length, color: 'text-destructive' },
              { label: 'Medium Risk', count: atRisk.filter(e => e.riskScore >= 30 && e.riskScore < 60).length, color: 'text-chart-4' },
              { label: 'Monitoring', count: atRisk.filter(e => e.riskScore < 30).length, color: 'text-muted-foreground' },
            ].filter(b => b.count > 0).map(b => (
              <div key={b.label} className="flex items-center gap-1">
                <span className={cn('font-bold text-sm', b.color)}>{b.count}</span>
                <span className="text-muted-foreground">{b.label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {displayed.map(entry => (
              <ClientRiskRow key={entry.client.id} entry={entry} />
            ))}
          </div>

          {atRisk.length > 4 && (
            <Button
              variant="ghost" size="sm"
              className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowAll(s => !s)}
            >
              {showAll ? 'Show less' : `Show ${atRisk.length - 4} more`}
              {showAll ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </Button>
          )}
        </>
      )}

      <Link to="/progress">
        <Button variant="ghost" size="sm" className="w-full mt-3 text-muted-foreground hover:text-foreground text-xs">
          View All Progress <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
}