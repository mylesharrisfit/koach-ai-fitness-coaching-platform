import React, { useState } from 'react';
import { X, Edit2, UserPlus, Leaf, Zap, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import OverviewTab from './detail/OverviewTab';
import MealPlanTab from './detail/MealPlanTab';
import AlternativesTab from './detail/AlternativesTab';
import ShoppingListTab from './detail/ShoppingListTab';
import PlanDetailSidebar from './detail/PlanDetailSidebar';

const TABS = [
  { key: 'overview',      label: 'Overview' },
  { key: 'meals',         label: 'Meal Plan' },
  { key: 'alternatives',  label: 'Alternatives' },
  { key: 'shopping',      label: 'Shopping List' },
];

// Reuse same goal theme logic
function getGoalTheme(plan) {
  const text = ((plan.title || '') + ' ' + (plan.description || '')).toLowerCase();
  if (text.includes('fat loss') || text.includes('cut') || text.includes('deficit'))
    return { from: '#F43F5E', to: '#FB923C', icon: '🔥', label: 'Fat Loss' };
  if (text.includes('bulk') || text.includes('muscle') || text.includes('gain') || text.includes('mass'))
    return { from: '#3B82F6', to: '#60A5FA', icon: '💪', label: 'Muscle Gain' };
  if (text.includes('maintain') || text.includes('maintenance'))
    return { from: '#22C55E', to: '#4ADE80', icon: '⚖️', label: 'Maintenance' };
  return { from: '#A855F7', to: '#C084FC', icon: '🥗', label: 'Custom' };
}

export default function NutritionPlanDetailModal({ open, onOpenChange, plan, onEdit, onAssign }) {
  const [tab, setTab] = useState('overview');

  if (!plan || !open) return null;

  const theme = getGoalTheme(plan);
  const isHabits = plan.tracking_mode === 'habits';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-[90vw] h-[90vh] bg-[#F5F7FA] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        style={{ maxWidth: 1100 }}
      >
        {/* ── Dark gradient header ─────────────────── */}
        <div
          className="flex-shrink-0 px-6 pt-5 pb-0"
          style={{ background: `linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #1a2340 100%)` }}
        >
          {/* Top row: title + actions */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {isHabits ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Leaf className="w-3 h-3" /> Habit Mode
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <Zap className="w-3 h-3" /> Macro Tracking
                  </span>
                )}
                {plan.is_template && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">Template</span>
                )}
                <span className="text-lg leading-none">{theme.icon}</span>
              </div>
              {/* Plan name */}
              <h2 className="text-2xl font-heading font-extrabold text-white leading-tight truncate">{plan.title}</h2>
              {plan.description && (
                <p className="text-sm text-white/60 mt-1 line-clamp-2">{plan.description}</p>
              )}
            </div>
            {/* Action buttons + close */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                className="gap-1.5 text-xs h-8 bg-gradient-to-r from-primary to-blue-500 text-white border-0"
                onClick={onAssign}
              >
                <UserPlus className="w-3.5 h-3.5" /> Assign
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 border-white/20 text-white hover:bg-white/10 hover:text-white"
                onClick={onEdit}
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Plan
              </Button>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Macro stats row */}
          {!isHabits && (
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {[
                { label: 'Calories', value: plan.calories, unit: 'kcal', color: 'text-gray-300' },
                { label: 'Protein', value: plan.protein_g, unit: 'g', color: 'text-blue-300' },
                { label: 'Carbs', value: plan.carbs_g, unit: 'g', color: 'text-orange-300' },
                { label: 'Fats', value: plan.fats_g, unit: 'g', color: 'text-yellow-300' },
              ].filter(m => m.value).map(m => (
                <div key={m.label} className="flex flex-col">
                  <span className={`text-xl font-extrabold leading-none ${m.color}`}>{m.value}<span className="text-sm font-normal ml-0.5">{m.unit}</span></span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wide mt-0.5">{m.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tab bar */}
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'relative px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors',
                  tab === t.key
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                )}
              >
                {t.label}
                {tab === t.key && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                    style={{ background: `linear-gradient(90deg, ${theme.from}, ${theme.to})` }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Two-column body ──────────────────────── */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left: main content (70%) */}
          <div className="flex-1 min-w-0 overflow-y-auto px-6 py-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {tab === 'overview'     && <OverviewTab plan={plan} />}
                {tab === 'meals'        && <MealPlanTab plan={plan} />}
                {tab === 'alternatives' && <AlternativesTab />}
                {tab === 'shopping'     && <ShoppingListTab plan={plan} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: sidebar (30%) */}
          <div
            className="flex-shrink-0 overflow-y-auto px-5 py-5 border-l border-[#E7EAF3] bg-white hidden md:block"
            style={{ width: 280 }}
          >
            <PlanDetailSidebar plan={plan} onAssign={onAssign} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}