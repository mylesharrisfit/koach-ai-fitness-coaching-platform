import React, { useMemo } from 'react';

function StatCard({ emoji, label, value, sub, color = '#3B82F6' }) {
  return (
    <div className="flex-shrink-0 w-32 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-xl mb-1">{emoji}</div>
      <p className="text-white font-bold text-lg leading-none" style={{ color }}>{value ?? '—'}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: sub.startsWith('-') ? '#22C55E' : sub.startsWith('+') ? '#F59E0B' : 'rgba(255,255,255,0.3)' }}>{sub}</p>}
      <p className="text-white/30 text-[9px] mt-0.5 font-semibold uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function StatsScrollRow({ client, checkIns, workoutSessions, badges }) {
  const stats = useMemo(() => {
    const sorted = [...checkIns].sort((a, b) => new Date(a.date) - new Date(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const currentWeight = last?.weight ?? client?.current_weight;
    const startWeight = first?.weight;
    const change = startWeight && currentWeight ? (currentWeight - startWeight) : null;
    const changeStr = change != null ? `${change > 0 ? '+' : ''}${change.toFixed(1)} lbs` : null;

    // Streak: consecutive weeks with check-ins
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 52; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);
      const hasCI = checkIns.some(ci => {
        const d = new Date(ci.date);
        return d >= weekStart && d < weekEnd;
      });
      if (hasCI) streak++;
      else break;
    }

    return {
      currentWeight: currentWeight ? `${currentWeight} lbs` : null,
      change: changeStr,
      streak,
      workouts: workoutSessions.length,
      checkIns: checkIns.length,
      achievements: badges.length,
    };
  }, [client, checkIns, workoutSessions, badges]);

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
      <StatCard emoji="⚖️" label="Current Weight" value={stats.currentWeight} sub={stats.change} color="#60A5FA" />
      <StatCard emoji="📉" label="Total Change" value={stats.change || '—'} color={stats.change?.startsWith('-') ? '#22C55E' : '#F59E0B'} />
      <StatCard emoji="🔥" label="Week Streak" value={stats.streak} color="#F97316" />
      <StatCard emoji="💪" label="Workouts Done" value={stats.workouts} color="#A78BFA" />
      <StatCard emoji="📋" label="Check-ins" value={stats.checkIns} color="#34D399" />
      <StatCard emoji="🏆" label="Achievements" value={stats.achievements} color="#FCD34D" />
    </div>
  );
}