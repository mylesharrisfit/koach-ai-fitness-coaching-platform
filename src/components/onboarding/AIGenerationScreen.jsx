import React, { useState, useEffect } from 'react';
import StatusRow from './StatusRow';

const CLIENT_ITEMS = [
  { label: 'Reading your answers',     delay: 0 },
  { label: 'Training plan',            delay: 0.7 },
  { label: 'Nutrition plan',           delay: 1.4 },
  { label: 'Recovery targets',         delay: 2.1 },
  { label: 'Daily habits',             delay: 2.8 },
];

const COACH_ITEMS = [
  { label: 'Client list',              delay: 0 },
  { label: 'Weekly check-in form',     delay: 0.7 },
  { label: 'Reminders and follow-ups', delay: 1.4 },
  { label: 'Nutrition templates',      delay: 2.1 },
  { label: 'Draft replies',            delay: 2.8 },
];

function GenerationCard({ item }) {
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    const t1 = setTimeout(() => setStatus('loading'), item.delay * 1000);
    const t2 = setTimeout(() => setStatus('done'), (item.delay + 0.8) * 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return <StatusRow label={item.label} status={status} doneLabel="Ready" loadingLabel="Setting up" />;
}

export default function AIGenerationScreen({ onNext, role = 'client' }) {
  const items = role === 'coach' ? COACH_ITEMS : CLIENT_ITEMS;
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    items.forEach((item) => {
      const t = setTimeout(() => setDoneCount(c => c + 1), (item.delay + 0.8) * 1000);
      return () => clearTimeout(t);
    });
  }, []);

  const allDone = doneCount >= items.length;

  useEffect(() => {
    if (allDone) {
      const t = setTimeout(onNext, 1400);
      return () => clearTimeout(t);
    }
  }, [allDone]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-background px-5">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-[32px] leading-[1.04] text-foreground">{allDone ? 'All set.' : 'Setting things up.'}</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            {role === 'coach' ? 'Your workspace is built from your answers.' : 'Your plan is built from your answers.'}
          </p>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-foreground transition-[width] duration-500" style={{ width: allDone ? '100%' : `${(doneCount / items.length) * 92}%` }} />
        </div>

        <div className="divide-y divide-border rounded-xl bg-card px-4 shadow-[inset_0_0_0_1px_rgb(var(--border))]">
          {items.map((item, i) => <GenerationCard key={i} item={item} />)}
        </div>
      </div>
    </div>
  );
}
