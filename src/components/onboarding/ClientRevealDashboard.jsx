import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * First look at the client app after intake: dark hero with the day's one
 * action in brand blue, then today's targets and habits on the canvas.
 * Targets shown are the starting defaults until the coach sets real ones.
 */
export default function ClientRevealDashboard({ data }) {
  const goals = data.goals || ['fat_loss'];
  const primaryGoal = goals[0];

  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      {/* Dark hero */}
      <div className="rounded-b-2xl bg-sidebar px-5 pb-6 pt-10 text-white">
        <p className="text-sm text-white/70">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
        <h1 className="mt-1 text-[34px] leading-[1.02] text-white">Upper body, push A</h1>
        <p className="mt-1 text-sm text-white/70">Bench press, shoulder press, incline dumbbell press. About 45 minutes.</p>
        <button className="mt-5 h-12 w-full rounded-lg bg-brand text-[15px] font-semibold text-brand-foreground">
          Start workout
        </button>
      </div>

      <div className="space-y-3 px-5 pb-24 pt-4">
        {/* Targets */}
        <div className="panel p-4">
          <p className="text-[15px] font-semibold text-foreground">Today's targets</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              { label: 'Calories', value: '2,400' },
              { label: 'Protein', value: '180', unit: 'g' },
              { label: 'Carbs', value: '240', unit: 'g' },
              { label: 'Fat', value: '75', unit: 'g' },
            ].map(m => (
              <div key={m.label}>
                <p className="num text-xl leading-none text-foreground">{m.value}{m.unit && <span className="ml-0.5 text-[0.6em]">{m.unit}</span>}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-border" />
          <p className="mt-1.5 text-[13px] text-muted-foreground">Nothing logged yet</p>
        </div>

        {/* Habits */}
        <div className="panel divide-y divide-border px-4">
          <p className="py-3 text-[15px] font-semibold text-foreground">Daily habits</p>
          {['Workout done', 'Protein target hit', '8 glasses of water', '7+ hours of sleep'].map(h => (
            <div key={h} className="flex items-center gap-3 py-3">
              <span className="h-5 w-5 flex-shrink-0 rounded-full border-[1.5px] border-input" />
              <span className="text-[15px] text-foreground">{h}</span>
            </div>
          ))}
        </div>

        {/* Coach note (ink) */}
        <div className="rounded-xl bg-ai p-4 text-ai-foreground">
          <p className="text-[15px] font-semibold">Where to start</p>
          <p className="mt-1 text-sm leading-relaxed text-ai-foreground/85">
            Your goal is <span className="font-semibold">{primaryGoal?.replace('_', ' ')}</span>, so protein matters most this week. Put most of it in your first meal and the target gets easier.
          </p>
        </div>

        <Link to="/" className="flex h-12 w-full items-center justify-center gap-1 rounded-lg border border-input bg-card text-[15px] font-semibold text-foreground">
          Open the full app <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
