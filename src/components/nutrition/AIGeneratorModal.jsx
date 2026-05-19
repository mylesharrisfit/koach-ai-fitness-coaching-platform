import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ChevronLeft, ChevronRight, RotateCcw, Check, Flame, Zap, Leaf,
  Dumbbell, Scale, UtensilsCrossed, Pill, FileText, ChevronDown, Copy, ClipboardCheck,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
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

const SUPPLEMENT_DEFAULTS = {
  'Whey Protein':  { dosage: '25-30g per serving, post-workout',            timing: 'Post-Workout', emoji: '🥛' },
  'Creatine':      { dosage: '5g daily, any time',                           timing: 'Morning',      emoji: '💪' },
  'Pre-Workout':   { dosage: '1 scoop, 20-30 min before training',           timing: 'Pre-Workout',  emoji: '⚡' },
  'BCAAs':         { dosage: '5-10g during or post-workout',                 timing: 'Post-Workout', emoji: '🔋' },
  'Fish Oil':      { dosage: '1-2g EPA/DHA daily, with meals',               timing: 'With Meals',   emoji: '🐟' },
  'Vitamin D':     { dosage: '2000-5000 IU daily, with fat-containing meal', timing: 'With Meals',   emoji: '☀️' },
  'Magnesium':     { dosage: '300-400mg daily, before bed',                  timing: 'Before Bed',   emoji: '😴' },
  'Multivitamin':  { dosage: '1 serving daily, with breakfast',              timing: 'Morning',      emoji: '💊' },
  'Caffeine':      { dosage: '100-200mg, 30-45 min pre-workout',             timing: 'Pre-Workout',  emoji: '☕' },
  'Collagen':      { dosage: '10-15g daily, with vitamin C source',          timing: 'Morning',      emoji: '✨' },
};

const SUPPLEMENT_GOAL_REASONS = {
  fat_loss: {
    'Whey Protein': 'Preserve muscle mass during caloric deficit',
    'Fish Oil':     'Reduce inflammation, support fat metabolism',
    'Caffeine':     'Boost metabolic rate and training performance',
    'Vitamin D':    'Support hormone balance and immune function',
    'Creatine':     'Maintain strength output while in a deficit',
    'Magnesium':    'Reduce cortisol and support quality sleep',
    'Multivitamin': 'Fill micronutrient gaps from reduced food intake',
    'BCAAs':        'Minimize muscle catabolism during fasted training',
    'Pre-Workout':  'Increase calorie burn and workout intensity',
    'Collagen':     'Support joint health during increased activity',
  },
  muscle_gain: {
    'Creatine':     'Increase strength output and muscle cell volume',
    'Whey Protein': 'Fast-absorbing protein to maximize muscle protein synthesis',
    'Magnesium':    'Support recovery and sleep quality for muscle repair',
    'BCAAs':        'Stimulate muscle protein synthesis between meals',
    'Pre-Workout':  'Drive heavier lifts and greater training volume',
    'Fish Oil':     'Reduce inflammation and support anabolic signaling',
    'Multivitamin': 'Ensure micronutrient sufficiency for growth',
    'Caffeine':     'Improve performance and reduce perceived exertion',
    'Vitamin D':    'Support testosterone levels and muscle function',
    'Collagen':     'Strengthen connective tissue to support heavier loads',
  },
  performance: {
    'Pre-Workout':  'Enhance focus, pump and endurance during training',
    'BCAAs':        'Reduce muscle breakdown during intense training',
    'Creatine':     'Improve power output and training capacity',
    'Caffeine':     'Delay fatigue and sharpen mental focus',
    'Fish Oil':     'Reduce exercise-induced inflammation and DOMS',
    'Magnesium':    'Prevent cramping and support energy metabolism',
    'Whey Protein': 'Accelerate post-training muscle repair',
    'Vitamin D':    'Optimize neuromuscular function and VO2 max',
    'Multivitamin': 'Support high training demands on micronutrients',
    'Collagen':     'Protect joints and tendons under high load',
  },
  maintenance: {
    'Whey Protein': 'Meet daily protein targets conveniently',
    'Fish Oil':     'Support cardiovascular health and longevity',
    'Magnesium':    'Promote relaxation and overall wellbeing',
    'Multivitamin': 'Fill daily micronutrient gaps from diet',
    'Vitamin D':    'Maintain bone density and immune resilience',
    'Creatine':     'Preserve strength and cognitive function',
    'Collagen':     'Support skin, hair and joint health',
    'Caffeine':     'Sustain training energy and motivation',
    'BCAAs':        'Support lean mass retention',
    'Pre-Workout':  'Keep training sessions focused and productive',
  },
};

const MEAL_COMPLEXITY = [
  { id: 'very_basic', emoji: '🥫', label: 'Very Basic',  desc: 'Simple whole foods, minimal cooking', color: 'gray' },
  { id: 'simple',     emoji: '🍳', label: 'Simple',      desc: 'Easy recipes, 15 min or less',        color: 'gray' },
  { id: 'moderate',   emoji: '🥘', label: 'Moderate',    desc: 'Balanced home cooking',                color: 'blue', popular: true },
  { id: 'upscale',    emoji: '👨‍🍳', label: 'Upscale',    desc: 'Restaurant-quality meals',            color: 'amber' },
  { id: 'gourmet',    emoji: '⭐', label: 'Gourmet',     desc: 'Complex recipes, premium ingredients', color: 'purple' },
];

const CONDIMENTS = [
  { id: 'hot_sauce',       emoji: '🌶️', label: 'Hot Sauce',        kcal: '0–5 kcal' },
  { id: 'lemon_lime',      emoji: '🍋', label: 'Lemon/Lime',        kcal: '5 kcal' },
  { id: 'fresh_herbs',     emoji: '🌿', label: 'Fresh Herbs',        kcal: '0 kcal' },
  { id: 'garlic_onion',    emoji: '🧄', label: 'Garlic & Onion',    kcal: '10 kcal' },
  { id: 'mustard',         emoji: '🥣', label: 'Mustard',            kcal: '5 kcal' },
  { id: 'soy_sauce',       emoji: '🍶', label: 'Soy Sauce',          kcal: '10 kcal' },
  { id: 'salsa',           emoji: '🫙', label: 'Salsa',              kcal: '15 kcal' },
  { id: 'sf_bbq',          emoji: '🥫', label: 'Sugar-Free BBQ',    kcal: '15 kcal' },
  { id: 'spice_blends',    emoji: '🧂', label: 'Spice Blends',       kcal: '0 kcal' },
  { id: 'balsamic',        emoji: '🍯', label: 'Balsamic Glaze',     kcal: '20 kcal' },
  { id: 'greek_yogurt',    emoji: '🥛', label: 'Greek Yogurt Sauce', kcal: '20 kcal' },
  { id: 'olive_spray',     emoji: '🫒', label: 'Olive Oil Spray',    kcal: '10 kcal' },
];
const LOADING_MESSAGES = ['Calculating macros...', 'Structuring meals...', '🤖 AI is building your meal plan...', 'Optimizing for goal...', 'Adding supplements...', 'Finalizing your plan...'];

const INITIAL_DETAILS = {
  weight: '', weightUnit: 'kg',
  height: '', heightFeet: '', heightInches: '', heightUnit: 'cm',
  age: '', sex: 'male',
  activity: '', trainingDays: 4, workoutTime: 'Morning', workoutTypes: [],
  mealsPerDay: 4, preWorkout: false, preWorkoutTiming: '1hr', preWorkoutCarbs: false,
  postWorkout: false, mealPrepStyle: 'Mix',
  diet: '', allergies: [], dislikedFoods: '',
  supplements: [], supplementDosages: {}, notes: '',
  weightLossRate: 1,
  mealComplexity: 'moderate',
  condiments: [],
};

const WEIGHT_LOSS_RATES = [
  { value: 0.25, label: '0.25 lbs/wk', desc: 'Very Gradual',     color: 'green',  badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 0.5,  label: '0.5 lbs/wk',  desc: 'Slow & Steady',    color: 'green',  badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 1,    label: '1 lb/wk',     desc: 'Moderate',          color: 'blue',   badgeColor: 'bg-blue-100 text-blue-700 border-blue-300',   recommended: true },
  { value: 1.5,  label: '1.5 lbs/wk',  desc: 'Aggressive',        color: 'amber',  badgeColor: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 2,    label: '2 lbs/wk',    desc: 'Very Aggressive',   color: 'red',    badgeColor: 'bg-red-100 text-red-700 border-red-300',       warning: true },
];

// ── Macro calculation ─────────────────────────────────────────────────────────
const ACTIVITY_MULTIPLIERS = {
  sedentary:         1.2,
  lightly_active:    1.375,
  moderately_active: 1.55,
  very_active:       1.725,
  athlete:           1.9,
};

const MIN_CALORIES = { male: 1500, female: 1200 };

function calcMacros(goal, weightKg, heightCm, age, sex, activityValue, diet, weightLossRate = 1) {
  // Step 1 — BMR (Mifflin-St Jeor)
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * (parseFloat(age) || 25));
  const bmr = sex === 'female' ? base - 161 : base + 5;

  // Step 2 — TDEE
  const multiplier = ACTIVITY_MULTIPLIERS[activityValue] || 1.2;
  const tdee = bmr * multiplier;

  // Step 3 — Goal adjustment
  let calories;
  let dailyDeficit = 0;
  let deficitCapped = false;

  if (goal === 'fat_loss') {
    const weeklyDeficit = weightLossRate * 3500;
    dailyDeficit = Math.round(weeklyDeficit / 7);
    const minCal = MIN_CALORIES[sex] || 1500;
    const uncapped = tdee - dailyDeficit;
    if (uncapped < minCal) {
      calories = minCal;
      deficitCapped = true;
    } else {
      calories = uncapped;
    }
  } else {
    const goalMultipliers = { muscle_gain: 1.10, performance: 1.05, maintenance: 1.00 };
    calories = tdee * (goalMultipliers[goal] || 1.0);
  }

  // Step 4 — Macros
  const proteinRatios    = { fat_loss: 2.2, muscle_gain: 2.0, performance: 1.8, maintenance: 1.6 };
  const fatRatios        = { fat_loss: 0.8, muscle_gain: 1.0, performance: 0.9, maintenance: 0.9 };
  let protein = weightKg * (proteinRatios[goal] || 1.8);
  let fats    = weightKg * (fatRatios[goal]    || 0.9);

  // Diet overrides
  if (diet === 'Keto')         { fats = weightKg * 1.8; }
  if (diet === 'High Protein') { protein = weightKg * 2.8; }

  let carbs = (calories - protein * 4 - fats * 9) / 4;

  // Step 5 — Sanity check
  if (carbs < 50) { carbs = 50; calories = protein * 4 + fats * 9 + carbs * 4; }

  return {
    bmr:           Math.round(bmr),
    tdee:          Math.round(tdee),
    calories:      Math.round(calories),
    protein:       Math.round(protein),
    carbs:         Math.round(carbs),
    fats:          Math.round(fats),
    dailyDeficit,
    deficitCapped,
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

// ── Weight Loss Rate Selector ─────────────────────────────────────────────────
function WeightLossRateSelector({ value, onChange }) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2">
        {WEIGHT_LOSS_RATES.map(rate => (
          <button
            key={rate.value}
            type="button"
            onClick={() => onChange(rate.value)}
            className={cn(
              'relative flex flex-col items-start px-3 py-2 rounded-xl border-2 text-left transition-all text-xs',
              value === rate.value
                ? rate.color === 'green'  ? 'border-emerald-500 bg-emerald-50'
                : rate.color === 'blue'   ? 'border-blue-500 bg-blue-50'
                : rate.color === 'amber'  ? 'border-amber-500 bg-amber-50'
                : 'border-red-500 bg-red-50'
                : 'border-border bg-background hover:border-muted-foreground/40'
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className={cn('font-bold', value === rate.value
                ? rate.color === 'green'  ? 'text-emerald-700'
                : rate.color === 'blue'   ? 'text-blue-700'
                : rate.color === 'amber'  ? 'text-amber-700'
                : 'text-red-700'
                : 'text-foreground'
              )}>
                {rate.label}
              </span>
              {rate.warning && <span className="text-xs">⚠️</span>}
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">{rate.desc}</span>
            {rate.recommended && (
              <span className="absolute -top-2 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white">
                Recommended
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground bg-secondary/50 px-2.5 py-1.5 rounded-lg">
        1 lb of fat = ~3,500 calories. Higher deficits risk muscle loss.
      </p>
    </div>
  );
}

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
function Step2Details({ details, setDetails, goal }) {
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
          {goal === 'fat_loss' && (
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Weekly Weight Loss Goal</Label>
              <WeightLossRateSelector value={details.weightLossRate} onChange={v => u('weightLossRate', v)} />
            </div>
          )}
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

          {/* Meal Complexity */}
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Meal Style</Label>
            <div className="flex flex-wrap gap-2">
              {MEAL_COMPLEXITY.map(opt => {
                const active = details.mealComplexity === opt.id;
                const borderColor =
                  opt.color === 'blue'   ? (active ? 'border-blue-500 bg-blue-50'     : 'border-border hover:border-blue-300') :
                  opt.color === 'amber'  ? (active ? 'border-amber-500 bg-amber-50'   : 'border-border hover:border-amber-300') :
                  opt.color === 'purple' ? (active ? 'border-purple-500 bg-purple-50' : 'border-border hover:border-purple-300') :
                                          (active ? 'border-gray-400 bg-gray-50'     : 'border-border hover:border-gray-300');
                const labelColor =
                  active
                    ? opt.color === 'blue'   ? 'text-blue-700'
                    : opt.color === 'amber'  ? 'text-amber-700'
                    : opt.color === 'purple' ? 'text-purple-700'
                    : 'text-gray-700'
                    : 'text-foreground';
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => u('mealComplexity', opt.id)}
                    className={`relative flex flex-col items-start px-3 py-2 rounded-xl border-2 text-left transition-all text-xs ${borderColor}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{opt.emoji}</span>
                      <span className={`font-bold ${labelColor}`}>{opt.label}</span>
                      {opt.popular && (
                        <span className="absolute -top-2 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white">Popular</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sauces & Seasonings */}
          <div>
            <Label className="text-xs font-semibold mb-0.5 block">Sauces & Seasonings</Label>
            <p className="text-[10px] text-muted-foreground mb-2">Low calorie options to keep meals flavorful</p>
            <div className="flex flex-wrap gap-1.5">
              {CONDIMENTS.map(c => {
                const active = details.condiments.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => u('condiments', active ? details.condiments.filter(x => x !== c.id) : [...details.condiments, c.id])}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                      active ? 'border-primary bg-accent text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    <span>{c.emoji}</span>
                    <span>{c.label}</span>
                    <span className={`text-[10px] font-normal ${active ? 'text-primary/70' : 'text-muted-foreground'}`}>{c.kcal}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 bg-secondary/50 px-2.5 py-1.5 rounded-lg">
              These add flavor without significantly impacting your macros
            </p>
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
          <div className="flex flex-wrap gap-1.5">
            {SUPPLEMENTS.filter(s => s !== 'None').map(s => {
              const active = details.supplements.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? details.supplements.filter(x => x !== s)
                      : [...details.supplements, s];
                    u('supplements', next);
                    if (!active && !details.supplementDosages[s]) {
                      u('supplementDosages', { ...details.supplementDosages, [s]: SUPPLEMENT_DEFAULTS[s]?.dosage || '' });
                    }
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                    active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  <span>{SUPPLEMENT_DEFAULTS[s]?.emoji || '💊'}</span>
                  {s}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => { u('supplements', []); u('supplementDosages', {}); }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                details.supplements.length === 0 ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'
              )}
            >
              None
            </button>
          </div>

          {details.supplements.length > 0 && (
            <div className="space-y-2 mt-2">
              {details.supplements.map(s => {
                const def = SUPPLEMENT_DEFAULTS[s] || {};
                return (
                  <div key={s} className="rounded-xl border border-border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{def.emoji || '💊'}</span>
                        <span className="text-sm font-bold text-foreground">{s}</span>
                        {def.timing && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            {def.timing}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => u('supplements', details.supplements.filter(x => x !== s))}
                        className="text-muted-foreground hover:text-destructive text-xs"
                      >×</button>
                    </div>
                    <input
                      type="text"
                      value={details.supplementDosages[s] ?? def.dosage ?? ''}
                      onChange={e => u('supplementDosages', { ...details.supplementDosages, [s]: e.target.value })}
                      placeholder="e.g. 5g daily, any time"
                      className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                );
              })}
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
function Step3Generating({ onDone, macroPayload }) {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const doneRef = useRef(false);
  const apiCalledRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    apiCalledRef.current = false;
    setProgress(0);
    setMsgIndex(0);

    // Progress bar: goes to 85% quickly then waits for API
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 85) return p;
        return p + 1.5;
      });
    }, 50);
    const msgTimer = setInterval(() => setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length), 1000);

    // Call the API
    if (!apiCalledRef.current) {
      apiCalledRef.current = true;
      base44.functions.invoke('generateMealPlan', macroPayload)
        .then(res => {
          const meals = res.data?.meals || [];
          clearInterval(interval);
          setProgress(100);
          setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone(meals); } }, 400);
        })
        .catch(() => {
          clearInterval(interval);
          setProgress(100);
          setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone([]); } }, 400);
        });
    }

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
          <motion.div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
        <p className="text-xs text-muted-foreground text-right mt-1">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}

// ── Meal Card ─────────────────────────────────────────────────────────────────
function MealCard({ meal }) {
  const [open, setOpen] = useState(false);
  const isPre  = meal.type === 'pre_workout'  || meal.name?.toLowerCase().includes('pre-workout');
  const isPost = meal.type === 'post_workout' || meal.name?.toLowerCase().includes('post-workout');
  const bg = isPre ? 'bg-amber-50 border-amber-200' : isPost ? 'bg-blue-50 border-blue-200' : 'bg-card border-border';
  const emoji = isPre ? '⚡' : isPost ? '💪' : '🍽️';

  return (
    <div className={cn('rounded-xl border overflow-hidden', bg)}>
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-black/5 transition-colors">
        <span className="text-lg">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">{meal.name}</span>
            {meal.time && <span className="text-[10px] text-muted-foreground font-medium">{meal.time}</span>}
            {meal.prepTime && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full text-muted-foreground">⏱ {meal.prepTime}</span>}
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className="text-[10px] font-bold text-orange-600">{meal.calories} kcal</span>
            <span className="text-[10px] font-semibold text-red-500">P {meal.protein}g</span>
            <span className="text-[10px] font-semibold text-amber-500">C {meal.carbs}g</span>
            <span className="text-[10px] font-semibold text-blue-500">F {meal.fats}g</span>
          </div>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-2 border-t border-border/50">
              {/* Foods */}
              {meal.foods?.map((food, i) => (
                <div key={i} className="flex items-start gap-2 pt-2">
                  <span className="text-base mt-0.5">🥗</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">{food.name}</span>
                      <span className="text-[10px] text-orange-600 font-bold shrink-0">{food.calories} kcal</span>
                    </div>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{food.amount}</span>
                      <span className="text-[10px] text-red-400">P {food.protein}g</span>
                      <span className="text-[10px] text-amber-400">C {food.carbs}g</span>
                      <span className="text-[10px] text-blue-400">F {food.fats}g</span>
                    </div>
                    {food.prep && <p className="text-[10px] text-muted-foreground mt-0.5 italic">{food.prep}</p>}
                  </div>
                </div>
              ))}
              {/* Instructions */}
              {meal.instructions && (
                <div className="mt-2 p-2 bg-secondary/40 rounded-lg">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">How to prepare</p>
                  <p className="text-xs text-foreground">{meal.instructions}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Step 4 — Result ───────────────────────────────────────────────────────────
function Step4Result({ result, onApply, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const goalMeta = GOALS.find(g => g.id === result.goal);
  const actLabel = ACTIVITY_LEVELS.find(a => a.value === result.activity)?.label;
  const perMealCal = Math.round(result.calories / (result.meals?.length || result.mealsPerDay || 4));

  function copyPlan() {
    const lines = [`=== AI Nutrition Plan ===`, `Goal: ${goalMeta?.label} | Diet: ${result.diet} | ${actLabel}`,
      `Calories: ${result.calories} kcal (BMR: ${result.bmr} | TDEE: ${result.tdee})`,
      `Protein: ${result.protein}g | Carbs: ${result.carbs}g | Fats: ${result.fats}g`, ''];
    (result.meals || []).forEach(meal => {
      lines.push(`--- ${meal.name} (${meal.time || ''}) ---`);
      lines.push(`${meal.calories} kcal | P ${meal.protein}g | C ${meal.carbs}g | F ${meal.fats}g`);
      (meal.foods || []).forEach(f => lines.push(`  • ${f.name} — ${f.amount} (${f.calories} kcal)`));
      if (meal.instructions) lines.push(`  How to prep: ${meal.instructions}`);
      lines.push('');
    });
    if (result.supplements?.filter(s => s !== 'None').length > 0) {
      lines.push(`Supplements: ${result.supplements.filter(s => s !== 'None').join(', ')}`);
    }
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading mb-1">Your AI Plan is Ready ✨</h2>
          <p className="text-sm text-muted-foreground">Review the detailed meal plan below</p>
        </div>
        <button type="button" onClick={copyPlan} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary">
          {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Summary card */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xl">{goalMeta?.emoji}</span>
          <span className="text-sm font-bold px-3 py-1 rounded-full bg-white border border-primary/20 text-primary shadow-sm">{goalMeta?.label}</span>
          {result.diet && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-border text-muted-foreground">{result.diet}</span>}
          <span className="text-xs text-muted-foreground ml-auto">{actLabel}</span>
        </div>
        <div className="text-center">
          <p className="text-4xl font-extrabold text-foreground tracking-tight">{result.calories}</p>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mt-0.5">calories / day · ~{perMealCal} kcal per meal</p>
          {result.goal === 'fat_loss' && result.weightLossRate && (
            <p className="text-[11px] text-blue-600 font-semibold mt-1">
              Target: lose {result.weightLossRate} lb/week · {result.dailyDeficit} kcal/day deficit
            </p>
          )}
          {result.deficitCapped && (
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5 bg-amber-50 px-3 py-1 rounded-full inline-block">
              ⚠️ Deficit capped to protect minimum healthy intake
            </p>
          )}
          <div className="flex justify-center gap-3 mt-2">
            <span className="text-[11px] text-muted-foreground bg-white/70 px-2 py-0.5 rounded-full border border-border">BMR: {result.bmr} kcal</span>
            <span className="text-[11px] text-muted-foreground bg-white/70 px-2 py-0.5 rounded-full border border-border">TDEE: {result.tdee} kcal</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Protein', value: result.protein, color: 'text-red-500' },
            { label: 'Carbs',   value: result.carbs,   color: 'text-amber-500' },
            { label: 'Fats',    value: result.fats,    color: 'text-blue-500' },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-xl p-2.5 text-center shadow-sm">
              <p className={cn('text-xl font-extrabold', m.color)}>{m.value}<span className="text-xs font-semibold text-muted-foreground">g</span></p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Meal cards */}
      {result.meals?.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Daily Meal Plan ({result.meals.length} meals)</p>
          {result.meals.map((meal, i) => <MealCard key={i} meal={meal} />)}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground text-center py-4">No meal data available</div>
      )}

      {/* Supplements */}
      {result.supplements?.filter(s => s !== 'None').length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">💊 Supplement Protocol</p>
          <div className="space-y-2">
            {result.supplements.filter(s => s !== 'None').map(s => {
              const def = SUPPLEMENT_DEFAULTS[s] || {};
              const dosage = result.supplementDosages?.[s] || def.dosage || '';
              const reason = (SUPPLEMENT_GOAL_REASONS[result.goal] || {})[s] || 'Support overall health and performance';
              return (
                <div key={s} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
                  <span className="text-xl shrink-0 mt-0.5">{def.emoji || '💊'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">{s}</span>
                      {def.timing && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          {def.timing}
                        </span>
                      )}
                    </div>
                    {dosage && <p className="text-xs text-foreground font-medium mt-0.5">{dosage}</p>}
                    <p className="text-[11px] text-muted-foreground mt-0.5 italic">{reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
  const [step, setStep]           = useState(0);
  const [dir, setDir]             = useState(1);
  const [goal, setGoal]           = useState(null);
  const [details, setDetails]     = useState(INITIAL_DETAILS);
  const [result, setResult]       = useState(null);
  const [macroPayload, setMacroPayload] = useState(null);

  function go(next) { setDir(next > step ? 1 : -1); setStep(next); }

  function handleStartGenerating() {
    const weightKg = details.weightUnit === 'lbs'
      ? parseFloat(details.weight) / 2.2046
      : parseFloat(details.weight);
    const heightCm = (parseFloat(details.heightFeet) || 0) * 30.48 + (parseFloat(details.heightInches) || 0) * 2.54;
    const macros = calcMacros(goal, weightKg, heightCm, details.age, details.sex, details.activity, details.diet, details.weightLossRate || 1);
    const payload = {
      age: details.age || 25,
      sex: details.sex || 'male',
      weightKg: Math.round(weightKg * 10) / 10,
      goal,
      diet: details.diet || 'Standard',
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fats: macros.fats,
      mealsPerDay: details.mealsPerDay || 4,
      preWorkout: details.preWorkout,
      preWorkoutCarbs: details.preWorkoutCarbs,
      postWorkout: details.postWorkout,
      restrictions: [...(details.allergies || []), details.dislikedFoods].filter(Boolean).join(', '),
      supplements: details.supplements,
      supplementDosages: details.supplementDosages || {},
      mealComplexity: details.mealComplexity || 'moderate',
      condiments: (details.condiments || []).map(id => CONDIMENTS.find(c => c.id === id)?.label).filter(Boolean),
    };
    setMacroPayload({ ...payload, _macros: { ...macros, weightLossRate: details.weightLossRate || 1 } });
    go(2);
  }

  function handleGeneratingDone(rawMeals) {
    const normalizedMeals = (rawMeals || []).map(meal => ({
      ...meal,
      name:         meal.name || meal.meal_name || '',
      meal_name:    meal.name || meal.meal_name || '',
      instructions: meal.instructions || meal.prep || '',
      notes:        meal.instructions || meal.prep || '',
      foods: (meal.foods || []).map(food => ({
        name:      food.name || food.food_name || food.item || '',
        food_name: food.name || food.food_name || food.item || '',
        amount:    food.amount || food.serving || food.portion || '',
        portion:   food.amount || food.serving || food.portion || '',
        calories:  Number(food.calories) || 0,
        protein:   Number(food.protein)  || 0,
        carbs:     Number(food.carbs)    || 0,
        fats:      Number(food.fats)     || Number(food.fat) || 0,
        prep:      food.prep             || '',
      })),
    }));
    const m = macroPayload._macros;
    setResult({
      ...m, goal,
      diet:            details.diet || 'Standard',
      activity:        details.activity || 'sedentary',
      mealsPerDay:     details.mealsPerDay || 4,
      preWorkout:      details.preWorkout,
      preWorkoutCarbs: details.preWorkoutCarbs,
      postWorkout:     details.postWorkout,
      supplements:        details.supplements,
      supplementDosages:  details.supplementDosages || {},
      allergies:          details.allergies,
      weightLossRate:     details.weightLossRate || 1,
      meals: normalizedMeals,
    });
    setDir(1); setStep(3);
  }

  function handleApply() {
    const goalMeta = GOALS.find(g => g.id === result.goal);
    const emojiMap = { fat_loss: '🔥', muscle_gain: '💪', performance: '⚡', maintenance: '🌿' };
    const condimentLabels = (result.condiments || []);

    onApply?.({
      title: `${goalMeta?.label || result.goal} Plan - AI Generated`,
      description: `AI-generated ${(goalMeta?.label || result.goal).toLowerCase()} plan. ${result.diet || 'Standard'} diet, ${result.mealsPerDay} meals/day.${result.goal === 'fat_loss' && result.weightLossRate ? ` Target: lose ${result.weightLossRate} lb/week.` : ''}`,
      emoji: emojiMap[result.goal] || '🥗',
      tracking_mode: 'macros',
      calories: result.calories,
      protein_g: result.protein,
      carbs_g: result.carbs,
      fats_g: result.fats,
      meals: (result.meals || []).map(meal => ({
        name:              meal.name,
        meal_name:         meal.name,
        time:              meal.time,
        calories:          meal.calories,
        instructions:      meal.instructions,
        notes:             meal.instructions,
        habit_description: meal.instructions,
        foods: (meal.foods || []).map(f => ({
          name:      f.name,
          food_name: f.name,
          amount:    f.amount,
          portion:   f.amount,
          calories:  f.calories,
          protein:   f.protein,
          carbs:     f.carbs,
          fats:      f.fats,
        })),
      })),
      supplements: (result.supplements || []).filter(s => s !== 'None').map(s => ({ name: s, category: 'supplement' })),
      notes: condimentLabels.length > 0 ? `Seasonings: ${condimentLabels.join(', ')}` : '',
    });
    onOpenChange(false);
    reset();
  }

  function reset() {
    setStep(0); setDir(1); setGoal(null); setDetails({ ...INITIAL_DETAILS, supplementDosages: {} }); setResult(null); setMacroPayload(null);
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
              {step === 1 && <Step2Details details={details} setDetails={setDetails} goal={goal} />}
              {step === 2 && <Step3Generating onDone={handleGeneratingDone} macroPayload={macroPayload} />}
              {step === 3 && result && <Step4Result result={result} onApply={handleApply} onRegenerate={() => go(2)} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {step < 2 && (
          <div className="flex items-center justify-between px-8 py-4 border-t border-border bg-secondary/30">
            <Button variant="ghost" size="sm" onClick={step === 0 ? () => onOpenChange(false) : () => go(step - 1)} className="gap-1 text-muted-foreground">
              {step === 0 ? 'Cancel' : <><ChevronLeft className="w-4 h-4" /> Back</>}
            </Button>
            <Button size="sm" disabled={!canNext()} onClick={step === 1 ? handleStartGenerating : () => go(step + 1)} className="gap-1">
              {step === 1 ? <><Sparkles className="w-3.5 h-3.5" /> Generate Plan</> : <>Next <ChevronRight className="w-4 h-4" /></>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}