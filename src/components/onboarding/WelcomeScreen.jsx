import React from 'react';
import { useAuth } from '@/lib/AuthContext';

const POINTS = [
  'Check-ins reviewed in one queue, with a draft reply ready',
  'Programs and meal plans built from your templates',
  'Clients pay you directly through Stripe',
];

export default function WelcomeScreen({ onNext }) {
  const { navigateToLogin } = useAuth();
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-background">
      {/* Graphite hero */}
      <div className="flex-shrink-0 bg-sidebar px-6 pb-10 pt-8 text-white">
        <div className="mx-auto w-full max-w-md">
          <img src="/koach-logo-white.png" alt="KOACH" className="h-7 w-auto" />
          <h1 className="mt-12 text-[44px] leading-[1] text-white">Coach more clients without more admin.</h1>
          <p className="mt-4 text-base leading-relaxed text-white/75">
            KOACH keeps your clients, programs, nutrition and payments in one place, and drafts the routine work for you to check.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-6 py-6">
        <ul className="divide-y divide-border rounded-xl bg-card px-4 shadow-[inset_0_0_0_1px_rgb(var(--border))]">
          {POINTS.map(p => (
            <li key={p} className="py-3.5 text-[15px] text-foreground">{p}</li>
          ))}
        </ul>
      </div>

      <div className="flex-shrink-0 border-t border-border px-6 pt-3" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto w-full max-w-md space-y-2">
          <button onClick={onNext} className="h-12 w-full rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground">
            Start free trial
          </button>
          <p className="text-center text-[13px] text-muted-foreground">Card required. No charge for 30 days. Cancel any time.</p>
          <button
            onClick={() => navigateToLogin()}
            className="h-12 w-full rounded-lg border border-input bg-card text-[15px] font-semibold text-foreground hover:bg-accent"
          >
            I already have an account
          </button>
        </div>
      </div>
    </div>
  );
}
