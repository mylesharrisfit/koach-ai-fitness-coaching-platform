import React, { useState } from 'react';
import { X, Edit2, UserPlus } from 'lucide-react';
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

export default function NutritionPlanDetailModal({ open, onOpenChange, plan, onEdit, onAssign }) {
  const [tab, setTab] = useState('overview');

  if (!plan || !open) return null;

  const isHabits = plan.tracking_mode === 'habits';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="relative w-full h-[95dvh] sm:h-[90vh] sm:max-w-[90vw] bg-white sm:rounded-xl rounded-t-2xl flex flex-col overflow-hidden border border-[#E5E7EB]"
        style={{ maxWidth: 1100 }}
      >
        {/* ── Clean header ── */}
        <div className="flex-shrink-0 border-b border-[#E5E7EB] bg-white">
          {/* Top row */}
          <div className="flex items-center justify-between gap-4 px-6 pt-4 pb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className={cn(
                  'text-xs font-medium px-2.5 py-0.5 rounded-full border',
                  isHabits
                    ? 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]'
                    : 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]'
                )}>
                  {isHabits ? 'Habit Mode' : 'Macro Tracking'}
                </span>
                {plan.is_template && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]">Template</span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-[#111827] leading-tight truncate">{plan.title}</h2>
              {plan.description && (
                <p className="text-sm text-[#6B7280] mt-0.5 line-clamp-1">{plan.description}</p>
              )}
            </div>

            {/* Macro stats inline */}
            {!isHabits && (
              <div className="hidden md:flex items-center gap-5 px-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                {[
                  { label: 'Calories', value: plan.calories, unit: 'kcal' },
                  { label: 'Protein',  value: plan.protein_g, unit: 'g' },
                  { label: 'Carbs',    value: plan.carbs_g,   unit: 'g' },
                  { label: 'Fats',     value: plan.fats_g,    unit: 'g' },
                ].filter(m => m.value).map(m => (
                  <div key={m.label} className="text-center">
                    <p className="text-sm font-semibold text-[#111827]">{m.value}<span className="text-xs text-[#9CA3AF] ml-0.5">{m.unit}</span></p>
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">{m.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" className="gap-1.5 text-xs h-8 bg-[#111827] text-white hover:bg-[#1F2937]" onClick={onAssign}>
                <UserPlus className="w-3.5 h-3.5" /> Assign
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]" onClick={onEdit}>
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </Button>
              <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 overflow-x-auto px-6">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                  tab === t.key ? 'text-[#111827]' : 'text-[#6B7280] hover:text-[#374151]'
                )}
              >
                {t.label}
                {tab === t.key && (
                  <motion.div
                    layoutId="modal-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2563EB] rounded-t-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 bg-[#FAFAFA]">
        <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 py-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.12 }}
              >
                {tab === 'overview'     && <OverviewTab plan={plan} />}
                {tab === 'meals'        && <MealPlanTab plan={plan} />}
                {tab === 'alternatives' && <AlternativesTab plan={plan} />}
                {tab === 'shopping'     && <ShoppingListTab plan={plan} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex-shrink-0 overflow-y-auto px-5 py-5 border-t lg:border-t-0 lg:border-l border-[#E5E7EB] bg-white hidden lg:block" style={{ width: 280 }}>
            <PlanDetailSidebar plan={plan} onAssign={onAssign} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}