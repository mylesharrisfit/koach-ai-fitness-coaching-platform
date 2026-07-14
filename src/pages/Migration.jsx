import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, Users, Dumbbell, Salad, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import MigrationClientImport from '@/components/migration/MigrationClientImport';
import MigrationWorkouts from '@/components/migration/MigrationWorkouts';
import MigrationNutrition from '@/components/migration/MigrationNutrition';
import MigrationInvites from '@/components/migration/MigrationInvites';

const STEPS = [
  { id: 'clients',  label: 'Import Clients',    icon: Users,    desc: 'Upload your client list from any app' },
  { id: 'workouts', label: 'Workout Templates',  icon: Dumbbell, desc: 'Import or create workout programs' },
  { id: 'nutrition',label: 'Meal Plans',         icon: Salad,    desc: 'Bring over nutrition plans' },
  { id: 'invites',  label: 'Invite Clients',     icon: Send,     desc: 'Bulk-invite everyone at once' },
];

export default function Migration() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState({});
  const [importedClients, setImportedClients] = useState([]);

  const markDone = (id) => setDone(d => ({ ...d, [id]: true }));
  const allDone = STEPS.every(s => done[s.id]);

  if (allDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-heading font-black text-foreground mb-2">You're all set! 🎉</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Your clients, workouts, and meal plans have been imported. Your clients have been invited and are ready to go.
        </p>
        <a href="/clients" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors">
          Go to Clients <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Migration Wizard</span>
        </div>
        <h1 className="text-2xl font-heading font-black text-foreground">Switch to FitForge in minutes</h1>
        <p className="text-muted-foreground text-sm mt-1">Import your clients, programs, and plans — then invite everyone at once.</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const isDone = done[s.id];
          const isActive = i === step;
          const Icon = s.icon;
          return (
            <React.Fragment key={s.id}>
              <button
                onClick={() => setStep(i)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all shrink-0',
                  isDone ? 'bg-success/10 border-success text-success'
                    : isActive ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {isDone
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  : <Icon className="w-3.5 h-3.5" />
                }
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn('h-px flex-1 min-w-[12px] shrink-0', isDone ? 'bg-success' : 'bg-border')} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step panel */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Panel header */}
        <div className="px-6 py-5 border-b border-border flex items-center gap-4">
          {(() => {
            const s = STEPS[step];
            const Icon = s.icon;
            return (
              <>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-base text-foreground">{s.label}</h2>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
                <div className="ml-auto text-xs text-muted-foreground shrink-0">Step {step + 1} of {STEPS.length}</div>
              </>
            );
          })()}
        </div>

        {/* Panel content */}
        <div className="p-6">
          {step === 0 && (
            <MigrationClientImport
              onComplete={(clients) => { setImportedClients(clients); markDone('clients'); setStep(1); }}
              onSkip={() => { markDone('clients'); setStep(1); }}
            />
          )}
          {step === 1 && (
            <MigrationWorkouts
              onComplete={() => { markDone('workouts'); setStep(2); }}
              onSkip={() => { markDone('workouts'); setStep(2); }}
            />
          )}
          {step === 2 && (
            <MigrationNutrition
              onComplete={() => { markDone('nutrition'); setStep(3); }}
              onSkip={() => { markDone('nutrition'); setStep(3); }}
            />
          )}
          {step === 3 && (
            <MigrationInvites
              importedClients={importedClients}
              onComplete={() => markDone('invites')}
              onSkip={() => markDone('invites')}
            />
          )}
        </div>
      </div>
    </div>
  );
}