import React, { useState } from 'react';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsubscribe`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Public unsubscribe landing. Email footers link here with a signed token
// (?e=&t=, see supabase/functions/_shared/unsubscribe.js). Clicking the button
// records the opt-out via the `unsubscribe` edge function; nothing happens on
// page load, so link scanners that prefetch the URL can't unsubscribe anyone.
// The opt-out stops non-transactional email (check-in reminders, the weekly
// digest, welcome emails); account and billing emails still arrive.
export default function Unsubscribe() {
  const params = new URLSearchParams(window.location.search);
  const e = params.get('e') || '';
  const t = params.get('t') || '';
  const hasToken = Boolean(e && t);
  let email = '';
  try {
    email = hasToken ? atob(e.replace(/-/g, '+').replace(/_/g, '/')) : '';
  } catch {
    email = '';
  }
  const [state, setState] = useState('idle'); // idle | sending | done | invalid | error

  const unsubscribe = async () => {
    setState('sending');
    try {
      const res = await fetch(FUNCTIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
        body: JSON.stringify({ e, t }),
      });
      setState(res.ok ? 'done' : res.status === 400 ? 'invalid' : 'error');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-y-auto bg-background">
      <header className="flex-shrink-0 bg-sidebar px-5 py-4 sm:px-8">
        <img src="/koach-logo-white.png" alt="KOACH" className="h-6 w-auto" />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <h1 className="text-[32px] leading-tight text-foreground">Email preferences</h1>

        {!hasToken && (
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Use the unsubscribe link at the bottom of any KOACH AI email to stop reminders, digests and welcome emails
            for that address. You can also change notifications in the app, or ask your coach.
          </p>
        )}

        {hasToken && state !== 'done' && (
          <>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Stop check-in reminders, weekly digests and welcome emails
              {email ? <> to <strong className="break-all font-semibold text-foreground">{email}</strong></> : null}?
              Emails about your account, billing and messages from your coach will still arrive.
            </p>
            <button
              type="button"
              onClick={unsubscribe}
              disabled={state === 'sending'}
              className="mt-6 inline-flex h-11 w-fit items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 disabled:opacity-60"
            >
              {state === 'sending' ? 'Unsubscribing…' : 'Unsubscribe'}
            </button>
            {state === 'invalid' && (
              <p className="mt-4 text-sm text-destructive">This unsubscribe link isn't valid. Use the link from your most recent email.</p>
            )}
            {state === 'error' && (
              <p className="mt-4 text-sm text-destructive">Something went wrong. Please try again in a moment.</p>
            )}
          </>
        )}

        {state === 'done' && (
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            You're unsubscribed{email ? <> — <strong className="break-all font-semibold text-foreground">{email}</strong> won't get</> : ' from'} check-in reminders,
            weekly digests or welcome emails anymore.
          </p>
        )}

        <a
          href="/notification-settings"
          className="mt-6 inline-flex h-11 w-fit items-center rounded-md border border-border px-5 text-sm font-semibold text-foreground hover:bg-secondary"
        >
          Manage notifications
        </a>
      </main>
    </div>
  );
}
