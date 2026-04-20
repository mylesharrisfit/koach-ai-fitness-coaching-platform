import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, MessageSquare, ClipboardList, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getAtRiskClients, SEVERITY_CONFIG } from '@/lib/riskEngine';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { averageAdherenceScore } from '@/lib/adherence';

function AdherencePill({ score }) {
  if (score === null) return null;
  const color = score >= 75 ? 'bg-emerald-500/15 text-emerald-400' : score >= 50 ? 'bg-amber-500/15 text-amber-400' : 'bg-destructive/15 text-destructive';
  return <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', color)}>{score}%</span>;
}

function RiskClientRow({ entry, allCheckIns }) {
  const [expanded, setExpanded] = useState(false);
  const { client, flags, riskScore, lastCheckInDate } = entry;
  const highFlags = flags.filter(f => f.severity === 'high');
  const clientCheckIns = allCheckIns.filter(ci => ci.client_id === client.id);
  const avgScore = averageAdherenceScore(clientCheckIns, 3);

  const ringColor = riskScore >= 60 ? 'border-destructive/50 bg-destructive/10 text-destructive' : riskScore >= 30 ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-border bg-secondary text-muted-foreground';

  return (
    <div className={cn('rounded-xl border bg-secondary/20 overflow-hidden', highFlags.length > 0 ? 'border-destructive/25' : 'border-border')}>
      <button
        className="w-full flex items-center gap-3 p-3.5 text-left active:bg-secondary/60 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Risk score ring */}
        <div className={cn('w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0', ringColor)}>
          {riskScore}
        </div>

        {/* Client info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate">{client.name}</p>
            {highFlags.length > 0 && (
              <span className="text-[10px] font-bold bg-destructive/15 text-destructive px-1.5 py-0.5 rounded border border-destructive/20">
                {highFlags.length} critical
              </span>
            )}
          </div>
          {/* Primary flag */}
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {flags[0]?.detail || flags[0]?.label}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <AdherencePill score={avgScore} />
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-3.5 py-3 space-y-3">
          {/* All flags */}
          <div className="flex flex-wrap gap-1.5">
            {flags.map(f => (
              <span key={f.key} className={cn('text-[11px] font-medium px-2 py-1 rounded-full border', SEVERITY_CONFIG[f.severity].color)}>
                {f.label}
              </span>
            ))}
          </div>
          {/* Details */}
          <ul className="space-y-1">
            {flags.map(f => f.detail && (
              <li key={f.key} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', {
                  'bg-destructive': f.severity === 'high',
                  'bg-amber-400': f.severity === 'medium',
                  'bg-muted-foreground': f.severity === 'low',
                })} />
                {f.detail}
              </li>
            ))}
          </ul>
          {lastCheckInDate && (
            <p className="text-xs text-muted-foreground">Last check-in: {formatDistanceToNow(parseISO(lastCheckInDate), { addSuffix: true })}</p>
          )}
          {/* Actions */}
          <div className="flex gap-2">
            <Link to="/messages" className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </Button>
            </Link>
            <Link to="/checkin-review" className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                <ClipboardList className="w-3.5 h-3.5" /> Review
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NeedsAttentionWidget({ clients, checkIns }) {
  const [showAll, setShowAll] = useState(false);
  const atRisk = getAtRiskClients(clients, checkIns);
  const displayed = showAll ? atRisk : atRisk.slice(0, 4);

  const highCount = atRisk.filter(e => e.riskScore >= 60).length;
  const midCount = atRisk.filter(e => e.riskScore >= 30 && e.riskScore < 60).length;

  return (
    <div className={cn('bg-card rounded-2xl border p-4 sm:p-5', atRisk.length > 0 ? 'border-destructive/25' : 'border-border')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', atRisk.length > 0 ? 'bg-destructive/15' : 'bg-secondary')}>
            <AlertTriangle className={cn('w-4 h-4', atRisk.length > 0 ? 'text-destructive' : 'text-muted-foreground')} />
          </div>
          <div>
            <h2 className="text-sm font-bold">Needs Attention</h2>
            {atRisk.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {highCount > 0 && <span className="text-destructive font-medium">{highCount} high risk</span>}
                {highCount > 0 && midCount > 0 && <span className="text-muted-foreground"> · </span>}
                {midCount > 0 && <span className="text-amber-400 font-medium">{midCount} medium</span>}
              </p>
            )}
          </div>
        </div>
        {atRisk.length > 0 && (
          <span className="text-xs bg-destructive/15 text-destructive px-2.5 py-1 rounded-full font-bold">
            {atRisk.length}
          </span>
        )}
      </div>

      {atRisk.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-sm font-medium">All clients on track</p>
          <p className="text-xs text-muted-foreground mt-0.5">No risk flags detected</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(entry => (
            <RiskClientRow key={entry.client.id} entry={entry} allCheckIns={checkIns} />
          ))}

          {atRisk.length > 4 && (
            <Button
              variant="ghost" size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => setShowAll(s => !s)}
            >
              {showAll ? 'Show less' : `+${atRisk.length - 4} more clients`}
              {showAll ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </Button>
          )}
        </div>
      )}

      <Link to="/checkin-review">
        <Button variant="ghost" size="sm" className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground">
          View Check-in Dashboard <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
}