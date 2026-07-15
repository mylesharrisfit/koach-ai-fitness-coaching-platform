import React from 'react';
import { Droplets, Plus, Minus, Salad } from 'lucide-react';
import { cn } from '@/lib/utils';

function MacroBar({ label, target, color = 'var(--tc-primary)', unit = 'g' }) {
  if (!target) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-muted last:border-0">
      <span className="text-sm text-foreground font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-0 rounded-full transition-all" style={{ background: color, width: '0%' }} />
        </div>
        <span className="text-sm font-bold text-foreground w-20 text-right">
          {target}{unit}
          <span className="text-muted-foreground font-normal text-xs"> target</span>
        </span>
      </div>
    </div>
  );
}

export default function NutritionPanel({ plan, mealsLogged, waterGlasses, onMealsChange, onWaterChange }) {
  const mealGoal = plan?.meals?.length || 4;
  const waterGoal = 8;
  const mealPct = Math.min(100, ((mealsLogged || 0) / mealGoal) * 100);
  const waterPct = Math.min(100, ((waterGlasses || 0) / waterGoal) * 100);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-muted">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center">
              <Salad className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Nutrition</p>
              <p className="text-sm font-bold text-foreground">{plan?.title || 'Your Plan'}</p>
            </div>
          </div>
          {plan?.calories && (
            <div className="text-right">
              <p className="text-xl font-bold text-foreground" style={{ letterSpacing: '-0.04em' }}>{plan.calories}</p>
              <p className="text-[10px] text-muted-foreground font-medium">kcal / day</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Macro targets */}
        {plan && (
          <div>
            <MacroBar label="Protein" target={plan.protein_g} color="var(--tc-primary)" unit="g" />
            <MacroBar label="Carbs" target={plan.carbs_g} color="var(--tc-ai)" unit="g" />
            <MacroBar label="Fats" target={plan.fats_g} color="var(--tc-warning)" unit="g" />
          </div>
        )}

        {/* Meals logged */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">Meals logged</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onMealsChange(Math.max(0, (mealsLogged || 0) - 1))}
                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-border active:scale-90 transition-all"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-bold text-foreground w-12 text-center">
                {mealsLogged || 0}<span className="text-muted-foreground font-normal">/{mealGoal}</span>
              </span>
              <button
                onClick={() => onMealsChange(Math.min(mealGoal, (mealsLogged || 0) + 1))}
                className="w-7 h-7 rounded-full bg-sidebar flex items-center justify-center text-white hover:bg-sidebar-accent active:scale-90 transition-all"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${mealPct}%` }} />
          </div>
        </div>

        {/* Water tracker */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Hydration</span>
            </div>
            <span className="text-sm font-bold text-foreground">
              {waterGlasses || 0}<span className="text-muted-foreground font-normal">/{waterGoal} glasses</span>
            </span>
          </div>
          {/* Water glass buttons */}
          <div className="flex gap-1.5">
            {Array.from({ length: waterGoal }, (_, i) => {
              const filled = i < (waterGlasses || 0);
              return (
                <button
                  key={i}
                  onClick={() => onWaterChange(filled ? i : i + 1)}
                  className={cn(
                    'flex-1 h-9 rounded-lg flex items-center justify-center transition-all active:scale-90',
                    filled ? 'bg-accent/10' : 'bg-muted hover:bg-border'
                  )}
                >
                  <Droplets className={cn('w-4 h-4 transition-colors', filled ? 'text-primary' : 'text-muted-foreground')} />
                </button>
              );
            })}
          </div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${waterPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}