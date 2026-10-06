import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import { format } from 'date-fns';
import { Flame, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import FoodSearchModal from './FoodSearchModal';

/* ─────────────── helpers ─────────────── */
const TODAY = format(new Date(), 'yyyy-MM-dd');

function sumField(logs, field) {
  return Math.round(logs.reduce((s, l) => s + (parseFloat(l[field]) || 0), 0));
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ─────────────── Circular Progress Ring ─────────────── */
function MacroRing({ label, consumed, target, color }) {
  const R = 28;
  const circ = 2 * Math.PI * R;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const over = target > 0 && consumed > target * 1.05;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
          {/* track */}
          <circle cx="36" cy="36" r={R} stroke="currentColor" strokeWidth="6"
            className="text-secondary" fill="none" />
          {/* fill */}
          <circle
            cx="36" cy="36" r={R}
            stroke={over ? 'rgb(var(--destructive))' : color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ - pct * circ}
            style={{ transition: 'stroke-dashoffset 300ms ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-bold leading-none text-foreground">{consumed}</span>
          {target > 0 && <span className="text-xs text-muted-foreground leading-none mt-0.5">/ {target}</span>}
        </div>
      </div>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    </div>
  );
}

/* ─────────────── Meal Row ─────────────── */
function MealRow({ meal, logs, onLog }) {
  const mealLogs = logs.filter(l => l.meal_name === meal.meal_name);
  const mealCal = sumField(mealLogs, 'calories');

  return (
    <div className="bg-secondary/30 rounded-xl overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div>
          <p className="text-sm font-bold text-foreground">{meal.meal_name}</p>
          {meal.time && <p className="text-xs text-muted-foreground">{meal.time}</p>}
        </div>
        <div className="flex items-center gap-2">
          {mealLogs.length > 0 && (
            <span className="text-xs font-semibold text-muted-foreground">{mealCal} kcal</span>
          )}
          <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1" onClick={onLog}>
            <Plus className="w-3 h-3" /> Log
          </Button>
        </div>
      </div>

      {/* logged items */}
      {mealLogs.length > 0 && (
        <div className="border-t border-border divide-y divide-border">
          {mealLogs.map(log => (
            <div key={log.id} className="flex items-center justify-between px-4 py-2">
              <p className="text-xs font-medium text-foreground truncate flex-1 mr-2">{log.food_name}</p>
              <div className="flex gap-2 text-xs font-semibold shrink-0">
                <span className="text-foreground">{log.calories} kcal</span>
                <span className="text-primary">P{log.protein}g</span>
                <span className="text-warning">C{log.carbs}g</span>
                <span className="text-destructive">F{log.fats}g</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Main Widget ─────────────── */
export default function ClientFoodLogWidget({ client, nutritionPlanId }) {
  const queryClient = useQueryClient();
  const [logModal, setLogModal] = useState(null); // meal_name string or null

  const { data: nutritionPlan } = useQuery({
    queryKey: ['nutrition-plan', nutritionPlanId],
    queryFn: () => db.entities.NutritionPlan.filter({ id: nutritionPlanId }).then(r => r[0]),
    enabled: !!nutritionPlanId,
  });

  const { data: allLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['food-logs-widget', client?.id, TODAY],
    queryFn: () => db.entities.FoodLog.filter({ client_id: client.id, logged_date: TODAY }),
    enabled: !!client?.id,
  });

  // Streak: count consecutive days with at least one log entry
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['food-logs-streak', client?.id],
    queryFn: () => db.entities.FoodLog.filter({ client_id: client.id }, '-logged_date', 100),
    enabled: !!client?.id,
  });

  const streak = useMemo(() => {
    if (!recentLogs.length) return 0;
    const days = [...new Set(recentLogs.map(l => l.logged_date))].sort().reverse();
    let count = 0;
    let cursor = new Date();
    for (const day of days) {
      const expected = format(cursor, 'yyyy-MM-dd');
      if (day === expected) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [recentLogs]);

  const addLogMutation = useMutation({
    mutationFn: (entry) => db.entities.FoodLog.create(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-logs-widget', client?.id, TODAY] });
      queryClient.invalidateQueries({ queryKey: ['food-logs-streak', client?.id] });
    },
  });

  const foodLogs = allLogs.filter(l => l.meal_name !== '__coach_notes__');

  const totCal  = sumField(foodLogs, 'calories');
  const totPro  = sumField(foodLogs, 'protein');
  const totCarb = sumField(foodLogs, 'carbs');
  const totFat  = sumField(foodLogs, 'fats');

  const tCal  = nutritionPlan?.calories  || 0;
  const tPro  = nutritionPlan?.protein_g || 0;
  const tCarb = nutritionPlan?.carbs_g   || 0;
  const tFat  = nutritionPlan?.fats_g    || 0;

  const macrosHit = tCal > 0 && totCal >= tCal * 0.9 && totPro >= tPro * 0.9;

  const meals = nutritionPlan?.meals?.length
    ? nutritionPlan.meals
    : [{ meal_name: 'Breakfast' }, { meal_name: 'Lunch' }, { meal_name: 'Dinner' }, { meal_name: 'Snack' }];

  function handleAddFood(food) {
    if (!logModal) return;
    addLogMutation.mutate({
      client_id:        client.id,
      logged_date:      TODAY,
      meal_name:        logModal,
      food_name:        food.name,
      serving_quantity: food.qty?.[food.food_id] ?? 1,
      serving_unit:     food.serving_unit,
      calories:         food.calories,
      protein:          food.protein,
      carbs:            food.carbs,
      fats:             food.fats,
      logged_by:        'client',
    });
  }

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground leading-snug">
            {greeting()}, {client?.name?.split(' ')[0]}
          </h2>
          <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-secondary text-foreground px-3 py-1.5 rounded-full text-xs font-semibold tabular-nums">
            <Flame className="w-3.5 h-3.5" />
            {streak} day streak
          </div>
        )}
      </div>

      {/* Macro rings */}
      {nutritionPlan && (
        <div className="bg-card border border-border rounded-xl p-5">
          {/* Calorie headline */}
          <div className="text-center mb-4">
            <p className="text-[13px] text-muted-foreground mb-0.5">Calories today</p>
            <p className="num text-[36px] leading-none">
              {totCal}
              {tCal > 0 && <span className="text-base font-normal text-muted-foreground ml-1">/ {tCal} kcal</span>}
            </p>
            {tCal > 0 && (
              <div className="mt-3 h-2.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-[width] duration-300', totCal > tCal * 1.05 ? 'bg-destructive' : totCal >= tCal * 0.9 ? 'bg-success' : 'bg-foreground')}
                  style={{ width: `${Math.min((totCal / tCal) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Macro rings row */}
          <div className="flex justify-around pt-2">
            <MacroRing label="Protein"  consumed={totPro}  target={tPro}  color="rgb(var(--foreground))" />
            <MacroRing label="Carbs"    consumed={totCarb} target={tCarb} color="rgb(var(--muted-foreground))" />
            <MacroRing label="Fats"     consumed={totFat}  target={tFat}  color="rgb(var(--input))" />
          </div>

          {/* Macros hit banner */}
          {macrosHit && (
            <div className="mt-4 flex items-center justify-center gap-2 bg-success-soft rounded-lg py-2.5 text-sm font-semibold text-success">
              <CheckCircle2 className="w-4 h-4" />
              Macros hit for today
            </div>
          )}
        </div>
      )}

      {/* Meals list */}
      <div className="space-y-2">
        <p className="text-[13px] text-muted-foreground px-0.5">Today's meals</p>
        {logsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {meals.map((meal, i) => (
              <div key={meal.meal_name || i}>
                <MealRow
                  meal={meal}
                  logs={foodLogs}
                  onLog={() => setLogModal(meal.meal_name)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Food Search Modal */}
      <FoodSearchModal
        open={!!logModal}
        onOpenChange={(v) => { if (!v) setLogModal(null); }}
        mealName={logModal}
        onAddFood={handleAddFood}
      />
    </div>
  );
}