import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

function getMealStatus(loggedCal, targetCal) {
  if (!loggedCal || loggedCal === 0) return { label: 'Not Started', color: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.05)' };
  const pct = loggedCal / targetCal;
  if (pct >= 1.15) return { label: 'Over Target', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' };
  if (pct >= 0.9) return { label: 'Complete', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' };
  return { label: 'In Progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
}

function MacroBar({ logged, target, color }) {
  const pct = target > 0 ? Math.min((logged / target) * 100, 100) : 0;
  return (
    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function MealCard({ meal, mealIndex, loggedFoods, onLogFood, onUseMealPlan }) {
  const [expanded, setExpanded] = useState(mealIndex === 0);

  // Calculate logged macros for this meal
  const logged = loggedFoods.reduce((acc, f) => ({
    calories: acc.calories + (f.calories || 0),
    protein: acc.protein + (f.protein || 0),
    carbs: acc.carbs + (f.carbs || 0),
    fats: acc.fats + (f.fats || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const mealCalTarget = (meal.foods || []).reduce((s, f) => s + (f.calories || 0), 0);
  const status = getMealStatus(logged.calories, mealCalTarget || 400);

  const mealMacros = (meal.foods || []).reduce((acc, f) => ({
    protein: acc.protein + (f.protein || 0),
    carbs: acc.carbs + (f.carbs || 0),
    fats: acc.fats + (f.fats || 0),
    calories: acc.calories + (f.calories || 0),
  }), { protein: 0, carbs: 0, fats: 0, calories: 0 });

  return (
    <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <button className="w-full flex items-center gap-3 px-4 py-4 text-left" onClick={() => setExpanded(v => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white font-bold text-sm">{meal.meal_name}</p>
            {meal.time && <p className="text-white/30 text-[10px]">{meal.time}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>
              {status.label}
            </span>
            {mealMacros.calories > 0 && (
              <p className="text-white/30 text-[10px]">{Math.round(mealMacros.calories)} kcal target</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {logged.calories > 0 && (
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-white/25" /> : <ChevronDown className="w-4 h-4 text-white/25" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}>
            <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Macro bar row */}
              {mealMacros.calories > 0 && (
                <div className="pt-3 space-y-1.5">
                  <div className="flex gap-3 text-[10px]">
                    <span className="text-blue-400">{Math.round(logged.protein)}/{Math.round(mealMacros.protein)}g P</span>
                    <span className="text-orange-400">{Math.round(logged.carbs)}/{Math.round(mealMacros.carbs)}g C</span>
                    <span className="text-yellow-400">{Math.round(logged.fats)}/{Math.round(mealMacros.fats)}g F</span>
                  </div>
                  <MacroBar logged={logged.calories} target={mealMacros.calories} color="linear-gradient(90deg, #3B82F6, #F97316)" />
                </div>
              )}

              {/* Assigned foods */}
              {(meal.foods || []).map((food, fi) => {
                const isLogged = loggedFoods.some(lf => lf.food_name === food.food_name && lf.meal_name === meal.meal_name);
                return (
                  <div key={fi} className={cn('flex items-center gap-3 py-2.5 px-3 rounded-xl', isLogged ? 'bg-emerald-500/10' : 'bg-white/5')}>
                    {isLogged
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      : <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold truncate', isLogged ? 'text-white/50 line-through' : 'text-white/80')}>{food.food_name}</p>
                      <p className="text-white/30 text-[10px]">{food.portion}{food.calories ? ` · ${food.calories} kcal` : ''}</p>
                    </div>
                    {food.protein && (
                      <p className="text-blue-400/60 text-[10px] flex-shrink-0">{food.protein}g P</p>
                    )}
                  </div>
                );
              })}

              {/* Logged extra foods */}
              {loggedFoods.filter(lf => lf.meal_name === meal.meal_name && !(meal.foods || []).some(f => f.food_name === lf.food_name)).map((lf, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-sm font-semibold truncate">{lf.food_name}</p>
                    <p className="text-white/30 text-[10px]">{lf.serving_quantity}{lf.serving_unit ? ` ${lf.serving_unit}` : ''}{lf.calories ? ` · ${lf.calories} kcal` : ''}</p>
                  </div>
                </div>
              ))}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button onClick={() => onLogFood(meal.meal_name)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white"
                  style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <Plus className="w-3.5 h-3.5" /> Log Food
                </button>
                {(meal.foods || []).length > 0 && (
                  <button onClick={() => onUseMealPlan(meal)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white/60"
                    style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <Zap className="w-3.5 h-3.5" /> Use Plan
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}