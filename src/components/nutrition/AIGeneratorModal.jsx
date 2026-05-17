import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight, RotateCcw, Check, Flame, Zap, Leaf, Dumbbell } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ── Constants ──────────────────────────────────────────────────────────────
const GOALS = [
  { id: 'fat_loss',     emoji: '🔥', icon: Flame,    label: 'Fat Loss',    desc: 'Caloric deficit with high protein' },
  { id: 'muscle_gain',  emoji: '💪', icon: Dumbbell, label: 'Muscle Gain', desc: 'Caloric surplus, strength focus' },
  { id: 'performance',  emoji: '⚡', icon: Zap,      label: 'Performance', desc: 'Fuel for training and recovery' },
  { id: 'maintenance',  emoji: '🌿', icon: Leaf,     label: 'Maintenance', desc: 'Balanced macros, sustainable eating' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary',         label: 'Sedentary',         multiplier: 1.0 },
  { value: 'lightly_active',    label: 'Lightly Active',    multiplier: 1.1 },
  { value: 'moderately_active', label: 'Moderately Active', multiplier: 1.2 },
  { value: 'very_active',       label: 'Very Active',       multiplier: 1.3 },
  { value: 'athlete',           label: 'Athlete',           multiplier: 1.4 },
];

const DIET_PREFS = ['Standard', 'High Protein', 'Vegetarian', 'Vegan', 'Keto', 'Paleo'];

const LOADING_MESSAGES = ['Calculating macros...', 'Structuring meals...', 'Optimizing for goal...'];

// ── Macro calculation ───────────────────────────────────────────────────────
function calcMacros(goal, weightKg, activityValue) {
  const activity = ACTIVITY_LEVELS.find(a => a.value === activityValue) || ACTIVITY_LEVELS[0];
  const m = activity.multiplier;
  let calories, protein, fats;

  if (goal === 'fat_loss') {
    calories = weightKg * 24 * 0.8 * m;
    protein  = weightKg * 2.2;
    fats     = weightKg * 0.8;
  } else if (goal === 'muscle_gain') {
    calories = weightKg * 24 * 1.15 * m;
    protein  = weightKg * 2.4;
    fats     = weightKg * 1.0;
  } else if (goal === 'performance') {
    calories = weightKg * 24 * 1.1 * m;
    protein  = weightKg * 2.0;
    fats     = weightKg * 0.9;
  } else {
    calories = weightKg * 24 * m;
    protein  = weightKg * 1.8;
    fats     = weightKg * 0.9;
  }

  const carbs = (calories - protein * 4 - fats * 9) / 4;
  return {
    calories: Math.round(calories),
    protein:  Math.round(protein),
    carbs:    Math.round(Math.max(carbs, 0)),
    fats:     Math.round(fats),
  };
}

// ── Step dots ───────────────────────────────────────────────────────────────
function StepDots({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full transition-all duration-300',
            i === current ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-border'
          )}
        />
      ))}
    </div>
  );
}

// ── Slide animation ─────────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

// ── Step 1 — Goal ───────────────────────────────────────────────────────────
function Step1Goal({ goal, setGoal }) {
  return (
    <div>
      <h2 className="text-xl font-bold font-heading mb-1">What's the goal?</h2>
      <p className="text-sm text-muted-foreground mb-6">Select the primary objective for this plan</p>
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map(g => (
          <button
            key={g.id}
            onClick={() => setGoal(g.id)}
            className={cn(
              'flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-150 hover:shadow-md',
              goal === g.id
                ? 'border-primary bg-accent/60'
                : 'border-border bg-white hover:border-primary/40'
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-2xl">{g.emoji}</span>
              {goal === g.id && (
                <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{g.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{g.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 2 — Details ────────────────────────────────────────────────────────
function Step2Details({ details, setDetails }) {
  const update = (key, val) => setDetails(d => ({ ...d, [key]: val }));

  return (
    <div>
      <h2 className="text-xl font-bold font-heading mb-1">Tell us about your client</h2>
      <p className="text-sm text-muted-foreground mb-6">We'll use this to calculate precise macros</p>
      <div className="space-y-4">
        {/* Weight */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Label className="text-xs font-semibold mb-1.5 block">Body Weight</Label>
            <Input
              type="number"
              placeholder="e.g. 80"
              value={details.weight}
              onChange={e => update('weight', e.target.value)}
            />
          </div>
          <div className="flex border border-input rounded-lg overflow-hidden text-xs font-semibold h-9">
            {['kg', 'lbs'].map(u => (
              <button
                key={u}
                onClick={() => update('unit', u)}
                className={cn(
                  'px-3 transition-colors',
                  details.unit === u ? 'bg-primary text-white' : 'bg-background text-muted-foreground hover:bg-secondary'
                )}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Activity level */}
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Activity Level</Label>
          <Select value={details.activity} onValueChange={v => update('activity', v)}>
            <SelectTrigger><SelectValue placeholder="Select activity level" /></SelectTrigger>
            <SelectContent>
              {ACTIVITY_LEVELS.map(a => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dietary preference */}
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Dietary Preference</Label>
          <Select value={details.diet} onValueChange={v => update('diet', v)}>
            <SelectTrigger><SelectValue placeholder="Select dietary preference" /></SelectTrigger>
            <SelectContent>
              {DIET_PREFS.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Restrictions or Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Textarea
            placeholder="e.g. lactose intolerant, no nuts..."
            value={details.notes}
            onChange={e => update('notes', e.target.value)}
            className="resize-none h-20"
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — Generating ─────────────────────────────────────────────────────
function Step3Generating({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setProgress(0);
    setMsgIndex(0);

    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + 2;
        if (next >= 100 && !doneRef.current) {
          doneRef.current = true;
          clearInterval(interval);
          setTimeout(onDone, 300);
        }
        return Math.min(next, 100);
      });
    }, 40);

    const msgTimer = setInterval(() => {
      setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
    }, 900);

    return () => { clearInterval(interval); clearInterval(msgTimer); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-6">
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
      >
        <Sparkles className="w-8 h-8 text-white" />
      </motion.div>

      <div className="text-center">
        <h2 className="text-xl font-bold font-heading mb-1">Building your plan...</h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-muted-foreground"
          >
            {LOADING_MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-xs">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right mt-1">{progress}%</p>
      </div>
    </div>
  );
}

// ── Step 4 — Result ─────────────────────────────────────────────────────────
function Step4Result({ result, onApply, onRegenerate }) {
  const goalMeta = GOALS.find(g => g.id === result.goal);

  return (
    <div>
      <h2 className="text-xl font-bold font-heading mb-1">Your AI Plan is Ready ✨</h2>
      <p className="text-sm text-muted-foreground mb-6">Review the calculated plan below</p>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-5 space-y-4">
        {/* Goal badge */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{goalMeta?.emoji}</span>
          <span className="text-sm font-bold px-3 py-1 rounded-full bg-white border border-primary/20 text-primary shadow-sm">
            {goalMeta?.label}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">{result.diet} • {ACTIVITY_LEVELS.find(a => a.value === result.activity)?.label}</span>
        </div>

        {/* Calories */}
        <div className="text-center">
          <p className="text-4xl font-extrabold text-foreground tracking-tight">{result.calories}</p>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mt-0.5">calories / day</p>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Protein', value: result.protein, unit: 'g', color: 'text-red-500' },
            { label: 'Carbs',   value: result.carbs,   unit: 'g', color: 'text-amber-500' },
            { label: 'Fats',    value: result.fats,    unit: 'g', color: 'text-blue-500' },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
              <p className={cn('text-2xl font-extrabold', m.color)}>{m.value}<span className="text-sm font-semibold text-muted-foreground">{m.unit}</span></p>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <Button variant="outline" onClick={onRegenerate} className="gap-2 flex-shrink-0">
          <RotateCcw className="w-3.5 h-3.5" /> Regenerate
        </Button>
        <Button onClick={onApply} className="flex-1 gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0">
          <Sparkles className="w-4 h-4" /> Use This Plan
        </Button>
      </div>
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────────────
export default function AIGeneratorModal({ open, onOpenChange, onApply }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [goal, setGoal] = useState(null);
  const [details, setDetails] = useState({ weight: '', unit: 'kg', activity: '', diet: '', notes: '' });
  const [result, setResult] = useState(null);

  function go(next) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function handleGeneratingDone() {
    const weightKg = details.unit === 'lbs'
      ? parseFloat(details.weight) * 0.453592
      : parseFloat(details.weight);
    const macros = calcMacros(goal, weightKg, details.activity);
    setResult({ ...macros, goal, diet: details.diet || 'Standard', activity: details.activity || 'sedentary' });
    setDir(1);
    setStep(3);
  }

  function handleRegenerate() {
    go(2);
  }

  function handleApply() {
    onApply?.(result);
    onOpenChange(false);
    reset();
  }

  function reset() {
    setStep(0); setDir(1); setGoal(null);
    setDetails({ weight: '', unit: 'kg', activity: '', diet: '', notes: '' });
    setResult(null);
  }

  function canNext() {
    if (step === 0) return !!goal;
    if (step === 1) return !!details.weight && !!details.activity;
    return true;
  }

  const totalVisibleSteps = 4;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="px-8 pt-8 pb-6">
          <StepDots current={step} total={totalVisibleSteps} />

          <AnimatePresence custom={dir} mode="wait">
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {step === 0 && <Step1Goal goal={goal} setGoal={setGoal} />}
              {step === 1 && <Step2Details details={details} setDetails={setDetails} />}
              {step === 2 && <Step3Generating onDone={handleGeneratingDone} />}
              {step === 3 && result && (
                <Step4Result result={result} onApply={handleApply} onRegenerate={handleRegenerate} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav — hide on generating/result steps */}
        {step < 2 && (
          <div className="flex items-center justify-between px-8 py-4 border-t border-border bg-secondary/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={step === 0 ? () => onOpenChange(false) : () => go(step - 1)}
              className="gap-1 text-muted-foreground"
            >
              {step === 0 ? 'Cancel' : <><ChevronLeft className="w-4 h-4" /> Back</>}
            </Button>
            <Button
              size="sm"
              disabled={!canNext()}
              onClick={() => go(step + 1)}
              className="gap-1"
            >
              {step === 1 ? <><Sparkles className="w-3.5 h-3.5" /> Generate Plan</> : <>Next <ChevronRight className="w-4 h-4" /></>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}