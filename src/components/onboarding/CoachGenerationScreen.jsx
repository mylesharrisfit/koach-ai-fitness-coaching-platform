import React, { useState, useEffect, useRef } from 'react';
import StatusRow from './StatusRow';

const ITEMS = [
  { label: 'Client list',          activateAt: 0.6 },
  { label: 'Program templates',    activateAt: 1.2 },
  { label: 'Meal plan templates',  activateAt: 1.8 },
  { label: 'Reminders',            activateAt: 2.4 },
  { label: 'Weekly check-in form', activateAt: 3.0 },
  { label: 'Business numbers',     activateAt: 3.6 },
  { label: 'Client app',           activateAt: 4.2 },
];

// Last item finishes at 4.2s. We wait ~1s then redirect = ~5.5s total.
const REDIRECT_AT = 5600;
const FAILSAFE_AT = 8000; // hard cap — redirect no matter what

export default function CoachGenerationScreen({ onNext }) {
  const [statuses, setStatuses] = useState(ITEMS.map(() => 'waiting'));
  const [allDone, setAllDone]   = useState(false);
  const [exiting, setExiting]   = useState(false);
  const timers = useRef([]);

  const doRedirect = () => {
    setAllDone(true);
    setExiting(true);
    // Give the "OS is live" message 900ms, then navigate into the real dashboard
    const t = setTimeout(() => {
      localStorage.setItem('koach_onboarding_complete', '1');
      // Use window.location for a hard navigation so auth session & layout fully reinitialize
      window.location.replace('/');
    }, 900);
    timers.current.push(t);
  };

  useEffect(() => {
    // Activate each card sequentially
    ITEMS.forEach((item, idx) => {
      // loading state
      const tLoad = setTimeout(() => {
        setStatuses(prev => {
          const next = [...prev];
          next[idx] = 'loading';
          return next;
        });
      }, (item.activateAt - 0.5) * 1000);

      // done state
      const tDone = setTimeout(() => {
        setStatuses(prev => {
          const next = [...prev];
          next[idx] = 'done';
          return next;
        });
      }, item.activateAt * 1000);

      timers.current.push(tLoad, tDone);
    });

    // Primary redirect timer
    const tRedirect = setTimeout(doRedirect, REDIRECT_AT);
    // Failsafe redirect
    const tFailsafe = setTimeout(doRedirect, FAILSAFE_AT);
    timers.current.push(tRedirect, tFailsafe);

    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const doneCount = statuses.filter(s => s === 'done').length;
  const progress  = doneCount / ITEMS.length;

  return (
    <div className={`flex h-full w-full flex-col items-center justify-center bg-background px-5 transition-opacity duration-700 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-[32px] leading-[1.04] text-foreground">
            {allDone ? 'Your workspace is ready.' : 'Setting up your workspace.'}
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            {allDone ? 'Opening Today.' : 'About five seconds.'}
          </p>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-foreground transition-[width] duration-500" style={{ width: `${allDone ? 100 : progress * 100}%` }} />
        </div>

        <div className="divide-y divide-border rounded-xl bg-card px-4 shadow-[inset_0_0_0_1px_rgb(var(--border))]">
          {ITEMS.map((item, i) => (
            <StatusRow key={i} label={item.label} status={statuses[i]} doneLabel="Ready" loadingLabel="Setting up" />
          ))}
        </div>
      </div>
    </div>
  );
}
