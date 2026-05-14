import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sparkles, Loader2, RefreshCw, Trash2, ChevronDown, ChevronUp,
  Send, ShoppingCart, Pill, Droplets, Utensils, MapPin, Zap,
  Clock, Star, BookOpen, Copy, Check
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ─── Food image map — Unsplash keyword-based ─── */
const FOOD_IMAGE_MAP = {
  chicken: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80',
  'chicken breast': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80',
  'chicken bowl': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80',
  steak: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=400&q=80',
  'ground beef': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  salmon: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80',
  tuna: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&q=80',
  shrimp: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80',
  eggs: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80',
  'egg whites': 'https://images.unsplash.com/photo-1612203985729-70726954388c?w=400&q=80',
  oats: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&q=80',
  oatmeal: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&q=80',
  rice: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80',
  'rice bowl': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80',
  potatoes: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
  'sweet potato': 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=400&q=80',
  pasta: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  'greek yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  yogurt: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  smoothie: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&q=80',
  'protein shake': 'https://images.unsplash.com/photo-1622484211396-99d7f7b4fc19?w=400&q=80',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80',
  wrap: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80',
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80',
  pancakes: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
  turkey: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400&q=80',
  stir: 'https://images.unsplash.com/photo-1512058556646-c4da40fba323?w=400&q=80',
  burrito: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80',
  sushi: 'https://images.unsplash.com/photo-1617196034183-421b4040d770?w=400&q=80',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&q=80',
};

function getMealImage(mealName = '', foods = []) {
  const query = (mealName + ' ' + foods.map(f => f.food_name || '').join(' ')).toLowerCase();
  for (const [key, url] of Object.entries(FOOD_IMAGE_MAP)) {
    if (query.includes(key)) return url;
  }
  return FOOD_IMAGE_MAP.default;
}

/* ─── Tag config ─── */
const TAG_STYLES = {
  'High Protein': 'bg-red-50 text-red-600 border-red-100',
  'Fat Loss': 'bg-orange-50 text-orange-600 border-orange-100',
  'High Carb': 'bg-amber-50 text-amber-600 border-amber-100',
  'Low Carb': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Pre Workout': 'bg-blue-50 text-blue-600 border-blue-100',
  'Post Workout': 'bg-purple-50 text-purple-600 border-purple-100',
  'Meal Prep': 'bg-slate-50 text-slate-600 border-slate-200',
  'Restaurant Swap': 'bg-pink-50 text-pink-600 border-pink-100',
  'Fast Food': 'bg-yellow-50 text-yellow-600 border-yellow-100',
};

/* ─── Schemas ─── */
const FOOD_SCHEMA = {
  type: 'object',
  properties: {
    food_name: { type: 'string' },
    portion: { type: 'string' },
    weight_g: { type: 'number' },
    calories: { type: 'number' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fats: { type: 'number' },
  },
};

const MEAL_SCHEMA = {
  type: 'object',
  properties: {
    meal_name: { type: 'string' },
    time: { type: 'string' },
    prep_time: { type: 'string' },
    instructions: { type: 'string' },
    sauces: { type: 'array', items: { type: 'string' } },
    seasonings: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
    foods: { type: 'array', items: FOOD_SCHEMA },
    swap_options: { type: 'array', items: { type: 'string' } },
    restaurant_swap: { type: 'string' },
    fast_food_swap: { type: 'string' },
  },
};

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    overview: { type: 'string' },
    training_day_calories: { type: 'number' },
    rest_day_calories: { type: 'number' },
    training_day_carbs: { type: 'number' },
    rest_day_carbs: { type: 'number' },
    meals: { type: 'array', items: MEAL_SCHEMA },
    grocery_list: {
      type: 'object',
      properties: {
        proteins: { type: 'array', items: { type: 'string' } },
        carbs: { type: 'array', items: { type: 'string' } },
        vegetables: { type: 'array', items: { type: 'string' } },
        fats: { type: 'array', items: { type: 'string' } },
        sauces: { type: 'array', items: { type: 'string' } },
        extras: { type: 'array', items: { type: 'string' } },
      },
    },
    hydration: {
      type: 'object',
      properties: {
        daily_target: { type: 'string' },
        protocol: { type: 'string' },
        electrolytes: { type: 'string' },
      },
    },
    supplements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          dosage: { type: 'string' },
          timing: { type: 'string' },
          purpose: { type: 'string' },
        },
      },
    },
    sleep_stack: { type: 'array', items: { type: 'string' } },
    eating_out_strategy: { type: 'string' },
    travel_strategy: { type: 'string' },
    meal_prep_guide: { type: 'string' },
    coach_notes: { type: 'string' },
  },
};

/* ─── Example prompts ─── */
const EXAMPLE_PROMPTS = [
  '2200 cal, 180g protein, 4 meals, high carb training days, low carb rest days, chicken/rice/eggs/steak only, add grocery list and supplements',
  '2500 cal, 200g protein, 3 meals + pre-workout snack, Chipotle and Chick-fil-A restaurant options, meal prep Sunday',
  'Fat loss plan: 1800 cal, 160g protein, low carb, no dairy, add fast food swaps and hydration guide',
  'Muscle building: 3000 cal, 220g protein, high carb training days, add sleep stack and supplement guide',
];

/* ─── Section components ─── */
function SectionHeader({ icon: Icon, title, color = 'text-primary', bg = 'bg-primary/10' }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <h3 className="font-heading font-bold text-sm text-foreground">{title}</h3>
    </div>
  );
}

function MacroBadge({ label, value, unit = 'g', colorClass }) {
  return (
    <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl ${colorClass}`}>
      <span className="text-sm font-bold">{value}{unit}</span>
      <span className="text-[10px] font-medium opacity-70">{label}</span>
    </div>
  );
}

function MealCard({ meal, onRegen, onRemove, regenning }) {
  const [expanded, setExpanded] = useState(true);
  const imgSrc = getMealImage(meal.meal_name, meal.foods || []);
  const totalCals = (meal.foods || []).reduce((s, f) => s + (f.calories || 0), 0);
  const totalP = (meal.foods || []).reduce((s, f) => s + (f.protein || 0), 0);
  const totalC = (meal.foods || []).reduce((s, f) => s + (f.carbs || 0), 0);
  const totalF = (meal.foods || []).reduce((s, f) => s + (f.fats || 0), 0);

  return (
    <div className="bg-white border border-[#E7EAF3] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image + header */}
      <div className="relative">
        <img src={imgSrc} alt={meal.meal_name} className="w-full h-36 object-cover" onError={e => { e.target.src = FOOD_IMAGE_MAP.default; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {/* Tags */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {(meal.tags || []).slice(0, 3).map(tag => (
            <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TAG_STYLES[tag] || 'bg-white/20 text-white border-white/30'}`}>
              {tag}
            </span>
          ))}
        </div>
        {/* Controls */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={onRegen} disabled={regenning}
            className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white flex items-center justify-center transition-all">
            {regenning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onRemove}
            className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-red-500/80 text-white flex items-center justify-center transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Meal name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-bold text-white text-base leading-tight">{meal.meal_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {meal.time && <span className="text-white/70 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{meal.time}</span>}
                {meal.prep_time && <span className="text-white/70 text-xs">· {meal.prep_time} prep</span>}
              </div>
            </div>
            <button onClick={() => setExpanded(e => !e)} className="text-white/80 hover:text-white">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Macros bar */}
      <div className="flex gap-2 px-4 py-3 border-b border-[#F1F4FA]">
        <MacroBadge label="kcal" value={totalCals} unit="" colorClass="bg-orange-50 text-orange-600" />
        <MacroBadge label="protein" value={totalP} colorClass="bg-red-50 text-red-600" />
        <MacroBadge label="carbs" value={totalC} colorClass="bg-amber-50 text-amber-600" />
        <MacroBadge label="fats" value={totalF} colorClass="bg-blue-50 text-blue-600" />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="divide-y divide-[#F5F7FB]">
          {/* Foods */}
          {(meal.foods || []).length > 0 && (
            <div className="px-4 py-3 space-y-2">
              {meal.foods.map((food, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{food.food_name}</p>
                    <p className="text-[11px] text-muted-foreground">{food.portion}{food.weight_g ? ` · ${food.weight_g}g` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] flex-shrink-0">
                    <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-bold">{food.calories}</span>
                    <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded">{food.protein}P</span>
                    <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">{food.carbs}C</span>
                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{food.fats}F</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          {meal.instructions && (
            <div className="px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Instructions</p>
              <p className="text-xs text-foreground leading-relaxed">{meal.instructions}</p>
            </div>
          )}

          {/* Sauces + seasonings */}
          {((meal.sauces || []).length > 0 || (meal.seasonings || []).length > 0) && (
            <div className="px-4 py-3 flex flex-wrap gap-3">
              {(meal.sauces || []).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Sauces</p>
                  <div className="flex flex-wrap gap-1">
                    {meal.sauces.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {(meal.seasonings || []).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Seasonings</p>
                  <div className="flex flex-wrap gap-1">
                    {meal.seasonings.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Swaps */}
          {(meal.restaurant_swap || meal.fast_food_swap || (meal.swap_options || []).length > 0) && (
            <div className="px-4 py-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Swaps</p>
              {meal.restaurant_swap && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-pink-50 text-pink-600 font-semibold text-[10px] flex-shrink-0">Restaurant</span>
                  <span className="text-muted-foreground">{meal.restaurant_swap}</span>
                </div>
              )}
              {meal.fast_food_swap && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-600 font-semibold text-[10px] flex-shrink-0">Fast Food</span>
                  <span className="text-muted-foreground">{meal.fast_food_swap}</span>
                </div>
              )}
              {(meal.swap_options || []).map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 font-semibold text-[10px] flex-shrink-0">Swap</span>
                  <span className="text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GroceryList({ list }) {
  if (!list) return null;
  const categories = [
    { key: 'proteins', label: 'Proteins', color: 'text-red-600 bg-red-50 border-red-100' },
    { key: 'carbs', label: 'Carbs', color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { key: 'vegetables', label: 'Vegetables', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { key: 'fats', label: 'Fats', color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { key: 'sauces', label: 'Sauces & Condiments', color: 'text-purple-600 bg-purple-50 border-purple-100' },
    { key: 'extras', label: 'Extras', color: 'text-slate-600 bg-slate-50 border-slate-200' },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {categories.map(cat => {
        const items = list[cat.key] || [];
        if (!items.length) return null;
        return (
          <div key={cat.key} className={`p-4 rounded-2xl border ${cat.color.split(' ').slice(1).join(' ')}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${cat.color.split(' ')[0]}`}>{cat.label}</p>
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-foreground">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cat.color.split(' ')[0].replace('text-', 'bg-')}`} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function SupplementList({ supplements, sleepStack }) {
  return (
    <div className="space-y-3">
      {(supplements || []).map((s, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 border border-[#E7EAF3]">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Pill className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-foreground">{s.name}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{s.dosage}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{s.timing}</span>
            </div>
            {s.purpose && <p className="text-xs text-muted-foreground mt-0.5">{s.purpose}</p>}
          </div>
        </div>
      ))}
      {(sleepStack || []).length > 0 && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Sleep Stack</p>
          <ul className="space-y-1">
            {sleepStack.map((s, i) => (
              <li key={i} className="text-xs text-foreground flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ text, color = 'bg-secondary/50 border-[#E7EAF3]' }) {
  if (!text) return null;
  return (
    <div className={`p-4 rounded-2xl border ${color}`}>
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  );
}

/* ─── Main component ─── */
export default function AIGeneratorModal({ open, onOpenChange, onApply }) {
  const [mode, setMode] = useState('prompt'); // 'prompt' | 'form'
  const [step, setStep] = useState('config'); // 'config' | 'results'
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [regenIdx, setRegenIdx] = useState(null);
  const [activeSection, setActiveSection] = useState('meals');
  const [prompt, setPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  // Form params
  const [params, setParams] = useState({
    client_name: '',
    calories: '', protein_g: '', carbs_g: '', fats_g: '',
    training_calories: '', rest_calories: '',
    meal_count: 4,
    goal: 'Fat Loss',
    style: 'Balanced',
    cuisine: 'Any',
    difficulty: 'Easy',
    high_low_carb: false,
    pre_workout_snack: false,
    foods_include: '',
    foods_avoid: '',
    allergies: '',
    restaurant_swaps: true,
    meal_prep: true,
    supplements: true,
    notes: '',
  });
  const p = (k, v) => setParams(prev => ({ ...prev, [k]: v }));

  const GOALS = ['Fat Loss', 'Muscle Building', 'Performance', 'Maintenance', 'Lean Bulk', 'Recomp'];
  const STYLES = ['Balanced', 'High Protein', 'Low Carb', 'Keto', 'Mediterranean', 'Plant-Based'];

  const buildPrompt = () => {
    if (mode === 'prompt') return prompt;
    const lines = [
      `You are an elite online fitness coach and sports dietitian.`,
      `Build a complete, detailed, client-ready meal plan for ${params.client_name || 'this client'}.`,
      ``,
      `TARGETS: ${params.calories} kcal | ${params.protein_g}g protein${params.carbs_g ? ` | ${params.carbs_g}g carbs` : ''}${params.fats_g ? ` | ${params.fats_g}g fats` : ''}`,
      `GOAL: ${params.goal} | STYLE: ${params.style} | CUISINE: ${params.cuisine} | DIFFICULTY: ${params.difficulty}`,
      params.meal_count ? `MEALS PER DAY: ${params.meal_count}${params.pre_workout_snack ? ' + 1 pre-workout snack' : ''}` : '',
      params.high_low_carb ? `HIGH/LOW CARB SPLIT: Training day = ${params.training_calories || 'higher'} cal with more carbs. Rest day = ${params.rest_calories || 'lower'} cal with lower carbs.` : '',
      params.foods_include ? `MUST INCLUDE THESE FOODS: ${params.foods_include}` : '',
      params.foods_avoid ? `AVOID THESE FOODS: ${params.foods_avoid}` : '',
      params.allergies ? `ALLERGIES/RESTRICTIONS: ${params.allergies}` : '',
      params.restaurant_swaps ? 'Include restaurant and fast food swap options for every meal (Chipotle, Chick-fil-A, Subway, etc.)' : '',
      params.meal_prep ? 'Include a full weekly meal prep guide.' : '',
      params.supplements ? 'Include a full supplement and vitamin stack with dosages and timing.' : '',
      params.notes ? `COACH NOTES: ${params.notes}` : '',
    ].filter(Boolean).join('\n');
    return lines;
  };

  const generate = async () => {
    const finalPrompt = buildPrompt();
    if (!finalPrompt.trim()) { toast.error('Add a prompt or fill in the form first'); return; }

    setGenerating(true);
    const systemPrompt = `${finalPrompt}

Generate a COMPLETE, professional coaching meal plan. Be highly specific with:
- Exact food weights in grams AND common measures (e.g. "200g / 7oz chicken breast")
- Step-by-step cooking instructions for each meal
- Low-calorie sauces and seasoning pairings
- Restaurant and fast food swaps with exact orders and estimated macros
- Complete grocery list organized by category
- Hydration protocol with daily water targets and electrolyte info
- Supplement stack with dosages and timing
- Sleep stack recommendations
- Eating out strategy and alcohol gameplan
- Travel strategy
- Weekly meal prep system
- Tags for each meal (High Protein, Pre Workout, High Carb, Low Carb, etc.)

Make every meal feel real, appealing, and something a client would actually eat.
Return as a single JSON plan object.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt,
      response_json_schema: PLAN_SCHEMA,
      model: 'claude_sonnet_4_6',
    });

    setPlan(result);
    setGenerating(false);
    setStep('results');
    setActiveSection('meals');
    toast.success('Meal plan generated!');
  };

  const regenMeal = async (idx) => {
    if (!plan) return;
    setRegenIdx(idx);
    const meal = plan.meals[idx];
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Regenerate this meal: "${meal.meal_name}". Keep similar calories and macros. Include instructions, sauces, seasonings, restaurant swap, fast food swap, and tags. Return a single meal JSON object.`,
      response_json_schema: MEAL_SCHEMA,
    });
    if (result?.meal_name) {
      setPlan(prev => ({ ...prev, meals: prev.meals.map((m, i) => i === idx ? result : m) }));
    }
    setRegenIdx(null);
  };

  const removeMeal = (idx) => {
    setPlan(prev => ({ ...prev, meals: prev.meals.filter((_, i) => i !== idx) }));
  };

  const handleApply = () => {
    if (!plan) return;
    onApply({
      meals: (plan.meals || []).map(m => ({
        meal_name: m.meal_name,
        time: m.time,
        tags: m.tags || [],
        foods: m.foods || [],
        instructions: m.instructions,
        options: [{ label: 'Main', foods: m.foods || [] }],
      })),
    });
    onOpenChange(false);
    setStep('config');
    setPlan(null);
  };

  const totalCals = (plan?.meals || []).reduce((s, m) => s + (m.foods || []).reduce((fs, f) => fs + (f.calories || 0), 0), 0);
  const totalP = (plan?.meals || []).reduce((s, m) => s + (m.foods || []).reduce((fs, f) => fs + (f.protein || 0), 0), 0);

  const RESULT_SECTIONS = [
    { key: 'meals', label: 'Meals', icon: Utensils },
    { key: 'grocery', label: 'Grocery', icon: ShoppingCart },
    { key: 'supplements', label: 'Supplements', icon: Pill },
    { key: 'hydration', label: 'Hydration', icon: Droplets },
    { key: 'eating_out', label: 'Eating Out', icon: MapPin },
    { key: 'notes', label: 'Coach Notes', icon: BookOpen },
  ];

  const handleClose = () => {
    onOpenChange(false);
    setStep('config');
    setPlan(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#E7EAF3] flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="font-heading font-bold text-base text-foreground">Coach-Style Meal Plan Builder</DialogTitle>
              <p className="text-xs text-muted-foreground">AI-powered · Client-ready plans in seconds</p>
            </div>
          </div>

          {/* Step tabs */}
          {step === 'config' && (
            <div className="flex gap-1 mt-4 bg-secondary/50 rounded-xl p-1 w-fit">
              {[
                { id: 'prompt', label: '✦ Prompt Mode' },
                { id: 'form', label: '⚙ Form Mode' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn('px-4 py-1.5 rounded-lg text-xs font-semibold transition-all', mode === m.id ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {step === 'results' && plan && (
            <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
              {RESULT_SECTIONS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex-shrink-0',
                    activeSection === key ? 'bg-primary text-white border-primary' : 'border-[#E7EAF3] text-muted-foreground hover:border-primary/30'
                  )}
                >
                  <Icon className="w-3 h-3" /> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">

          {/* ── CONFIG ── */}
          {step === 'config' && mode === 'prompt' && (
            <div className="p-6 space-y-5">
              {/* Prompt box */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Tell KOACH AI what to build</Label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="e.g. Create a 2200 calorie meal plan with 180g protein, 4 meals, high carb training days, low carb rest days, chicken/rice/eggs/steak only, grocery list, supplements, Chipotle and Chick-fil-A options, and meal prep guide..."
                    rows={5}
                    className="w-full px-4 py-4 rounded-2xl border border-[#E7EAF3] bg-white text-sm text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:border-primary/40 transition-colors leading-relaxed shadow-sm"
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground">{prompt.length} chars</div>
                </div>
              </div>

              {/* Example prompts */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Quick examples — click to use:</p>
                <div className="space-y-2">
                  {EXAMPLE_PROMPTS.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(ex)}
                      className="w-full text-left text-xs px-4 py-3 rounded-xl border border-[#E7EAF3] bg-white hover:border-primary/40 hover:bg-primary/[0.02] transition-all text-muted-foreground hover:text-foreground"
                    >
                      <span className="text-primary font-bold mr-2">→</span>{ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note about model */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Premium AI Model.</strong> Coach-Style generation uses Claude Sonnet for higher quality, detailed output. This uses more AI credits per generation.
                </p>
              </div>
            </div>
          )}

          {step === 'config' && mode === 'form' && (
            <div className="p-6 space-y-6">
              {/* Client + targets */}
              <div className="space-y-4">
                <p className="text-sm font-bold text-foreground">Client Details</p>
                <Input placeholder="Client name (optional)" value={params.client_name} onChange={e => p('client_name', e.target.value)} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Calories', key: 'calories', ph: '2200' },
                    { label: 'Protein (g)', key: 'protein_g', ph: '180' },
                    { label: 'Carbs (g)', key: 'carbs_g', ph: '220' },
                    { label: 'Fats (g)', key: 'fats_g', ph: '60' },
                  ].map(({ label, key, ph }) => (
                    <div key={key}>
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                      <Input type="number" placeholder={ph} value={params[key]} onChange={e => p(key, e.target.value)} className="mt-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Goal + Style */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Goal</Label>
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map(g => (
                      <button key={g} onClick={() => p('goal', g)}
                        className={cn('px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all', params.goal === g ? 'bg-primary text-white border-primary' : 'border-[#E7EAF3] bg-white text-muted-foreground hover:border-primary/30')}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Style</Label>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map(s => (
                      <button key={s} onClick={() => p('style', s)}
                        className={cn('px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all', params.style === s ? 'bg-primary text-white border-primary' : 'border-[#E7EAF3] bg-white text-muted-foreground hover:border-primary/30')}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Meals per day */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Meals per Day</Label>
                <div className="flex gap-2">
                  {[3, 4, 5, 6].map(n => (
                    <button key={n} onClick={() => p('meal_count', n)}
                      className={cn('flex-1 py-2 rounded-xl text-sm font-bold border transition-all', params.meal_count === n ? 'bg-primary text-white border-primary' : 'border-[#E7EAF3] bg-white text-muted-foreground')}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                {[
                  { key: 'high_low_carb', label: 'High/Low Carb Day Split', sub: 'Different cal/macro targets for training vs rest days', color: 'amber' },
                  { key: 'pre_workout_snack', label: 'Pre-Workout Snack', sub: 'Add a dedicated pre-workout carb snack', color: 'blue' },
                  { key: 'restaurant_swaps', label: 'Restaurant & Fast Food Swaps', sub: 'Chipotle, Chick-fil-A, Subway options per meal', color: 'pink' },
                  { key: 'meal_prep', label: 'Weekly Meal Prep Guide', sub: 'Sunday prep system and batch cooking instructions', color: 'emerald' },
                  { key: 'supplements', label: 'Supplement & Vitamin Stack', sub: 'Full stack with dosages, timing, and sleep protocol', color: 'purple' },
                ].map(({ key, label, sub, color }) => (
                  <div key={key} className={`flex items-center gap-4 p-3.5 bg-${color}-50 border border-${color}-100 rounded-2xl`}>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                    </div>
                    <button onClick={() => p(key, !params[key])}
                      className={cn('w-11 h-6 rounded-full transition-all relative flex-shrink-0', params[key] ? 'bg-primary' : 'bg-gray-200')}>
                      <div className={cn('w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all', params[key] ? 'left-5' : 'left-0.5')} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Foods to include/avoid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Foods to Include</Label>
                  <textarea value={params.foods_include} onChange={e => p('foods_include', e.target.value)}
                    placeholder="e.g. chicken, rice, eggs, steak, potatoes..." rows={2}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E7EAF3] bg-white text-sm resize-none focus:outline-none focus:border-primary/40" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Foods to Avoid / Allergies</Label>
                  <textarea value={params.foods_avoid} onChange={e => p('foods_avoid', e.target.value)}
                    placeholder="e.g. no dairy, no nuts, avoid fish..." rows={2}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E7EAF3] bg-white text-sm resize-none focus:outline-none focus:border-primary/40" />
                </div>
              </div>

              {/* Additional notes */}
              <div>
                <Label className="text-xs text-muted-foreground">Additional Notes</Label>
                <textarea value={params.notes} onChange={e => p('notes', e.target.value)}
                  placeholder="Any other coach instructions..." rows={2}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E7EAF3] bg-white text-sm resize-none focus:outline-none focus:border-primary/40" />
              </div>
            </div>
          )}

          {/* ── RESULTS ── */}
          {step === 'results' && plan && (
            <div className="p-6 space-y-5">
              {/* Overview banner */}
              <div className="p-4 bg-white rounded-2xl border border-[#E7EAF3] shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Calories</p>
                    <p className="text-xl font-bold text-foreground">{totalCals} kcal</p>
                  </div>
                  <div className="h-8 w-px bg-border hidden sm:block" />
                  <div>
                    <p className="text-xs text-muted-foreground">Protein</p>
                    <p className="text-lg font-bold text-red-500">{totalP}g</p>
                  </div>
                  {plan.training_day_calories && (
                    <>
                      <div className="h-8 w-px bg-border hidden sm:block" />
                      <div>
                        <p className="text-xs text-muted-foreground">Training Day</p>
                        <p className="text-base font-bold text-amber-500">{plan.training_day_calories} kcal</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rest Day</p>
                        <p className="text-base font-bold text-emerald-600">{plan.rest_day_calories} kcal</p>
                      </div>
                    </>
                  )}
                  <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={generate} disabled={generating} className="gap-1.5 text-xs">
                      <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                    </Button>
                  </div>
                </div>
                {plan.overview && (
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed border-t border-[#F1F4FA] pt-3">{plan.overview}</p>
                )}
              </div>

              {/* Meals section */}
              {activeSection === 'meals' && (
                <div className="space-y-4">
                  <SectionHeader icon={Utensils} title={`Meal Plan · ${(plan.meals || []).length} meals`} />
                  {(plan.meals || []).map((meal, i) => (
                    <MealCard
                      key={i}
                      meal={meal}
                      onRegen={() => regenMeal(i)}
                      onRemove={() => removeMeal(i)}
                      regenning={regenIdx === i}
                    />
                  ))}
                </div>
              )}

              {activeSection === 'grocery' && (
                <div className="space-y-4">
                  <SectionHeader icon={ShoppingCart} title="Grocery List" color="text-emerald-600" bg="bg-emerald-50" />
                  <GroceryList list={plan.grocery_list} />
                  {plan.meal_prep_guide && (
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Weekly Meal Prep Guide</p>
                      <InfoBlock text={plan.meal_prep_guide} />
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'supplements' && (
                <div className="space-y-4">
                  <SectionHeader icon={Pill} title="Supplement & Vitamin Stack" color="text-purple-600" bg="bg-purple-50" />
                  <SupplementList supplements={plan.supplements} sleepStack={plan.sleep_stack} />
                </div>
              )}

              {activeSection === 'hydration' && (
                <div className="space-y-4">
                  <SectionHeader icon={Droplets} title="Hydration Protocol" color="text-blue-600" bg="bg-blue-50" />
                  {plan.hydration && (
                    <div className="space-y-3">
                      {plan.hydration.daily_target && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Daily Target</p>
                          <p className="text-2xl font-bold text-blue-700">{plan.hydration.daily_target}</p>
                        </div>
                      )}
                      {plan.hydration.protocol && <InfoBlock text={plan.hydration.protocol} />}
                      {plan.hydration.electrolytes && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Electrolytes</p>
                          <InfoBlock text={plan.hydration.electrolytes} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'eating_out' && (
                <div className="space-y-4">
                  <SectionHeader icon={MapPin} title="Eating Out & Travel Strategy" color="text-pink-600" bg="bg-pink-50" />
                  {plan.eating_out_strategy && (
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Restaurant & Going Out Gameplan</p>
                      <InfoBlock text={plan.eating_out_strategy} />
                    </div>
                  )}
                  {plan.travel_strategy && (
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Travel Strategy</p>
                      <InfoBlock text={plan.travel_strategy} />
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'notes' && (
                <div className="space-y-4">
                  <SectionHeader icon={BookOpen} title="Coach Notes" color="text-slate-600" bg="bg-slate-100" />
                  <InfoBlock text={plan.coach_notes} />
                </div>
              )}
            </div>
          )}

          {/* Generating state */}
          {generating && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div className="absolute -inset-1 rounded-2xl border-2 border-primary/20 animate-ping" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-bold text-foreground">Building your coaching plan…</p>
                <p className="text-sm text-muted-foreground">AI is writing meals, instructions, grocery lists, supplements & more</p>
              </div>
              <div className="flex gap-2">
                {['Meals', 'Grocery List', 'Supplements', 'Sauces', 'Swaps'].map((item, i) => (
                  <span key={item} className="text-xs px-3 py-1.5 rounded-full border border-[#E7EAF3] bg-white text-muted-foreground animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E7EAF3] flex-shrink-0 bg-white flex items-center justify-between gap-3">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <div className="flex gap-2">
            {step === 'results' && (
              <Button variant="outline" onClick={() => setStep('config')} className="gap-2 text-sm">
                ← Edit Prompt
              </Button>
            )}
            {step === 'config' ? (
              <Button onClick={generate} disabled={generating} className="gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? 'Generating…' : 'Generate Plan'}
              </Button>
            ) : (
              <Button onClick={handleApply} disabled={!plan || (plan.meals || []).length === 0} className="gap-2">
                <Check className="w-4 h-4" /> Apply to Plan
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}