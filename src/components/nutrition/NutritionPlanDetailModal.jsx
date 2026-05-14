import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Utensils, ShoppingCart, Salad, Droplets, RefreshCw, Edit2 } from 'lucide-react';
import MealPlanViewer from './MealPlanViewer';
import GroceryListModal from './GroceryListModal';
import NutritionCheckInModal from './NutritionCheckInModal';
import WaterTracker from './WaterTracker';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'meals', label: 'Meal Plan', icon: Utensils },
  { key: 'water', label: 'Water', icon: Droplets },
  { key: 'checkin', label: 'Check-In', icon: Salad },
];

export default function NutritionPlanDetailModal({ open, onOpenChange, plan, onEdit }) {
  const [tab, setTab] = useState('meals');
  const [showGrocery, setShowGrocery] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [waterTarget, setWaterTarget] = useState(plan?.water_target_ml || 2500);

  if (!plan) return null;

  const carbCycling = plan.carb_cycling;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">

          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-[#E7EAF3] bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <DialogTitle className="font-heading font-bold text-base text-foreground truncate">{plan.title}</DialogTitle>
                {plan.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{plan.description}</p>}
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-shrink-0" onClick={onEdit}>
                <Edit2 className="w-3 h-3" /> Edit
              </Button>
            </div>

            {/* Macro summary */}
            {plan.tracking_mode !== 'habits' && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {[
                  { label: 'kcal', value: plan.calories, cls: 'bg-orange-50 text-orange-600 border-orange-100' },
                  { label: 'Protein', value: `${plan.protein_g}g`, cls: 'bg-red-50 text-red-600 border-red-100' },
                  { label: 'Carbs', value: `${plan.carbs_g}g`, cls: 'bg-amber-50 text-amber-600 border-amber-100' },
                  { label: 'Fats', value: `${plan.fats_g}g`, cls: 'bg-blue-50 text-blue-600 border-blue-100' },
                ].map(({ label, value, cls }) => value ? (
                  <span key={label} className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${cls}`}>
                    {value} <span className="font-normal opacity-70">{label}</span>
                  </span>
                ) : null)}
                {carbCycling?.enabled && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl border bg-amber-50 text-amber-700 border-amber-100">⚡ Carb Cycling ON</span>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mt-3 bg-secondary/50 rounded-xl p-1 w-fit">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    tab === t.key ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <t.icon className="w-3 h-3" /> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">

            {tab === 'meals' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {(plan.meals || []).length} Meals Configured
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setShowGrocery(true)}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Grocery List
                  </Button>
                </div>

                {/* Carb cycling schedule if enabled */}
                {carbCycling?.enabled && carbCycling.schedule && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-xs font-bold text-amber-700 mb-2">⚡ Carb Cycling Schedule</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(carbCycling.schedule).map(([day, type]) => {
                        if (type === 'none') return null;
                        const colors = { high: 'bg-amber-400 text-white', medium: 'bg-blue-400 text-white', low: 'bg-emerald-400 text-white' };
                        return (
                          <span key={day} className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${colors[type] || 'bg-secondary text-muted-foreground'}`}>
                            {day.slice(0, 3)}: {type}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <MealPlanViewer plan={plan} />
              </div>
            )}

            {tab === 'water' && (
              <WaterTracker
                target={waterTarget}
                onTargetChange={setWaterTarget}
              />
            )}

            {tab === 'checkin' && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                  <p className="text-sm font-semibold text-foreground mb-1">Weekly Nutrition Adherence</p>
                  <p className="text-xs text-muted-foreground">Rate how well you followed this plan and log any notes for your coach.</p>
                </div>
                <Button onClick={() => setShowCheckIn(true)} className="w-full gap-2">
                  <Salad className="w-4 h-4" /> Start Weekly Check-In
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <GroceryListModal open={showGrocery} onOpenChange={setShowGrocery} plan={plan} />
      <NutritionCheckInModal open={showCheckIn} onOpenChange={setShowCheckIn} planId={plan?.id} />
    </>
  );
}