import React from 'react';

/** One line of a setup checklist: waiting circle, spinner, or green check. */
export default function StatusRow({ label, status, doneLabel = 'Done', loadingLabel = 'Working', waitingLabel = 'Waiting' }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
        {status === 'loading' && <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />}
        {status === 'done' && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        )}
        {status === 'waiting' && <span className="h-4 w-4 rounded-full border-[1.5px] border-input" />}
      </span>
      <p className={`flex-1 text-[15px] ${status === 'waiting' ? 'text-muted-foreground' : 'font-semibold text-foreground'}`}>{label}</p>
      <p className="text-[13px] text-muted-foreground">{status === 'done' ? doneLabel : status === 'loading' ? loadingLabel : waitingLabel}</p>
    </div>
  );
}
