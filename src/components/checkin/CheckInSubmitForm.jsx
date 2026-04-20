import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, Upload, X, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { toast } from 'sonner';

/* ── Reusable Slider ── */
function Slider({ label, emoji, value, onChange, min = 1, max = 10, step = 1, lowLabel, highLabel }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold">
          {emoji && <span className="mr-1.5">{emoji}</span>}
          {label}
        </label>
        <span className="text-base font-bold text-primary tabular-nums w-6 text-right">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-full accent-primary cursor-pointer"
        style={{ touchAction: 'none' }}
      />
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

/* ── Photo slot ── */
function PhotoSlot({ label, url, onUpload, onRemove, uploading }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground text-center">{label}</p>
      <label className={cn(
        'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all aspect-[3/4]',
        uploading ? 'border-primary/50 bg-primary/5' : url ? 'border-transparent' : 'border-border bg-secondary/30 hover:border-primary/40 active:scale-[0.97]'
      )}>
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onUpload} disabled={uploading} />
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : url ? (
          <>
            <img src={url} alt={label} className="w-full h-full object-cover rounded-xl" />
            <button
              type="button"
              onClick={e => { e.preventDefault(); onRemove(); }}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 py-4 px-2">
            <Upload className="w-5 h-5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground text-center">Add photo</span>
          </div>
        )}
      </label>
    </div>
  );
}

/* ── Checkbox row ── */
function CheckRow({ checked, onChange, label, sublabel }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 transition-all active:scale-[0.98] text-left',
        checked ? 'border-primary bg-primary/8' : 'border-border bg-secondary/30'
      )}
    >
      <div className={cn(
        'w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
        checked ? 'border-primary bg-primary' : 'border-muted-foreground/40'
      )}>
        {checked && <CheckCircle2 className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />}
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
    </button>
  );
}

/* ── Section heading ── */
function Section({ emoji, title, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-border">
        <span className="text-lg">{emoji}</span>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function CheckInSubmitForm({ clientId, clientName, lastCheckIn, onSuccess }) {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null); // 'front' | 'side' | 'back'

  const [weight, setWeight] = useState('');
  const [photos, setPhotos] = useState({ front: '', side: '', back: '' });
  const [sleep, setSleep] = useState(7);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [hunger, setHunger] = useState(5);
  const [workoutsCompleted, setWorkoutsCompleted] = useState(false);
  const [nutritionOnTrack, setNutritionOnTrack] = useState(false);
  const [stepsGoalMet, setStepsGoalMet] = useState(false);
  const [notes, setNotes] = useState('');

  const lastWeight = lastCheckIn?.weight ?? null;
  const weightDiff = weight && lastWeight ? (Number(weight) - lastWeight).toFixed(1) : null;

  const handlePhotoUpload = async (slot, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlot(slot);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotos(p => ({ ...p, [slot]: file_url }));
    setUploadingSlot(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const photoUrls = Object.values(photos).filter(Boolean);
    await base44.entities.CheckIn.create({
      client_id: clientId,
      client_name: clientName,
      date: format(new Date(), 'yyyy-MM-dd'),
      weight: weight ? Number(weight) : undefined,
      sleep_hours: sleep,
      energy_level: energy,
      stress_level: stress,
      compliance_training: workoutsCompleted ? 100 : 50,
      compliance_nutrition: nutritionOnTrack ? 100 : 50,
      notes: notes || undefined,
      photo_urls: photoUrls.length ? photoUrls : undefined,
    });
    setSaving(false);
    setSubmitted(true);
    onSuccess?.();
    toast.success('Check-in submitted! 🎉');
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5 text-center fade-up">
        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-heading font-bold">You're all set!</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-xs">Your coach has been notified. Keep up the great work this week 💪</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-10">

      {/* ── Weight ── */}
      <Section emoji="⚖️" title="Body Weight">
        <div className="space-y-3">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Enter your weight (lbs)"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            className="h-14 text-xl font-bold text-center tracking-tight"
          />
          {lastWeight && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Last week: <span className="font-semibold text-foreground">{lastWeight} lbs</span></span>
              {weightDiff !== null && (
                <span className={cn(
                  'flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-xs',
                  Number(weightDiff) < 0 ? 'bg-accent/15 text-accent' :
                  Number(weightDiff) > 0 ? 'bg-destructive/15 text-destructive' :
                  'bg-muted text-muted-foreground'
                )}>
                  {Number(weightDiff) < 0 ? <TrendingDown className="w-3.5 h-3.5" /> :
                   Number(weightDiff) > 0 ? <TrendingUp className="w-3.5 h-3.5" /> :
                   <Minus className="w-3.5 h-3.5" />}
                  {Number(weightDiff) > 0 ? '+' : ''}{weightDiff} lbs
                </span>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* ── Photos ── */}
      <Section emoji="📸" title="Progress Photos">
        <div className="grid grid-cols-3 gap-3">
          {(['front', 'side', 'back']).map(slot => (
            <PhotoSlot
              key={slot}
              label={slot.charAt(0).toUpperCase() + slot.slice(1)}
              url={photos[slot]}
              uploading={uploadingSlot === slot}
              onUpload={e => handlePhotoUpload(slot, e)}
              onRemove={() => setPhotos(p => ({ ...p, [slot]: '' }))}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">All photos are private and only visible to your coach</p>
      </Section>

      {/* ── Sliders ── */}
      <Section emoji="📊" title="How You're Feeling">
        <div className="space-y-6">
          <Slider
            emoji="😴" label="Sleep" value={sleep} onChange={setSleep}
            min={1} max={12} step={0.5}
            lowLabel="1 hr" highLabel="12 hrs"
          />
          <Slider
            emoji="⚡" label="Energy" value={energy} onChange={setEnergy}
            min={1} max={10}
            lowLabel="Exhausted" highLabel="Energized"
          />
          <Slider
            emoji="🧠" label="Stress" value={stress} onChange={setStress}
            min={1} max={10}
            lowLabel="Super calm" highLabel="Very stressed"
          />
          <Slider
            emoji="🍽️" label="Hunger" value={hunger} onChange={setHunger}
            min={1} max={10}
            lowLabel="Never hungry" highLabel="Always hungry"
          />
        </div>
      </Section>

      {/* ── Compliance ── */}
      <Section emoji="✅" title="This Week's Compliance">
        <div className="space-y-3">
          <CheckRow
            checked={workoutsCompleted}
            onChange={setWorkoutsCompleted}
            label="Completed all workouts"
            sublabel="Hit every planned training session"
          />
          <CheckRow
            checked={nutritionOnTrack}
            onChange={setNutritionOnTrack}
            label="Nutrition was on track"
            sublabel="Stuck to the plan most of the week"
          />
          <CheckRow
            checked={stepsGoalMet}
            onChange={setStepsGoalMet}
            label="Met daily steps goal"
            sublabel="Hit your step target consistently"
          />
        </div>
      </Section>

      {/* ── Notes ── */}
      <Section emoji="📝" title="Notes">
        <Textarea
          placeholder="Share wins, struggles, how you're feeling overall, or anything you want your coach to know..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          className="text-base resize-none leading-relaxed"
        />
      </Section>

      {/* ── Submit ── */}
      <Button
        type="submit"
        size="lg"
        className="w-full h-16 text-base font-bold rounded-2xl shadow-glow-sm"
        disabled={saving}
      >
        {saving
          ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Submitting...</>
          : 'Submit Check-In ✓'
        }
      </Button>
    </form>
  );
}