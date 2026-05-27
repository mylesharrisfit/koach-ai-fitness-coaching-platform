import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

function getMealStatus(loggedCal, targetCal) {
  if (!loggedCal || loggedCal === 0) return { label: 'Not Started', color: '#94A3B8', bg: '#F8FAFC' };
  const pct = loggedCal / targetCal;
  if (pct >= 1.15) return { label: 'Over Target', color: '#EF4444', bg: '#FEF2F2' };
  if (pct >= 0.9) return { label: 'Complete', color: '#10B981', bg: '#F0FDF4' };
  return { label: 'In Progress', color: '#F59E0B', bg: '#FFFBEB' };
}

function MacroBar({ logged, target, color }) {
  const pct = target > 0 ? Math.min((logged / target) * 100, 100) : 0;
  return (
    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function MealCard({ meal, mealIndex, loggedFoods, onLogFood, onUseMealPlan }) {
  const [expanded, setExpanded] = useState(mealIndex === 0);

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
    <div className="mx-4 bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
      <button className="w-full flex items-center gap-3 px-5 py-4 text-left" onClick={() => setExpanded(v => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-slate-800 font-bold text-sm">{meal.meal_name}</p>
            {meal.time && <p className="text-slate-400 text-[10px]">{meal.time}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
              style={{ background: status.bg, color: status.color, borderColor: status.bg }}>
              {status.label}
            </span>
            {mealMacros.calories > 0 && (
              <p className="text-slate-400 text-[10px]">{Math.round(mealMacros.calories)} kcal</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {logged.calories > 0 && (
            <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}>
            <div className="px-5 pb-5 space-y-3 border-t border-slate-50">
              {mealMacros.calories > 0 && (
                <div className="pt-3 space-y-1.5">
                  <div className="flex gap-3 text-[10px] font-semibold">
                    <span className="text-blue-500">{Math.round(logged.protein)}/{Math.round(mealMacros.protein)}g P</span>
                    <span className="text-orange-500">{Math.round(logged.carbs)}/{Math.round(mealMacros.carbs)}g C</span>
                    <span className="text-yellow-600">{Math.round(logged.fats)}/{Math.round(mealMacros.fats)}g F</span>
                  </div>
                  <MacroBar logged={logged.calories} target={mealMacros.calories} color="linear-gradient(90deg, #2563EB, #7C3AED)" />
                </div>
              )}

              {(meal.foods || []).map((food, fi) => {
                const isLogged = loggedFoods.some(lf => lf.food_name === food.food_name && lf.meal_name === meal.meal_name);
                return (
                  <div key={fi} className={cn('flex items-center gap-3 py-2.5 px-3 rounded-2xl border',
                    isLogged ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100')}>
                    {isLogged
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      : <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold truncate', isLogged ? 'text-slate-400 line-through' : 'text-slate-700')}>{food.food_name}</p>
                      <p className="text-slate-400 text-[10px]">{food.portion}{food.calories ? ` · ${food.calories} kcal` : ''}</p>
                    </div>
                    {food.protein && <p className="text-blue-500 text-[10px] flex-shrink-0 font-semibold">{food.protein}g P</p>}
                  </div>
                );
              })}

              {loggedFoods.filter(lf => lf.meal_name === meal.meal_name && !(meal.foods || []).some(f => f.food_name === lf.food_name)).map((lf, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-2xl bg-blue-50 border border-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-sm font-semibold truncate">{lf.food_name}</p>
                    <p className="text-slate-400 text-[10px]">{lf.serving_quantity}{lf.serving_unit ? ` ${lf.serving_unit}` : ''}{lf.calories ? ` · ${lf.calories} kcal` : ''}</p>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-1">
                <button onClick={() => onLogFood(meal.meal_name)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                  <Plus className="w-3.5 h-3.5" /> Log Food
                </button>
                {(meal.foods || []).length > 0 && (
                  <button onClick={() => onUseMealPlan(meal)}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200">
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