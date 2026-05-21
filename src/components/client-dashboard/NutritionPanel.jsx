import React from 'react';
import { Droplets, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

function MacroBar({ label, consumed, target, unit = 'g' }) {
  const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#6B7280]">{label}</span>
        <span className="text-xs font-semibold text-[#111827]">{consumed}<span className="text-[#9CA3AF] font-normal">/{target}{unit}</span></span>
      </div>
      <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div className="h-full bg-[#2563EB] rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function NutritionPanel({ plan, mealsLogged, waterGlasses, onMealsChange, onWaterChange }) {
  const mealGoal = plan?.meals?.length || 4;
  const waterGoal = 8;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#6B7280]">Nutrition</p>
          <p className="text-base font-semibold text-[#111827]">{plan?.title || 'Your Nutrition Plan'}</p>
        </div>
        {plan?.calories && (
          <div className="text-right">
            <p className="text-lg font-bold text-[#111827]">{plan.calories}</p>
            <p className="text-[10px] text-[#9CA3AF]">kcal target</p>
          </div>
        )}
      </div>

      {/* Macro bars */}
      {plan && (
        <div className="space-y-2.5">
          <MacroBar label="Calories" consumed={0} target={plan.calories || 0} unit=" kcal" />
          <MacroBar label="Protein" consumed={0} target={plan.protein_g || 0} />
          <MacroBar label="Carbs" consumed={0} target={plan.carbs_g || 0} />
          <MacroBar label="Fats" consumed={0} target={plan.fats_g || 0} />
        </div>
      )}

      {/* Meals logged */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#374151]">Meals logged</span>
          <div className="flex items-center gap-2">
            <button onClick={() => onMealsChange(Math.max(0, (mealsLogged || 0) - 1))} className="w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] hover:bg-[#E5E7EB] transition-colors">
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-sm font-bold text-[#111827] w-12 text-center">{mealsLogged || 0}/{mealGoal}</span>
            <button onClick={() => onMealsChange(Math.min(mealGoal, (mealsLogged || 0) + 1))} className="w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] hover:bg-[#E5E7EB] transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
          <div className="h-full bg-[#2563EB] rounded-full transition-all" style={{ width: `${Math.min(100, ((mealsLogged || 0) / mealGoal) * 100)}%` }} />
        </div>
      </div>

      {/* Water */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="text-sm text-[#374151]">Water</span>
          </div>
          <span className="text-sm font-bold text-[#111827]">{waterGlasses || 0}/{waterGoal} glasses</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: waterGoal }, (_, i) => (
            <button
              key={i}
              onClick={() => onWaterChange(i < (waterGlasses || 0) ? i : i + 1)}
              title={`${i + 1} glass${i > 0 ? 'es' : ''}`}
              className="flex-1 h-8 rounded-lg flex items-center justify-center transition-all"
            >
              <Droplets className={cn('w-4 h-4 transition-colors', i < (waterGlasses || 0) ? 'text-[#2563EB]' : 'text-[#E5E7EB]')} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}