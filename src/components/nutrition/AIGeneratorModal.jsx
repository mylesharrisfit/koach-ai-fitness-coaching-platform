import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ChevronLeft, ChevronRight, RotateCcw, Check, Flame, Zap, Leaf,
  Dumbbell, Scale, UtensilsCrossed, Pill, FileText, ChevronDown,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────
const GOALS = [
  { id: 'fat_loss',    emoji: '🔥', icon: Flame,    label: 'Fat Loss',    desc: 'Caloric deficit with high protein' },
  { id: 'muscle_gain', emoji: '💪', icon: Dumbbell, label: 'Muscle Gain', desc: 'Caloric surplus, strength focus' },
  { id: 'performance', emoji: '⚡', icon: Zap,      label: 'Performance', desc: 'Fuel for training and recovery' },
  { id: 'maintenance', emoji: '🌿', icon: Leaf,     label: 'Maintenance', desc: 'Balanced macros, sustainable eating' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary',         label: 'Sedentary',         multiplier: 1.0 },
  { value: 'lightly_active',    label: 'Lightly Active',    multiplier: 1.1 },
  { value: 'moderately_active', label: 'Moderately Active', multiplier: 1.2 },
  { value: 'very_active',       label: 'Very Active',       multiplier: 1.3 },
  { value: 'athlete',           label: 'Athlete',           multiplier: 1.4 },
];

const DIET_PREFS = ['Standard', 'High Protein', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean'];
const WORKOUT_TYPES = ['Weightlifting', 'HIIT', 'Cardio', 'CrossFit', 'Sports', 'Yoga/Pilates', 'Mixed'];
const ALLERGIES = ['Gluten Free', 'Dairy Free', 'Nut Free', 'Egg Free', 'Soy Free', 'Shellfish Free'];
const SUPPLEMENTS = ['Whey Protein', 'Creatine', 'Pre-Workout', 'BCAAs', 'Fish Oil', 'Vitamin D', 'Magnesium', 'Multivitamin', 'Caffeine', 'Collagen', 'None'];
const LOADING_MESSAGES = ['Calculating macros...', 'Structuring meals...', 'Optimizing for goal...', 'Adding supplements...'];

const INITIAL_DETAILS = {
  weight: '', weightUnit: 'kg',
  height: '', heightFeet: '', heightInches: '', heightUnit: 'cm',
  age: '', sex: 'male',
  activity: '', trainingDays: 4, workoutTime: 'Morning', workoutTypes: [],
  mealsPerDay: 4, preWorkout: false, preWorkoutTiming: '1hr', preWorkoutCarbs: false,
  postWorkout: false, mealPrepStyle: 'Mix',
  diet: '', allergies: [], dislikedFoods: '',
  supplements: [], notes: '',
};

// ── Macro calculation ─────────────────────────────────────────────────────────
const ACTIVITY_MULTIPLIERS = {
  sedentary:         1.2,
  lightly_active:    1.375,
  moderately_active: 1.55,
  very_active:       1.725,
  athlete:           1.9,
};

function calcMacros(goal, weightKg, heightCm, age, sex, activityValue, diet) {
  // Step 1 — BMR (Mifflin-St Jeor)
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * (parseFloat(age) || 25));
  const bmr = sex === 'female' ? base - 161 : base + 5;

  // Step 2 — TDEE
  const multiplier = ACTIVITY_MULTIPLIERS[activityValue] || 1.2;
  const tdee = bmr * multiplier;

  // Step 3 — Goal adjustment
  const goalMultipliers = { fat_loss: 0.80, muscle_gain: 1.10, performance: 1.05, maintenance: 1.00 };
  let calories = tdee * (goalMultipliers[goal] || 1.0);

  // Step 4 — Macros
  const proteinRatios    = { fat_loss: 2.2, muscle_gain: 2.0, performance: 1.8, maintenance: 1.6 };
  const fatRatios        = { fat_loss: 0.8, muscle_gain: 1.0, performance: 0.9, maintenance: 0.9 };
  let protein = weightKg * (proteinRatios[goal] || 1.8);
  let fats    = weightKg * (fatRatios[goal]    || 0.9);

  // Diet overrides
  if (diet === 'Keto')        { fats = weightKg * 1.8; }
  if (diet === 'High Protein') { protein = weightKg * 2.8; }

  let carbs = (calories - protein * 4 - fats * 9) / 4;

  // Step 5 — Sanity check
  if (carbs < 50) { carbs = 50; calories = protein * 4 + fats * 9 + carbs * 4; }

  return {
    bmr:      Math.round(bmr),
    tdee:     Math.round(tdee),
    calories: Math.round(calories),
    protein:  Math.round(protein),
    carbs:    Math.round(carbs),
    fats:     Math.round(fats),
  };
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function PillToggle({ options, value, onChange, multi = false }) {
  function handleClick(opt) {
    if (multi) {
      onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
    } else {
      onChange(opt);
    }
  }
  const isActive = (opt) => multi ? value.includes(opt) : value === opt;
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => handleClick(opt)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
            isActive(opt) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function UnitToggle({ options, value, onChange }) {
  return (
    <div className="flex border border-input rounded-lg overflow-hidden text-xs font-semibold h-9 shrink-0">
      {options.map(u => (
        <button key={u} type="button" onClick={() => onChange(u)}
          className={cn('px-3 transition-colors', value === u ? 'bg-primary text-white' : 'bg-background text-muted-foreground hover:bg-secondary')}
        >
          {u}
        </button>
      ))}
    </div>
  );
}

function YesNoToggle({ value, onChange }) {
  return (
    <div className="flex border border-input rounded-lg overflow-hidden text-xs font-semibold h-8 w-20 shrink-0">
      {[true, false].map(v => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className={cn('flex-1 transition-colors', value === v ? 'bg-primary text-white' : 'bg-background text-muted-foreground hover:bg-secondary')}
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
}

// ── Accordion Section ─────────────────────────────────────────────────────────
function AccordionSection({ icon: Icon, title, complete, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 bg-card hover:bg-secondary/30 transition-colors text-left"
      >
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', complete ? 'bg-emerald-100' : 'bg-secondary')}>
          {complete ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
        <span className="text-sm font-bold flex-1">{title}</span>
        {complete && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Done</span>}
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 border-t border-border space-y-4 bg-background">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Step dots ─────────────────────────────────────────────────────────────────
function StepDots({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={cn('rounded-full transition-all duration-300', i === current ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-border')} />
      ))}
    </div>
  );
}

const slideVariants = {
  enter:  (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

// ── Step 1 — Goal ─────────────────────────────────────────────────────────────
function Step1Goal({ goal, setGoal }) {
  return (
    <div>
      <h2 className="text-xl font-bold font-heading mb-1">What's the goal?</h2>
      <p className="text-sm text-muted-foreground mb-6">Select the primary objective for this plan</p>
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map(g => (
          <button key={g.id} onClick={() => setGoal(g.id)}
            className={cn('flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-150 hover:shadow-md',
              goal === g.id ? 'border-primary bg-accent/60' : 'border-border bg-white hover:border-primary/40')}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-2xl">{g.emoji}</span>
              {goal === g.id && <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-white" /></span>}
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

// ── Step 2 — Detailed Intake ──────────────────────────────────────────────────
function Step2Details({ details, setDetails }) {
  const u = (key, val) => setDetails(d => ({ ...d, [key]: val }));

  const s1Complete = !!details.weight;
  const s2Complete = !!details.activity;
  const s3Complete = !!details.mealsPerDay;
  const s4Complete = !!details.diet;
  const s5Complete = details.supplements.length > 0;
  const s6Complete = !!details.notes;
  const completedCount = [s1Complete, s2Complete, s3Complete, s4Complete, s5Complete, s6Complete].filter(Boolean).length;

  return (
    <div>
      <h2 className="text-xl font-bold font-heading mb-1">Tell us about your client</h2>
      <p className="text-sm text-muted-foreground mb-2">We'll use this to calculate precise macros</p>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${(completedCount / 6) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
        <span className="text-xs font-semibold text-muted-foreground shrink-0">{completedCount} of 6 sections</span>
      </div>

      <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">

        {/* Section 1 — Physical Stats */}
        <AccordionSection icon={Scale} title="Physical Stats" complete={s1Complete} defaultOpen>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label className="text-xs font-semibold mb-1.5 block">Body Weight <span className="text-destructive">*</span></Label>
              <Input type="number" placeholder="e.g. 80" value={details.weight} onChange={e => u('weight', e.target.value)} />
            </div>
            <UnitToggle options={['kg', 'lbs']} value={details.weightUnit} onChange={v => {
              const cur = parseFloat(details.weight);
              if (!isNaN(cur)) {
                const converted = v === 'lbs' ? Math.round(cur * 2.20462 * 10) / 10 : Math.round(cur * 0.453592 * 10) / 10;
                u('weight', String(converted));
              }
              u('weightUnit', v);
            }} />
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Height</Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Input type="number" placeholder="5" min={1} max={8} value={details.heightFeet} onChange={e => u('heightFeet', e.target.value)} className="w-16 text-center" />
                <span className="text-xs font-semibold text-muted-foreground">ft</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Input type="number" placeholder="10" min={0} max={11} value={details.heightInches} onChange={e => u('heightInches', e.target.value)} className="w-16 text-center" />
                <span className="text-xs font-semibold text-muted-foreground">in</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Age</Label>
              <Input type="number" placeholder="e.g. 28" value={details.age} onChange={e => u('age', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Biological Sex</Label>
              <div className="flex gap-2">
                {['male', 'female'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => u('sex', s)}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize',
                      details.sex === s ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    )}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Section 2 — Training */}
        <AccordionSection icon={Dumbbell} title="Training" complete={s2Complete}>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Activity Level <span className="text-destructive">*</span></Label>
            <Select value={details.activity} onValueChange={v => u('activity', v)}>
              <SelectTrigger><SelectValue placeholder="Select activity level" /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_LEVELS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Training Days / Week</Label>
            <PillToggle options={[2, 3, 4, 5, 6, 7]} value={details.trainingDays} onChange={v => u('trainingDays', v)} />
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Workout Time of Day</Label>
            <PillToggle options={['Morning', 'Afternoon', 'Evening', 'Varies']} value={details.workoutTime} onChange={v => u('workoutTime', v)} />
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Workout Type <span className="text-muted-foreground font-normal">(select all that apply)</span></Label>
            <PillToggle options={WORKOUT_TYPES} value={details.workoutTypes} onChange={v => u('workoutTypes', v)} multi />
          </div>
        </AccordionSection>

        {/* Section 3 — Meal Preferences */}
        <AccordionSection icon={UtensilsCrossed} title="Meal Preferences" complete={s3Complete}>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Meals Per Day <span className="text-destructive">*</span></Label>
            <PillToggle options={[2, 3, 4, 5, 6]} value={details.mealsPerDay} onChange={v => u('mealsPerDay', v)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label className="text-xs font-semibold">Include Pre-Workout Meal?</Label>
            <YesNoToggle value={details.preWorkout} onChange={v => u('preWorkout', v)} />
          </div>
          {details.preWorkout && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pl-3 border-l-2 border-primary/30 space-y-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Timing Before Workout</Label>
                <PillToggle options={['30min', '1hr', '2hr']} value={details.preWorkoutTiming} onChange={v => u('preWorkoutTiming', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Carb Focus Pre-Workout?</Label>
                <YesNoToggle value={details.preWorkoutCarbs} onChange={v => u('preWorkoutCarbs', v)} />
              </div>
            </motion.div>
          )}
          <div className="flex items-center justify-between gap-4">
            <Label className="text-xs font-semibold">Include Post-Workout Meal?</Label>
            <YesNoToggle value={details.postWorkout} onChange={v => u('postWorkout', v)} />
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Meal Prep Style</Label>
            <PillToggle options={['Fresh Daily', 'Meal Prep Weekly', 'Mix']} value={details.mealPrepStyle} onChange={v => u('mealPrepStyle', v)} />
          </div>
        </AccordionSection>

        {/* Section 4 — Diet & Restrictions */}
        <AccordionSection icon={Leaf} title="Diet & Restrictions" complete={s4Complete}>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Dietary Preference</Label>
            <Select value={details.diet} onValueChange={v => u('diet', v)}>
              <SelectTrigger><SelectValue placeholder="Select dietary preference" /></SelectTrigger>
              <SelectContent>
                {DIET_PREFS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Allergies / Restrictions</Label>
            <PillToggle options={ALLERGIES} value={details.allergies} onChange={v => u('allergies', v)} multi />
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Disliked Foods <span className="text-muted-foreground font-normal">(comma separated, optional)</span></Label>
            <Input placeholder="e.g. mushrooms, tofu, olives" value={details.dislikedFoods} onChange={e => u('dislikedFoods', e.target.value)} />
          </div>
        </AccordionSection>

        {/* Section 5 — Supplements */}
        <AccordionSection icon={Pill} title="Current Supplements" complete={s5Complete}>
          <PillToggle options={SUPPLEMENTS} value={details.supplements} onChange={v => u('supplements', v)} multi />
          {details.supplements.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {details.supplements.map(s => (
                <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {s}
                  <button type="button" onClick={() => u('supplements', details.supplements.filter(x => x !== s))} className="hover:text-destructive">×</button>
                </span>
              ))}
            </div>
          )}
        </AccordionSection>

        {/* Section 6 — Notes */}
        <AccordionSection icon={FileText} title="Additional Notes" complete={s6Complete}>
          <Textarea
            placeholder="Any other context for the coach (medical conditions, preferences, special requirements)..."
            value={details.notes}
            onChange={e => u('notes', e.target.value)}
            className="resize-none h-20"
          />
        </AccordionSection>
      </div>
    </div>
  );
}

// ── Step 3 — Generating ───────────────────────────────────────────────────────
function Step3Generating({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false; setProgress(0); setMsgIndex(0);
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + 2;
        if (next >= 100 && !doneRef.current) { doneRef.current = true; clearInterval(interval); setTimeout(onDone, 300); }
        return Math.min(next, 100);
      });
    }, 40);
    const msgTimer = setInterval(() => setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length), 900);
    return () => { clearInterval(interval); clearInterval(msgTimer); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-6">
      <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
      >
        <Sparkles className="w-8 h-8 text-white" />
      </motion.div>
      <div className="text-center">
        <h2 className="text-xl font-bold font-heading mb-1">Building your plan...</h2>
        <AnimatePresence mode="wait">
          <motion.p key={msgIndex} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="text-sm text-muted-foreground">
            {LOADING_MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="w-full max-w-xs">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
        </div>
        <p className="text-xs text-muted-foreground text-right mt-1">{progress}%</p>
      </div>
    </div>
  );
}

// ── Step 4 — Result ───────────────────────────────────────────────────────────
function Step4Result({ result, onApply, onRegenerate }) {
  const goalMeta = GOALS.find(g => g.id === result.goal);
  const actLabel = ACTIVITY_LEVELS.find(a => a.value === result.activity)?.label;
  const perMealCal = Math.round(result.calories / result.mealsPerDay);

  // Build meals list
  const baseMealNames = {
    2: ['Meal 1', 'Meal 2'],
    3: ['Breakfast', 'Lunch', 'Dinner'],
    4: ['Breakfast', 'Lunch', 'Snack', 'Dinner'],
    5: ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner'],
    6: ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack'],
  };
  let meals = [...(baseMealNames[result.mealsPerDay] || baseMealNames[4])];
  if (result.preWorkout && !meals.includes('Pre-Workout')) meals.push('Pre-Workout');
  if (result.postWorkout && !meals.includes('Post-Workout')) meals.push('Post-Workout');

  return (
    <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-4">
      <div>
        <h2 className="text-xl font-bold font-heading mb-1">Your AI Plan is Ready ✨</h2>
        <p className="text-sm text-muted-foreground">Review the calculated plan below</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-5 space-y-4">
        {/* Goal + diet badge row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xl">{goalMeta?.emoji}</span>
          <span className="text-sm font-bold px-3 py-1 rounded-full bg-white border border-primary/20 text-primary shadow-sm">{goalMeta?.label}</span>
          {result.diet && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-border text-muted-foreground">{result.diet}</span>}
          <span className="text-xs text-muted-foreground ml-auto">{actLabel}</span>
        </div>

        {/* Calories */}
        <div className="text-center">
          <p className="text-4xl font-extrabold text-foreground tracking-tight">{result.calories}</p>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mt-0.5">calories / day · ~{perMealCal} kcal per meal</p>
          <div className="flex justify-center gap-4 mt-2">
            <span className="text-[11px] text-muted-foreground bg-white/60 px-2 py-0.5 rounded-full border border-border">BMR: {result.bmr} kcal</span>
            <span className="text-[11px] text-muted-foreground bg-white/60 px-2 py-0.5 rounded-full border border-border">TDEE: {result.tdee} kcal</span>
          </div>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Protein', value: result.protein, color: 'text-red-500' },
            { label: 'Carbs',   value: result.carbs,   color: 'text-amber-500' },
            { label: 'Fats',    value: result.fats,    color: 'text-blue-500' },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
              <p className={cn('text-2xl font-extrabold', m.color)}>{m.value}<span className="text-sm font-semibold text-muted-foreground">g</span></p>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Meal structure */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-2.5">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
          Meal Structure ({meals.length} meals/day)
        </p>
        {meals.map(name => {
          const isPre  = name === 'Pre-Workout';
          const isPost = name === 'Post-Workout';
          const calAmt = isPre  ? Math.round(result.calories * 0.15)
                       : isPost ? Math.round(result.calories * 0.20)
                       : perMealCal;
          const protAmt = isPre  ? Math.round(result.protein * 0.10)
                        : isPost ? Math.round(result.protein * 0.30)
                        : Math.round(result.protein / result.mealsPerDay);
          const carbAmt = isPre && result.preWorkoutCarbs ? Math.round(result.carbs * 0.30) : Math.round(result.carbs / result.mealsPerDay);
          return (
            <div key={name} className={cn('flex items-center justify-between p-2.5 rounded-xl', isPre ? 'bg-amber-50 border border-amber-100' : isPost ? 'bg-blue-50 border border-blue-100' : 'bg-secondary/30')}>
              <div className="flex items-center gap-2">
                <span className="text-sm">{isPre ? '⚡' : isPost ? '💪' : '🍽️'}</span>
                <div>
                  <p className="text-xs font-bold text-foreground">{name}</p>
                  {(isPre || isPost) && <p className="text-[10px] text-muted-foreground">{isPost ? 'High protein + carbs' : result.preWorkoutCarbs ? 'Carb focused' : 'Balanced'}</p>}
                </div>
              </div>
              <div className="flex gap-2 text-[10px] font-semibold">
                <span className="text-orange-600">{calAmt} kcal</span>
                <span className="text-red-500">P {protAmt}g</span>
                <span className="text-amber-500">C {carbAmt}g</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Supplements */}
      {result.supplements?.filter(s => s !== 'None').length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">💊 Supplement Stack</p>
          <div className="flex flex-wrap gap-1.5">
            {result.supplements.filter(s => s !== 'None').map(s => (
              <span key={s} className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Allergies / restrictions note */}
      {result.allergies?.length > 0 && (
        <div className="text-xs text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2">
          ⚠️ Plan excludes: {result.allergies.join(', ')}
        </div>
      )}

      <div className="flex gap-3 pt-1">
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

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function AIGeneratorModal({ open, onOpenChange, onApply }) {
  const [step, setStep]       = useState(0);
  const [dir, setDir]         = useState(1);
  const [goal, setGoal]       = useState(null);
  const [details, setDetails] = useState(INITIAL_DETAILS);
  const [result, setResult]   = useState(null);

  function go(next) { setDir(next > step ? 1 : -1); setStep(next); }

  function handleGeneratingDone() {
    const weightKg = details.weightUnit === 'lbs'
      ? parseFloat(details.weight) / 2.2046
      : parseFloat(details.weight);
    const heightCm = (parseFloat(details.heightFeet) || 0) * 30.48 + (parseFloat(details.heightInches) || 0) * 2.54;
    const macros = calcMacros(goal, weightKg, heightCm, details.age, details.sex, details.activity, details.diet);
    setResult({
      ...macros, goal,
      diet:          details.diet || 'Standard',
      activity:      details.activity || 'sedentary',
      mealsPerDay:   details.mealsPerDay || 4,
      preWorkout:    details.preWorkout,
      preWorkoutCarbs: details.preWorkoutCarbs,
      postWorkout:   details.postWorkout,
      supplements:   details.supplements,
      allergies:     details.allergies,
    });
    setDir(1); setStep(3);
  }

  function handleApply() {
    onApply?.(result);
    onOpenChange(false);
    reset();
  }

  function reset() {
    setStep(0); setDir(1); setGoal(null); setDetails({ ...INITIAL_DETAILS }); setResult(null);
  }

  function canNext() {
    if (step === 0) return !!goal;
    if (step === 1) return !!details.weight && !!details.activity;
    return true;
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="px-8 pt-8 pb-6">
          <StepDots current={step} total={4} />
          <AnimatePresence custom={dir} mode="wait">
            <motion.div key={step} custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: 'easeInOut' }}>
              {step === 0 && <Step1Goal goal={goal} setGoal={setGoal} />}
              {step === 1 && <Step2Details details={details} setDetails={setDetails} />}
              {step === 2 && <Step3Generating onDone={handleGeneratingDone} />}
              {step === 3 && result && <Step4Result result={result} onApply={handleApply} onRegenerate={() => go(2)} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {step < 2 && (
          <div className="flex items-center justify-between px-8 py-4 border-t border-border bg-secondary/30">
            <Button variant="ghost" size="sm" onClick={step === 0 ? () => onOpenChange(false) : () => go(step - 1)} className="gap-1 text-muted-foreground">
              {step === 0 ? 'Cancel' : <><ChevronLeft className="w-4 h-4" /> Back</>}
            </Button>
            <Button size="sm" disabled={!canNext()} onClick={() => go(step + 1)} className="gap-1">
              {step === 1 ? <><Sparkles className="w-3.5 h-3.5" /> Generate Plan</> : <>Next <ChevronRight className="w-4 h-4" /></>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}