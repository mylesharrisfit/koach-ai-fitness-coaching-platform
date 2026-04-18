import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Footprints, Dumbbell, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subDays, format } from 'date-fns';

const BOARDS = [
  { key: 'workouts', icon: Dumbbell, label: 'Workouts', color: 'text-blue-400', description: 'This week' },
  { key: 'steps', icon: Footprints, label: 'Steps', color: 'text-amber-400', description: 'This week' },
  { key: 'streak', icon: Flame, label: 'Streak', color: 'text-orange-400', description: 'Current days' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ clients }) {
  const [active, setActive] = useState('workouts');

  const { data: logs = [] } = useQuery({
    queryKey: ['leaderboard-logs'],
    queryFn: () => base44.entities.DailyLog.filter({ date: { $gte: format(subDays(new Date(), 7), 'yyyy-MM-dd') } }, '-date', 500),
  });

  const getScore = (clientId) => {
    const clientLogs = logs.filter(l => l.client_id === clientId);
    if (active === 'workouts') return clientLogs.filter(l => l.workout_done).length;
    if (active === 'steps') return clientLogs.reduce((s, l) => s + (l.steps || 0), 0);
    if (active === 'streak') return clientLogs[0]?.streak_days || 0;
    return 0;
  };

  const ranked = [...clients]
    .map(c => ({ ...c, score: getScore(c.id) }))
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const board = BOARDS.find(b => b.key === active);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h3 className="font-heading font-semibold">Leaderboard</h3>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1.5 mb-5 bg-secondary/30 rounded-xl p-1">
        {BOARDS.map(b => (
          <button key={b.key} onClick={() => setActive(b.key)} className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all", active === b.key ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <b.icon className={cn("w-3.5 h-3.5", active === b.key && b.color)} />
            {b.label}
          </button>
        ))}
      </div>

      {ranked.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <p>No data logged yet this week.</p>
          <p className="text-xs mt-1">Encourage clients to log daily!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranked.map((client, idx) => (
            <div key={client.id} className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all",
              idx === 0 ? "bg-amber-500/10 border border-amber-500/20" : "bg-secondary/20"
            )}>
              <span className="text-lg w-6 text-center">{idx < 3 ? MEDALS[idx] : <span className="text-xs text-muted-foreground">{idx + 1}</span>}</span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {client.name?.[0]?.toUpperCase()}
              </div>
              <p className="flex-1 text-sm font-medium truncate">{client.name}</p>
              <div className="flex items-center gap-1">
                <board.icon className={cn("w-3.5 h-3.5", board.color)} />
                <span className="text-sm font-bold">
                  {active === 'steps' ? client.score.toLocaleString() : client.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}