import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// First-run checklist, PDF page 10: numbered step cards, one ink action, the rest outline.
const CHECKLIST = [
  { label: 'Add your clients',             detail: 'Import from another app or send invite links.',            action: 'Add clients',      path: '/clients' },
  { label: 'Send a client intake link',    detail: 'New clients answer 13 short questions before day one.',    action: 'Get the link',     path: '/onboarding-manager' },
  { label: 'Build a first program',        detail: 'Describe the client and let AI draft it. You edit before it goes out.', action: 'Build a program', path: '/program-builder' },
  { label: 'Connect Stripe to get paid',   detail: 'Clients pay you directly. KOACH never touches your money.', action: 'Connect Stripe',  path: '/revenue' },
  { label: 'Add your logo',                detail: 'Shown on your client app and emails.',                      action: 'Add logo',         path: '/settings' },
  { label: 'Set up a reminder',            detail: 'Nudge clients who miss a check-in, automatically.',         action: 'Set up',           path: '/automations' },
];

const MOVE_FROM = [
  { label: 'From Trainerize', path: '/migration' },
  { label: 'From Everfit', path: '/migration' },
  { label: 'From a spreadsheet', path: '/migration' },
];

export default function CoachRevealDashboard({ data }) {
  const firstName = data?.business_name?.split(' ')[0] || 'Coach';
  const done = 0;

  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:py-12">
        <h1 className="text-[34px] leading-[1.02] text-foreground sm:text-[44px]">
          Welcome, {firstName}. Let's get your first client checking in.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          Six steps, about 20 minutes. Your Today page fills in as soon as your first client logs a workout.
        </p>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-foreground" style={{ width: `${(done / CHECKLIST.length) * 100}%` }} />
          </div>
          <p className="text-sm font-semibold text-foreground tabular-nums">{done} of {CHECKLIST.length} done</p>
        </div>

        <ol className="mt-5 space-y-2.5">
          {CHECKLIST.map((item, i) => (
            <li key={item.label} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-foreground text-[15px] font-bold text-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-foreground">{item.label}</span>
                  <span className="block text-sm text-muted-foreground">{item.detail}</span>
                </span>
              </div>
              <Button asChild variant={i === 0 ? 'default' : 'outline'} className="sm:flex-shrink-0">
                <Link to={item.path}>{item.action}</Link>
              </Button>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-[15px] font-semibold text-foreground">Moving from another app? Bring your clients with you.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {MOVE_FROM.map(m => (
            <Button key={m.label} asChild variant="outline" size="lg">
              <Link to={m.path}>{m.label}</Link>
            </Button>
          ))}
        </div>

        <div className="mt-8 border-t border-border pt-5">
          <Button asChild variant="link">
            <Link to="/">Skip for now and open Today</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
