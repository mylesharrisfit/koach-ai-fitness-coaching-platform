import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Beef, Wheat, Droplets, Users, Copy, Edit, Trash2, MoreHorizontal, Leaf, Zap, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import NutritionPlanDetailModal from './NutritionPlanDetailModal';

function MacroPill({ label, value, unit = 'g', color }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl ${color}`}>
      <p className="text-sm font-bold text-foreground">{value}{unit}</p>
      <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

function AdherenceBar({ value = 82 }) {
  const color = value >= 80 ? '#22C55E' : value >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-muted-foreground font-medium">Adherence</span>
        <span className="text-[11px] font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export default function NutritionPlanCard({ plan, onEdit, onDuplicate, onDelete, index }) {
  const [showDetail, setShowDetail] = useState(false);
  const isHabits = plan.tracking_mode === 'habits';
  const mealCount = (plan.meals || []).length;
  const adherence = 72 + (index % 3) * 9; // placeholder

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white rounded-2xl border border-[#E7EAF3] hover:border-primary/25 hover:shadow-lg transition-all group overflow-hidden"
    >
      {/* Top accent bar */}
      <div
        className="h-1.5"
        style={{ background: isHabits ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #3B82F6, #60A5FA)' }}
      />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-bold text-[#1F2A44] truncate text-base">{plan.title}</h3>
              {isHabits ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Leaf className="w-2.5 h-2.5" /> Habit Mode
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-primary border border-blue-100">
                  <Zap className="w-2.5 h-2.5" /> Macro Tracking
                </span>
              )}
            </div>
            {plan.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{plan.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Macros */}
        {!isHabits && (
          <div className="grid grid-cols-4 gap-2">
            <MacroPill label="cal" value={plan.calories || 0} unit="" color="bg-orange-50 border border-orange-100" />
            <MacroPill label="protein" value={plan.protein_g || 0} color="bg-red-50 border border-red-100" />
            <MacroPill label="carbs" value={plan.carbs_g || 0} color="bg-amber-50 border border-amber-100" />
            <MacroPill label="fats" value={plan.fats_g || 0} color="bg-blue-50 border border-blue-100" />
          </div>
        )}

        {isHabits && (
          <div className="space-y-1.5">
            {(plan.meals || []).slice(0, 3).map((m, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">{m.habit_description || m.meal_name}</span>
              </div>
            ))}
            {(plan.meals || []).length > 3 && (
              <p className="text-xs text-muted-foreground pl-3.5">+{plan.meals.length - 3} more habits</p>
            )}
          </div>
        )}

        {/* Adherence + meta */}
        <div className="space-y-3">
          <AdherenceBar value={adherence} />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {mealCount} meals configured
            </span>
            {plan.is_template && (
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-semibold text-[10px]">Template</span>
            )}
          </div>
        </div>
      </div>
      {/* View Detail button */}
      <div className="px-5 pb-4">
        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => setShowDetail(true)}>
          <Eye className="w-3.5 h-3.5" /> View Meal Plan
        </Button>
      </div>

      <NutritionPlanDetailModal
        open={showDetail}
        onOpenChange={setShowDetail}
        plan={plan}
        onEdit={() => { setShowDetail(false); onEdit(); }}
      />
    </motion.div>
  );
}