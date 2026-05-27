import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Plus, Check, Zap } from 'lucide-react';

function getMealStatus(logged, target) {
  const pct = (logged / target) * 100;
  if (pct >= 100) return { dot: '#10B981', label: 'Complete' };
  if (pct >= 75) return { dot: '#F59E0B', label: 'Partial' };
  if (pct > 0) return { dot: '#3B82F6', label: 'Started' };
  return { dot: '#E5E7EB', label: 'Pending' };
}

function MealMacroBar({ logged, target }) {
  const pct = Math.min(100, (logged / target) * 100);
  const color = pct >= 100 ? '#EF4444' : pct >= 95 ? '#F59E0B' : '#10B981';
  return (
    <div className="h-1 rounded-full" style={{ background: '#F1F5F9' }}>
      <motion.div
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5 }}
        className="h-full rounded-full"
        style={{ background: color }} />
    </div>
  );
}

export default function MealCard({ meal, foods = [], loggedFoods = [], mealTarget = 500, onAddFood, onUsePlan, onSwapFood }) {
  const [expanded, setExpanded] = useState(false);

  const mealTotal = loggedFoods.reduce((sum, f) => sum + f.calories, 0);
  const status = getMealStatus(mealTotal, mealTarget);

  const assignedFoods = (meal?.foods || []).slice(0, 3);
  const loggedCount = loggedFoods.length;
  const allLogged = assignedFoods.length > 0 && assignedFoods.every(af =>
    loggedFoods.some(lf => lf.name === af.name)
  );

  return (
    <motion.div
      layout
      className="mx-4 mb-3 bg-white rounded-[18px] overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>

      {/* Header */}
      <button onClick={() => setExpanded(v => !v)}
        className="w-full px-4 py-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
        {/* Status dot */}
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: status.dot }} />

        {/* Meal name & time */}
        <div className="flex-1 text-left">
          <p className="text-slate-900 font-bold text-sm">{meal.name}</p>
          <p className="text-slate-400 text-xs mt-0.5">{meal.time}</p>
        </div>

        {/* Macros summary */}
        <p className="text-slate-600 font-semibold text-sm whitespace-nowrap">
          {mealTotal}cal · {Math.round(loggedFoods.reduce((s, f) => s + (f.protein || 0), 0))}g
        </p>

        {/* Toggle */}
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-slate-300" />
        </motion.div>
      </button>

      {/* Macro bar */}
      <div className="px-4 pb-3">
        <MealMacroBar logged={mealTotal} target={mealTarget} />
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-100 px-4 py-3 space-y-2">

            {/* Assigned foods */}
            {assignedFoods.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meal Plan</p>
                {assignedFoods.map((food, i) => {
                  const logged = loggedFoods.find(lf => lf.name === food.name);
                  return (
                    <div key={i} className="flex items-center gap-2 py-2 px-2 rounded-xl"
                      style={{ background: logged ? '#F0FDF4' : '#F8FAFC' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 text-sm font-semibold truncate">{food.name}</p>
                        <p className="text-slate-400 text-xs">{food.portion}</p>
                      </div>
                      <p className="text-slate-600 text-xs font-semibold whitespace-nowrap">{food.calories}cal</p>
                      {logged ? (
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={3} />
                      ) : (
                        <button onClick={() => onSwapFood(food)}
                          className="text-blue-600 text-xs font-bold flex-shrink-0">↔</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Logged foods */}
            {loggedCount > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logged</p>
                {loggedFoods.map((food, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 px-2 rounded-xl bg-blue-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 text-sm font-semibold truncate">{food.name}</p>
                      <p className="text-slate-400 text-xs">{food.portion}</p>
                    </div>
                    <p className="text-slate-600 text-xs font-semibold whitespace-nowrap">{food.calories}cal</p>
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" strokeWidth={3} />
                  </div>
                ))}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              {meal.hasAssignedFoods && !allLogged && (
                <button onClick={onUsePlan}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: '0 2px 8px rgba(37,99,235,0.2)' }}>
                  Use Meal Plan
                </button>
              )}
              <button onClick={onAddFood}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-blue-600 border border-blue-200 bg-blue-50">
                + Log Food
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}