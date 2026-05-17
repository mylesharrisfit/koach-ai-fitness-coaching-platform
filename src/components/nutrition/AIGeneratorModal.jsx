import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, ChevronLeft, X, RefreshCw, Check } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Constants ───────────────────────────────────────────────────────────────

const GOALS = [
  { id: 'fat_loss',    emoji: '🔥', label: 'Fat Loss',     sub: 'Caloric deficit with high protein' },
  { id: 'muscle_gain', emoji: '💪', label: 'Muscle Gain',  sub: 'Caloric surplus, strength focus' },
  { id: 'performance', emoji: '⚡', label: 'Performance',  sub: 'Fuel for training and recovery' },
  { id: 'maintenance', emoji: '🌿', label: 'Maintenance',  sub: 'Balanced macros, sustainable eating' },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary',          label: 'Sedentary',          multiplier: 1.0 },
  { id: 'lightly_active',     label: 'Lightly Active',     multiplier: 1.1 },
  { id: 'moderately_active',  label: 'Moderately Active',  multiplier: 1.2 },
  { id: 'very_active',        label: 'Very Active',        multiplier: 1.3 },
  { id: 'athlete',            label: 'Athlete',            multiplier: 1.4 },
];

const DIET_PREFS = ['Standard', 'High Protein', 'Vegetarian', 'Vegan', 'Keto', 'Paleo'];

const LOADING_MESSAGES = ['Calculating macros...', 'Structuring meals...', 'Optimizing for goal...'];

// ─── Macro Calculation ───────────────────────────────────────────────────────

function calcMacros(goal, weightRaw, unit, activityId) {
  const weightKg = unit === 'lbs' ? weightRaw * 0.453592 : weightRaw;
  const actMultiplier = ACTIVITY_LEVELS.find(a => a.id === activityId)?.multiplier ?? 1.0;

  let baseCalories, protein, fats;
  if (goal === 'fat_loss')    { baseCalories = weightKg * 24 * 0.8;  protein = weightKg * 2.2; fats = weightKg * 0.8; }
  else if (goal === 'muscle_gain') { baseCalories = weightKg * 24 * 1.15; protein = weightKg * 2.4; fats = weightKg * 1.0; }
  else if (goal === 'performance') { baseCalories = weightKg * 24 * 1.1;  protein = weightKg * 2.0; fats = weightKg * 0.9; }
  else                         { baseCalories = weightKg * 24;        protein = weightKg * 1.8; fats = weightKg * 0.9; }

  const calories = baseCalories * actMultiplier;
  const carbs = (calories - protein * 4 - fats * 9) / 4;

  return {
    calories: Math.round(calories),
    protein_g: Math.round(protein),
    fats_g: Math.round(fats),
    carbs_g: Math.max(0, Math.round(carbs)),
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepDots({ current, total }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ width: i === current ? 24 : 8, opacity: i <= current ? 1 : 0.3 }}
          transition={{ duration: 0.25 }}
          className={cn('h-2 rounded-full', i === current ? 'bg-primary' : 'bg-border')}
        />
      ))}
    </div>
  );
}

function Step1({ goal, setGoal }) {
  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-1">What's the goal?</h2>
      <p className="text-sm text-muted-foreground mb-5">Select the primary focus for this nutrition plan</p>
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map(g => (
          <button
            key={g.id}
            onClick={() => setGoal(g.id)}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 hover:shadow-sm',
              goal === g.id
                ? 'border-primary bg-accent/60 shadow-sm'
                : 'border-border bg-white hover:border-primary/40'
            )}
          >
            <span className="text-2xl leading-none mt-0.5">{g.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{g.label}</span>
                {goal === g.id && (
                  <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{g.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step2({ details, setDetails }) {
  function set(field, value) { setDetails(d => ({ ...d, [field]: value })); }
  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-1">Tell us about your client</h2>
      <p className="text-sm text-muted-foreground mb-5">Used to calculate personalized macro targets</p>
      <div className="space-y-4">
        {/* Body Weight */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Body Weight</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="e.g. 75"
              value={details.weight}
              onChange={e => set('weight', e.target.value)}
              className="flex-1"
            />
            <div className="flex rounded-lg border border-input overflow-hidden text-xs font-semibold">
              {['kg', 'lbs'].map(u => (
                <button
                  key={u}
                  onClick={() => set('unit', u)}
                  className={cn('px-3 py-1 transition-colors', details.unit === u ? 'bg-primary text-white' : 'bg-white text-muted-foreground hover:bg-secondary')}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Level */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Activity Level</label>
          <select
            value={details.activity}
            onChange={e => set('activity', e.target.value)}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {ACTIVITY_LEVELS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>

        {/* Dietary Preference */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Dietary Preference</label>
          <select
            value={details.diet}
            onChange={e => set('diet', e.target.value)}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {DIET_PREFS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Restrictions or Notes <span className="font-normal text-muted-foreground">(optional)</span></label>
          <textarea
            value={details.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="e.g. no dairy, lactose intolerant, competes on weekends..."
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>
      </div>
    </div>
  );
}

function Step3({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setProgress(0);
    setMsgIndex(0);

    const progInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(progInterval); return 100; }
        return p + 2;
      });
    }, 40);

    const msgInterval = setInterval(() => setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length), 900);

    const done = setTimeout(() => {
      if (!doneRef.current) { doneRef.current = true; onComplete(); }
    }, 2200);

    return () => { clearInterval(progInterval); clearInterval(msgInterval); clearTimeout(done); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-6">
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
      >
        <Sparkles className="w-8 h-8 text-white" />
      </motion.div>
      <div className="text-center space-y-1">
        <h2 className="text-xl font-heading font-bold">Building your plan...</h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-sm text-muted-foreground"
          >
            {LOADING_MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="w-full max-w-xs">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'linear', duration: 0.04 }}
          />
        </div>
        <p className="text-right text-xs text-muted-foreground mt-1">{progress}%</p>
      </div>
    </div>
  );
}

function Step4({ result, goal, onApply, onRegenerate }) {
  const goalMeta = GOALS.find(g => g.id === goal);
  const macros = [
    { label: 'Protein', value: result.protein_g, unit: 'g', color: 'text-red-500' },
    { label: 'Carbs',   value: result.carbs_g,   unit: 'g', color: 'text-amber-500' },
    { label: 'Fats',    value: result.fats_g,    unit: 'g', color: 'text-blue-500' },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h2 className="text-xl font-heading font-bold">Your AI Plan is Ready</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">Review the generated targets before applying</p>

      <div className="rounded-2xl border border-primary/20 bg-accent/30 p-5 space-y-4">
        {/* Goal badge */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{goalMeta?.emoji}</span>
          <span className="text-sm font-bold text-foreground">{goalMeta?.label}</span>
          <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">AI Generated</span>
        </div>

        {/* Calories */}
        <div className="text-center py-2">
          <div className="text-4xl font-heading font-bold text-foreground">{result.calories?.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide font-semibold">kcal / day</div>
        </div>

        {/* Macros row */}
        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
          {macros.map((m, i) => (
            <React.Fragment key={m.label}>
              <div className="flex flex-col items-center flex-1">
                <span className={cn('text-lg font-bold', m.color)}>{m.value}{m.unit}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{m.label}</span>
              </div>
              {i < macros.length - 1 && <div className="w-px h-8 bg-border" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <Button variant="outline" className="flex-1 gap-2" onClick={onRegenerate}>
          <RefreshCw className="w-4 h-4" /> Regenerate
        </Button>
        <Button className="flex-1 gap-2" onClick={() => onApply(result)}>
          <Check className="w-4 h-4" /> Use This Plan
        </Button>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

const SLIDE_VARIANTS = {
  enter: dir => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  dir => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export default function AIGeneratorModal({ open, onOpenChange, onApply }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [goal, setGoal] = useState('fat_loss');
  const [details, setDetails] = useState({ weight: '', unit: 'kg', activity: 'moderately_active', diet: 'Standard', notes: '' });
  const [result, setResult] = useState(null);

  function go(nextStep) {
    setDir(nextStep > step ? 1 : -1);
    setStep(nextStep);
  }

  function handleGenerate() {
    const macros = calcMacros(goal, parseFloat(details.weight) || 70, details.unit, details.activity);
    setResult({ ...macros, goal, diet: details.diet, notes: details.notes });
    go(3);
  }

  function handleApply(res) {
    const goalMeta = GOALS.find(g => g.id === res.goal);
    onApply?.({
      title: `${goalMeta?.label} Plan`,
      calories: res.calories,
      protein_g: res.protein_g,
      carbs_g: res.carbs_g,
      fats_g: res.fats_g,
      is_ai_generated: true,
    });
    onOpenChange(false);
    // reset
    setTimeout(() => { setStep(0); setGoal('fat_loss'); setResult(null); }, 300);
  }

  function close() { onOpenChange(false); }

  const canNext = step === 0 ? !!goal : step === 1 ? !!details.weight : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden" hideClose>
        <div className="flex flex-col">
          {/* Header bar */}
          <div className="flex items-center justify-between px-7 pt-6 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">AI Plan Builder</span>
            </div>
            <button onClick={close} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step dots */}
          <div className="px-7">
            <StepDots current={step} total={4} />
          </div>

          {/* Step content */}
          <div className="px-7 pb-2 min-h-[340px] overflow-hidden">
            <AnimatePresence custom={dir} mode="wait">
              <motion.div
                key={step}
                custom={dir}
                variants={SLIDE_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
              >
                {step === 0 && <Step1 goal={goal} setGoal={setGoal} />}
                {step === 1 && <Step2 details={details} setDetails={setDetails} />}
                {step === 2 && <Step3 onComplete={() => { /* result already set */ }} />}
                {step === 3 && result && (
                  <Step4
                    result={result}
                    goal={goal}
                    onApply={handleApply}
                    onRegenerate={() => { go(2); setTimeout(handleGenerate, 100); }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer nav — hidden on step 2 (auto-advances) and step 3 (has own buttons) */}
          {step !== 2 && step !== 3 && (
            <div className="flex items-center justify-between px-7 py-5 border-t border-border mt-2">
              <Button variant="ghost" onClick={step === 0 ? close : () => go(step - 1)} className="gap-1.5">
                {step === 0 ? <><X className="w-4 h-4" /> Cancel</> : <><ChevronLeft className="w-4 h-4" /> Back</>}
              </Button>
              <Button
                onClick={() => {
                  if (step === 1) { go(2); setTimeout(handleGenerate, 50); }
                  else go(step + 1);
                }}
                disabled={!canNext}
                className="gap-1.5"
              >
                {step === 1 ? <><Sparkles className="w-4 h-4" /> Generate Plan</> : <>Next <ChevronRight className="w-4 h-4" /></>}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}