import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  ArrowRight, Check, Dumbbell, Users, Zap, CreditCard,
  Sparkles, ChevronLeft, User, Heart, Target, Trophy
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Constants ── */
const TOTAL_STEPS = 6;

const COACHING_STYLES = [
  { id: 'transformation', label: 'Body Transformation', icon: Zap, desc: 'Fat loss, muscle building, physique goals' },
  { id: 'performance', label: 'Athletic Performance', icon: Trophy, desc: 'Strength, speed, sport-specific training' },
  { id: 'wellness', label: 'Holistic Wellness', icon: Heart, desc: 'Health, habits, lifestyle change' },
  { id: 'general', label: 'General Fitness', icon: Target, desc: 'All-around fitness for everyday life' },
];

const CLIENT_RANGES = [
  { id: '1-5', label: '1–5', desc: 'Just starting out' },
  { id: '6-15', label: '6–15', desc: 'Growing roster' },
  { id: '16-30', label: '16–30', desc: 'Full practice' },
  { id: '30+', label: '30+', desc: 'High volume' },
];

/* ── Progress Bar ── */
function ProgressBar({ step }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Step {step} of {TOTAL_STEPS}</span>
        <span className="text-[11px] font-bold text-primary">{pct}%</span>
      </div>
      <div className="h-1.5 bg-[#E7EAF3] rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── Step Shell ── */
function StepShell({ step, title, subtitle, children, onBack, onNext, nextLabel = 'Continue', nextDisabled = false, nextLoading = false }) {
  return (
    <div className="flex flex-col gap-6 max-w-lg w-full mx-auto">
      <ProgressBar step={step} />
      <div>
        <h2 className="text-2xl font-bold text-[#1F2A44] leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-[#6B7280] mt-1">{subtitle}</p>}
      </div>
      <div>{children}</div>
      <div className="flex items-center justify-between pt-2">
        {step > 1 ? (
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#374151] transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : <div />}
        <Button onClick={onNext} disabled={nextDisabled || nextLoading} className="gap-2 min-w-[120px]">
          {nextLoading ? 'Saving...' : nextLabel}
          {!nextLoading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

/* ── Step 1: Welcome ── */
function StepWelcome({ onNext }) {
  return (
    <div className="flex flex-col gap-6 max-w-lg w-full mx-auto text-center">
      <div className="w-20 h-20 rounded-3xl bg-[#EEF4FF] flex items-center justify-center mx-auto border border-blue-100">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-[#1F2A44] leading-tight mb-2">Welcome to FitForge</h1>
        <p className="text-[#6B7280] text-sm leading-relaxed">
          Let's get you fully set up in under 5 minutes. We'll walk you through your coaching style, your first client, and connecting payments.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-left">
        {[
          { icon: Users, label: 'Add your first client' },
          { icon: Dumbbell, label: 'Assign a program' },
          { icon: CreditCard, label: 'Connect Stripe' },
          { icon: Zap, label: 'Start coaching' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5 bg-[#F6F7FB] rounded-xl p-3 border border-[#E7EAF3]">
            <div className="w-7 h-7 rounded-lg bg-[#EEF4FF] flex items-center justify-center flex-shrink-0">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-[13px] font-medium text-[#374151]">{label}</span>
          </div>
        ))}
      </div>
      <Button onClick={onNext} size="lg" className="gap-2 w-full">
        Let's Go <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

/* ── Step 2: Coaching Style ── */
function StepCoachingStyle({ value, onChange, onNext, onBack }) {
  return (
    <StepShell step={2} title="What's your coaching style?" subtitle="This helps us tailor your dashboard experience."
      onBack={onBack} onNext={onNext} nextDisabled={!value}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {COACHING_STYLES.map(({ id, label, icon: Icon, desc }) => (
          <button key={id} onClick={() => onChange(id)}
            className={cn(
              'flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all',
              value === id ? 'border-primary bg-[#EEF4FF]' : 'border-[#E7EAF3] bg-white hover:border-primary/40 hover:bg-[#F8FAFE]'
            )}>
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
              value === id ? 'bg-primary text-white' : 'bg-[#F6F7FB] text-[#6B7280]')}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1F2A44]">{label}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{desc}</p>
            </div>
            {value === id && (
              <div className="ml-auto flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </StepShell>
  );
}

/* ── Step 3: Number of Clients ── */
function StepClientCount({ value, onChange, onNext, onBack }) {
  return (
    <StepShell step={3} title="How many clients do you currently have?" subtitle="You can always change this later."
      onBack={onBack} onNext={onNext} nextDisabled={!value}>
      <div className="grid grid-cols-2 gap-3">
        {CLIENT_RANGES.map(({ id, label, desc }) => (
          <button key={id} onClick={() => onChange(id)}
            className={cn(
              'flex flex-col gap-1 p-4 rounded-2xl border-2 text-left transition-all',
              value === id ? 'border-primary bg-[#EEF4FF]' : 'border-[#E7EAF3] bg-white hover:border-primary/40 hover:bg-[#F8FAFE]'
            )}>
            <div className="flex items-center justify-between">
              <span className={cn('text-xl font-bold', value === id ? 'text-primary' : 'text-[#1F2A44]')}>{label}</span>
              {value === id && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <span className="text-xs text-[#6B7280]">{desc}</span>
          </button>
        ))}
      </div>
    </StepShell>
  );
}

/* ── Step 4: Create First Client ── */
function StepCreateClient({ onNext, onBack, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', goal: 'general_fitness' });
  const [skipped, setSkipped] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => base44.entities.Client.create({
      ...form,
      lifecycle_status: 'active',
      status: 'active',
    }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`${form.name} added!`);
      onCreated(result);
      onNext();
    },
  });

  const handleNext = () => {
    if (skipped) { onNext(); return; }
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return; }
    createMutation.mutate();
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <StepShell step={4} title="Add your first client" subtitle="Get one client in to see the full flow."
      onBack={onBack} onNext={handleNext}
      nextLabel={skipped ? 'Skip' : 'Add Client'}
      nextLoading={createMutation.isPending}
      nextDisabled={!skipped && (!form.name.trim() || !form.email.trim())}>
      <div className="space-y-4">
        {!skipped ? (
          <>
            <div>
              <Label className="text-xs font-semibold text-[#374151]">Full Name *</Label>
              <Input className="mt-1 border-[#E7EAF3] bg-[#F8F9FD] focus:bg-white" placeholder="Jane Smith"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#374151]">Email *</Label>
              <Input type="email" className="mt-1 border-[#E7EAF3] bg-[#F8F9FD] focus:bg-white" placeholder="jane@email.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#374151]">Goal</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {[
                  { v: 'weight_loss', l: '🔥 Weight Loss' },
                  { v: 'muscle_gain', l: '💪 Muscle Gain' },
                  { v: 'strength', l: '🏋️ Strength' },
                  { v: 'general_fitness', l: '⚡ General Fitness' },
                ].map(({ v, l }) => (
                  <button key={v} onClick={() => set('goal', v)}
                    className={cn('px-3 py-2 rounded-xl text-sm border transition-all text-left',
                      form.goal === v ? 'border-primary bg-[#EEF4FF] text-primary font-semibold' : 'border-[#E7EAF3] text-[#374151] hover:border-primary/40')}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F6F7FB] flex items-center justify-center mb-3">
              <User className="w-6 h-6 text-[#9CA3AF]" />
            </div>
            <p className="text-sm text-[#6B7280]">You can add clients any time from the Clients page.</p>
          </div>
        )}
        <button onClick={() => setSkipped(v => !v)}
          className="text-xs text-[#9CA3AF] hover:text-[#374151] underline underline-offset-2 transition-colors">
          {skipped ? '← Enter a client instead' : 'Skip for now'}
        </button>
      </div>
    </StepShell>
  );
}

/* ── Step 5: Assign Program ── */
function StepAssignProgram({ client, onNext, onBack }) {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [skipped, setSkipped] = useState(!client);
  const queryClient = useQueryClient();

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.WorkoutProgram.list('-created_date', 20),
    enabled: !!client,
  });

  const assignMutation = useMutation({
    mutationFn: () => base44.entities.Client.update(client.id, { assigned_program_id: selectedProgram }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Program assigned!');
      onNext();
    },
  });

  const handleNext = () => {
    if (!client || !selectedProgram || skipped) { onNext(); return; }
    assignMutation.mutate();
  };

  if (!client || skipped) {
    return (
      <StepShell step={5} title="Assign a program" subtitle="Connect a training program to your client."
        onBack={onBack} onNext={onNext} nextLabel="Skip">
        <div className="flex flex-col items-center py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F6F7FB] flex items-center justify-center mb-3">
            <Dumbbell className="w-6 h-6 text-[#9CA3AF]" />
          </div>
          <p className="text-sm text-[#6B7280]">You can assign programs from the client profile or Program Builder.</p>
        </div>
      </StepShell>
    );
  }

  return (
    <StepShell step={5} title={`Assign a program to ${client.name}`} subtitle="Pick a program from your library."
      onBack={onBack} onNext={handleNext}
      nextLabel={selectedProgram ? 'Assign & Continue' : 'Skip'}
      nextLoading={assignMutation.isPending}>
      <div className="space-y-2">
        {programs.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F6F7FB] flex items-center justify-center mb-3">
              <Dumbbell className="w-6 h-6 text-[#9CA3AF]" />
            </div>
            <p className="text-sm text-[#6B7280] mb-2">No programs yet.</p>
            <p className="text-xs text-[#9CA3AF]">You can create one in the Program Builder.</p>
          </div>
        ) : programs.slice(0, 6).map(p => (
          <button key={p.id} onClick={() => setSelectedProgram(p.id)}
            className={cn('w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all',
              selectedProgram === p.id ? 'border-primary bg-[#EEF4FF]' : 'border-[#E7EAF3] bg-white hover:border-primary/40')}>
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
              selectedProgram === p.id ? 'bg-primary text-white' : 'bg-[#F6F7FB] text-[#9CA3AF]')}>
              <Dumbbell className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1F2A44] truncate">{p.title}</p>
              <p className="text-xs text-[#9CA3AF]">{p.duration_weeks ? `${p.duration_weeks} weeks` : ''} {p.difficulty || ''}</p>
            </div>
            {selectedProgram === p.id && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
        <button onClick={() => onNext()} className="text-xs text-[#9CA3AF] hover:text-[#374151] underline underline-offset-2 transition-colors">
          Skip for now
        </button>
      </div>
    </StepShell>
  );
}

/* ── Step 6: Connect Stripe ── */
function StepStripe({ onNext, onBack }) {
  const [skipped, setSkipped] = useState(false);

  return (
    <StepShell step={6} title="Connect Stripe" subtitle="Start collecting payments from your clients."
      onBack={onBack} onNext={onNext} nextLabel="Finish Setup">
      <div className="space-y-4">
        <div className="bg-[#F6F7FB] border border-[#E7EAF3] rounded-2xl p-5 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-[#635BFF]/10 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-[#635BFF]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1F2A44]">Stripe Payments</p>
            <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
              Connect your Stripe account to collect monthly retainers, one-time payments, and upsells directly through FitForge.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[
            '✓ Automatic recurring billing',
            '✓ Client payment tracking',
            '✓ Revenue dashboard',
            '✓ Failed payment alerts',
          ].map(t => (
            <div key={t} className="flex items-center gap-2 text-sm text-[#374151]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              {t.replace('✓ ', '')}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="outline"
            className="w-full border-[#635BFF] text-[#635BFF] hover:bg-[#635BFF]/5 gap-2"
            onClick={() => { window.open('/settings', '_blank'); }}
          >
            <CreditCard className="w-4 h-4" /> Connect Stripe in Settings
          </Button>
          <button onClick={() => onNext()} className="text-xs text-[#9CA3AF] hover:text-[#374151] underline underline-offset-2 transition-colors text-center">
            I'll do this later
          </button>
        </div>
      </div>
    </StepShell>
  );
}

/* ── Complete screen ── */
function StepComplete({ navigate }) {
  return (
    <div className="flex flex-col items-center gap-6 max-w-lg w-full mx-auto text-center">
      <div className="w-24 h-24 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
        <Check className="w-12 h-12 text-emerald-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[#1F2A44] mb-2">You're all set! 🎉</h2>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          Your coaching platform is ready. Head to your dashboard to start working with clients.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 w-full">
        <Button size="lg" className="w-full gap-2" onClick={() => navigate('/')}>
          Go to Dashboard <ArrowRight className="w-4 h-4" />
        </Button>
        <Button size="lg" variant="outline" className="w-full gap-2 border-[#E7EAF3]" onClick={() => navigate('/clients')}>
          <Users className="w-4 h-4" /> View Clients
        </Button>
      </div>
    </div>
  );
}

/* ── Main Onboarding Page ── */
export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [coachingStyle, setCoachingStyle] = useState('');
  const [clientCount, setClientCount] = useState('');
  const [createdClient, setCreatedClient] = useState(null);

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  // Save onboarding complete flag to user
  const completeMutation = useMutation({
    mutationFn: () => base44.auth.updateMe({ onboarding_complete: true, coaching_style: coachingStyle, client_range: clientCount }),
    onSuccess: () => {},
  });

  const handleComplete = () => {
    completeMutation.mutate();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#E7EAF3] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-[#1F2A44] text-sm">FitForge</span>
        </div>
        {step < 7 && (
          <button onClick={() => navigate('/')} className="text-xs text-[#9CA3AF] hover:text-[#374151] transition-colors">
            Skip setup
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        {step === 1 && <StepWelcome onNext={next} />}
        {step === 2 && <StepCoachingStyle value={coachingStyle} onChange={setCoachingStyle} onNext={next} onBack={back} />}
        {step === 3 && <StepClientCount value={clientCount} onChange={setClientCount} onNext={next} onBack={back} />}
        {step === 4 && <StepCreateClient onNext={next} onBack={back} onCreated={setCreatedClient} />}
        {step === 5 && <StepAssignProgram client={createdClient} onNext={next} onBack={back} />}
        {step === 6 && <StepStripe onNext={next} onBack={back} />}
        {step === 7 && <StepComplete navigate={handleComplete} />}
      </div>
    </div>
  );
}