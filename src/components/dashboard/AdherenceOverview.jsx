import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';
import { compositeAdherenceScore, scoreColor, scoreLabel } from '@/lib/adherence';
import { cn } from '@/lib/utils';

function ScoreBar({ score }) {
  const color = score >= 80 ? 'bg-success' : score >= 60 ? 'bg-warning' : 'bg-destructive';
  return (
    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${score}%` }} />
    </div>
  );
}

function ClientScoreRow({ client, score }) {
  const color = scoreColor(score);
  const dotColor = score === null ? 'bg-muted-foreground' : score >= 80 ? 'bg-success' : score >= 60 ? 'bg-warning' : 'bg-destructive';

  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', dotColor)} />
      <span className="text-xs text-foreground/80 w-24 truncate flex-shrink-0">{client.name}</span>
      {score !== null ? <ScoreBar score={score} /> : <div className="flex-1 h-1.5 bg-secondary rounded-full" />}
      <span className={cn('text-xs font-bold tabular-nums w-8 text-right flex-shrink-0', color)}>
        {score !== null ? `${score}%` : '–'}
      </span>
    </div>
  );
}

export default function AdherenceOverview({ clients, checkIns }) {
  const clientScores = useMemo(() => {
    return clients
      .filter(c => c.status === 'active' || c.lifecycle_status === 'active')
      .map(client => {
        const cis = checkIns
          .filter(ci => ci.client_id === client.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        return { client, score: compositeAdherenceScore(cis) };
      })
      .filter(x => x.score !== null)
      .sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  }, [clients, checkIns]);

  const avg = clientScores.length
    ? Math.round(clientScores.reduce((sum, x) => sum + (x.score ?? 0), 0) / clientScores.length)
    : null;

  const green  = clientScores.filter(x => x.score >= 80).length;
  const yellow = clientScores.filter(x => x.score >= 60 && x.score < 80).length;
  const red    = clientScores.filter(x => x.score < 60).length;

  const displayed = clientScores.slice(0, 6); // bottom 6 (worst first)

  return (
    <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Adherence Overview</h2>
            {avg !== null && (
              <p className={cn('text-xs font-semibold', scoreColor(avg))}>
                Team avg: {avg}% · {scoreLabel(avg)}
              </p>
            )}
          </div>
        </div>

        {/* Traffic lights */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block"/><span className="text-muted-foreground">{green}</span></span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block"/><span className="text-muted-foreground">{yellow}</span></span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive inline-block"/><span className="text-muted-foreground">{red}</span></span>
        </div>
      </div>

      {clientScores.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No check-in data yet</p>
      ) : (
        <div className="space-y-2.5">
          {displayed.map(({ client, score }) => (
            <ClientScoreRow key={client.id} client={client} score={score} />
          ))}
        </div>
      )}

      <Link to="/adherence">
        <button className="w-full mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          View full adherence report <ArrowRight className="w-3 h-3" />
        </button>
      </Link>
    </div>
  );
}