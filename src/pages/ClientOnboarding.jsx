import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ArrowRight, ChevronLeft, CheckCircle2, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';

/* ── helpers ── */
const urlParams = new URLSearchParams(window.location.search);
const COACH_ID = urlParams.get('coach') || '';

const TOTAL = 5;

function ProgressBar({ step }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="flex-1 h-1.5 bg-[#E7EAF3] rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(step / TOTAL) * 100}%` }} />
      </div>
      <span className="text-xs font-semibold text-[#9CA3AF] tabular-nums shrink-0">{step}/{TOTAL}</span>
    </div>
  );
}

function Card({ children, className }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-[#E7EAF3] p-5', className)}>
      {children}
    </div>
  );
}

function OptionGrid({ options, value, onChange, cols = 2 }) {
  return (
    <div className={cn('grid gap-2.5', cols === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
      {options.map(opt => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-start gap-2.5 p-3.5 rounded-xl border-2 text-left transition-all',
              selected
                ? 'border-primary bg-blue-50'
                : 'border-[#E7EAF3] bg-[#F8F9FC] hover:border-primary/40 hover:bg-white'
            )}
          >
            {opt.emoji && <span className="text-xl leading-none mt-0.5">{opt.emoji}</span>}
            <div className="flex-1">
              <p className={cn('text-sm font-semibold', selected ? 'text-primary' : 'text-[#1F2A44]')}>{opt.label}</p>
              {opt.desc && <p className="text-xs text-[#9CA3AF] mt-0.5">{opt.desc}</p>}
            </div>
            {selected && (
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Steps ── */

function Step1({ data, set, onNext }) {
  const ok = data.name.trim() && data.email.trim();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#1F2A44]">Let's start with the basics</h2>
        <p className="text-sm text-[#6B7280] mt-1">Tell us a little about yourself.</p>
      </div>
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-semibold text-[#374151]">Full Name *</Label>
          <Input className="mt-1" placeholder="Jane Smith" value={data.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs font-semibold text-[#374151]">Email *</Label>
          <Input type="email" className="mt-1" placeholder="jane@email.com" value={data.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs font-semibold text-[#374151]">Phone</Label>
          <Input type="tel" className="mt-1" placeholder="+1 (555) 000-0000" value={data.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-semibold text-[#374151]">Age</Label>
            <Input type="number" className="mt-1" placeholder="28" value={data.age} onChange={e => set('age', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#374151]">Height</Label>
            <Input className="mt-1" placeholder={`5'8"`} value={data.height} onChange={e => set('height', e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold text-[#374151]">Current Weight (lbs)</Label>
          <Input type="number" className="mt-1" placeholder="165" value={data.current_weight} onChange={e => set('current_weight', e.target.value)} />
        </div>
      </div>
      <Button className="w-full gap-2" disabled={!ok} onClick={onNext}>
        Continue <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

function Step2({ data, set, onNext, onBack }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#1F2A44]">What's your main goal?</h2>
        <p className="text-sm text-[#6B7280] mt-1">Pick the one that matters most right now.</p>
      </div>
      <OptionGrid
        cols={2}
        value={data.goal}
        onChange={v => set('goal', v)}
        options={[
          { value: 'fat_loss',       label: 'Fat Loss',      emoji: '🔥', desc: 'Lose body fat & get lean' },
          { value: 'muscle_gain',    label: 'Muscle Gain',   emoji: '💪', desc: 'Build size & mass' },
          { value: 'hybrid',         label: 'Hybrid',        emoji: '⚡', desc: 'Lose fat & gain muscle' },
          { value: 'strength',       label: 'Strength',      emoji: '🏋️', desc: 'Get stronger' },
          { value: 'endurance',      label: 'Endurance',     emoji: '🏃', desc: 'Cardio & stamina' },
          { value: 'general_fitness',label: 'General Fitness',emoji: '🎯', desc: 'Overall health' },
        ]}
      />
      <div className="flex items-center justify-between pt-1">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#374151]">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <Button disabled={!data.goal} onClick={onNext} className="gap-2">
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function Step3({ data, set, onNext, onBack }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#1F2A44]">Activity & Experience</h2>
        <p className="text-sm text-[#6B7280] mt-1">Help us calibrate the right starting point for you.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs font-semibold text-[#374151] mb-2 block">Current Activity Level</Label>
          <OptionGrid
            cols={1}
            value={data.activity_level}
            onChange={v => set('activity_level', v)}
            options={[
              { value: 'sedentary',         label: 'Sedentary',          emoji: '🛋️', desc: 'Desk job, little movement' },
              { value: 'lightly_active',    label: 'Lightly Active',     emoji: '🚶', desc: '1–2 workouts/week or daily walks' },
              { value: 'moderately_active', label: 'Moderately Active',  emoji: '🏃', desc: '3–4 workouts/week' },
              { value: 'very_active',       label: 'Very Active',        emoji: '⚡', desc: '5–6 workouts/week' },
              { value: 'athlete',           label: 'Athlete',            emoji: '🏆', desc: 'Daily training, competitive sport' },
            ]}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-[#374151] mb-2 block">Training Experience</Label>
          <OptionGrid
            cols={2}
            value={data.previous_experience}
            onChange={v => set('previous_experience', v)}
            options={[
              { value: 'none',         label: 'None',         emoji: '🌱' },
              { value: 'beginner',     label: 'Beginner',     emoji: '📗' },
              { value: 'some',         label: 'Some',         emoji: '📘' },
              { value: 'experienced',  label: 'Experienced',  emoji: '📙' },
              { value: 'advanced',     label: 'Advanced',     emoji: '🔴' },
            ]}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-[#374151]">Days per week available to train</Label>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {[2, 3, 4, 5, 6].map(d => (
              <button
                key={d}
                type="button"
                onClick={() => set('training_days_per_week', d)}
                className={cn(
                  'w-10 h-10 rounded-xl border-2 text-sm font-semibold transition-all',
                  data.training_days_per_week === d
                    ? 'border-primary bg-blue-50 text-primary'
                    : 'border-[#E7EAF3] text-[#374151] hover:border-primary/40'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#374151]">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <Button disabled={!data.activity_level} onClick={onNext} className="gap-2">
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function Step4({ data, set, onNext, onBack }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#1F2A44]">Preferences & Lifestyle</h2>
        <p className="text-sm text-[#6B7280] mt-1">The more detail you share, the better we can personalize your plan.</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-xs font-semibold text-[#374151]">Food preferences, dislikes, or allergies</Label>
          <Textarea
            className="mt-1 resize-none"
            rows={3}
            placeholder="e.g. I don't eat pork, I'm lactose intolerant, I love chicken and rice..."
            value={data.food_preferences}
            onChange={e => set('food_preferences', e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-[#374151]">Schedule & timing preferences</Label>
          <Textarea
            className="mt-1 resize-none"
            rows={3}
            placeholder="e.g. I prefer morning workouts, I work 9-5, I travel 2 weeks/month..."
            value={data.schedule_preferences}
            onChange={e => set('schedule_preferences', e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-[#374151]">Any health conditions or injuries?</Label>
          <Textarea
            className="mt-1 resize-none"
            rows={2}
            placeholder="e.g. Bad lower back, knee injury, asthma... (or 'None')"
            value={data.health_conditions}
            onChange={e => set('health_conditions', e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#374151]">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <Button onClick={onNext} className="gap-2">
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function Step5({ data, set, onSubmit, onBack, isLoading }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#1F2A44]">One last thing 🙌</h2>
        <p className="text-sm text-[#6B7280] mt-1">What motivates you to make this change?</p>
      </div>
      <Textarea
        className="resize-none"
        rows={4}
        placeholder="e.g. I want to feel confident for my wedding in 6 months, keep up with my kids, or just finally commit to myself..."
        value={data.motivation}
        onChange={e => set('motivation', e.target.value)}
      />
      <div className="border border-[#E7EAF3] rounded-xl p-4 bg-[#F8F9FC] space-y-1.5">
        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">Your Summary</p>
        <p className="text-sm text-[#374151]"><span className="font-semibold">Name:</span> {data.name}</p>
        <p className="text-sm text-[#374151]"><span className="font-semibold">Goal:</span> {data.goal?.replace(/_/g, ' ')}</p>
        {data.activity_level && <p className="text-sm text-[#374151]"><span className="font-semibold">Activity:</span> {data.activity_level?.replace(/_/g, ' ')}</p>}
        {data.current_weight && <p className="text-sm text-[#374151]"><span className="font-semibold">Weight:</span> {data.current_weight} lbs</p>}
      </div>
      <div className="flex items-center justify-between pt-1">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#374151]">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <Button onClick={onSubmit} disabled={isLoading} className="gap-2 min-w-[130px]">
          {isLoading ? 'Submitting...' : 'Submit'}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

function Done() {
  return (
    <div className="flex flex-col items-center gap-5 text-center py-8">
      <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[#1F2A44] mb-2">You're all set! 🎉</h2>
        <p className="text-sm text-[#6B7280] leading-relaxed max-w-xs mx-auto">
          Your responses have been sent to your coach. They'll reach out soon to get you started.
        </p>
      </div>
      <div className="bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl px-5 py-4 text-sm text-[#374151] max-w-xs">
        💬 Keep an eye on your inbox — your coach will be in touch within 24 hours.
      </div>
    </div>
  );
}

const INIT = {
  name: '', email: '', phone: '', age: '', height: '', current_weight: '',
  goal: '', activity_level: '', training_days_per_week: 3,
  previous_experience: '', food_preferences: '', schedule_preferences: '',
  health_conditions: '', motivation: '',
};

export default function ClientOnboarding() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [data, setData] = useState(INIT);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const submitMutation = useMutation({
    mutationFn: () => base44.entities.OnboardingResponse.create({
      ...data,
      age: data.age ? Number(data.age) : undefined,
      current_weight: data.current_weight ? Number(data.current_weight) : undefined,
      coach_id: COACH_ID,
      status: 'pending',
    }),
    onSuccess: () => setDone(true),
    onError: () => toast.error('Something went wrong. Please try again.'),
  });

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#E7EAF3] px-5 py-4 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Dumbbell className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-[#1F2A44] text-sm">FitForge</span>
        <span className="text-xs text-[#9CA3AF] ml-1">· Client Intake</span>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {!done && <ProgressBar step={step} />}
          <Card>
            {done ? <Done /> : (
              <>
                {step === 1 && <Step1 data={data} set={set} onNext={next} />}
                {step === 2 && <Step2 data={data} set={set} onNext={next} onBack={back} />}
                {step === 3 && <Step3 data={data} set={set} onNext={next} onBack={back} />}
                {step === 4 && <Step4 data={data} set={set} onNext={next} onBack={back} />}
                {step === 5 && <Step5 data={data} set={set} onSubmit={() => submitMutation.mutate()} onBack={back} isLoading={submitMutation.isPending} />}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}