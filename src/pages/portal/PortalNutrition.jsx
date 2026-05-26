import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Salad } from 'lucide-react';
import MacroRings from '@/components/portal/nutrition/MacroRings';
import MealCard from '@/components/portal/nutrition/MealCard';
import WaterTracker from '@/components/portal/nutrition/WaterTracker';
import HabitMode from '@/components/portal/nutrition/HabitMode';
import FoodSearchDrawer from '@/components/portal/nutrition/FoodSearchDrawer';
import AIAssistant from '@/components/portal/nutrition/AIAssistant';

const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function PortalNutrition({ user }) {
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'plan'
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMeal, setSearchMeal] = useState('');
  const [loggedHabits, setLoggedHabits] = useState(new Set());
  const queryClient = useQueryClient();

  // Client profile
  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-nt2', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];

  // Nutrition plan
  const { data: plans = [] } = useQuery({
    queryKey: ['portal-nutrition-plan', myClient?.assigned_nutrition_id],
    queryFn: () => base44.entities.NutritionPlan.filter({ id: myClient.assigned_nutrition_id }, '-created_date', 1),
    enabled: !!myClient?.assigned_nutrition_id,
  });
  const plan = plans[0];
  const isHabitMode = plan?.tracking_mode === 'habits';

  // Today's food logs
  const { data: foodLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['portal-food-log', myClient?.id, TODAY],
    queryFn: () => base44.entities.FoodLog.filter({ client_id: myClient.id, logged_date: TODAY }, '-created_date', 100),
    enabled: !!myClient?.id,
  });

  // Recent foods (last 30 days for suggestions)
  const { data: recentFoods = [] } = useQuery({
    queryKey: ['portal-recent-foods', myClient?.id],
    queryFn: () => base44.entities.FoodLog.filter({ client_id: myClient.id }, '-created_date', 30),
    enabled: !!myClient?.id,
  });

  // Daily log (for water)
  const [dailyLogId, setDailyLogId] = useState(null);
  const [waterMl, setWaterMl] = useState(0);

  const { data: existingLog } = useQuery({
    queryKey: ['portal-daily-log-nt', TODAY],
    queryFn: () => base44.entities.DailyLog.filter({ date: TODAY }, '-created_date', 1),
    enabled: !!user,
  });
  useEffect(() => {
    if (existingLog?.length > 0) {
      const l = existingLog[0];
      setDailyLogId(l.id);
      setWaterMl((l.water_glasses || 0) * 250);
    }
  }, [existingLog]);

  const waterMutation = useMutation({
    mutationFn: (ml) => {
      const glasses = Math.round(ml / 250);
      return dailyLogId
        ? base44.entities.DailyLog.update(dailyLogId, { water_glasses: glasses })
        : base44.entities.DailyLog.create({ client_id: myClient?.id || 'me', date: TODAY, water_glasses: glasses });
    },
    onSuccess: (res) => {
      if (!dailyLogId && res?.id) setDailyLogId(res.id);
    },
  });

  const addWater = (ml) => {
    const newTotal = waterMl + ml;
    setWaterMl(newTotal);
    waterMutation.mutate(newTotal);
  };

  // Log food mutation
  const logFoodMutation = useMutation({
    mutationFn: (foodData) => base44.entities.FoodLog.create({
      client_id: myClient.id,
      logged_date: TODAY,
      logged_by: 'client',
      ...foodData,
    }),
    onSuccess: () => {
      refetchLogs();
      queryClient.invalidateQueries({ queryKey: ['portal-food-log'] });
    },
  });

  const handleLogFood = (mealName) => {
    setSearchMeal(mealName);
    setSearchOpen(true);
  };

  const handleAddFood = (food) => {
    logFoodMutation.mutate(food);
    setSearchOpen(false);
  };

  // "Use Meal Plan" — log all foods in a meal at once
  const handleUseMealPlan = (meal) => {
    (meal.foods || []).forEach(food => {
      logFoodMutation.mutate({
        meal_name: meal.meal_name,
        food_name: food.food_name,
        serving_quantity: 1,
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fats: food.fats || 0,
      });
    });
  };

  // Aggregate logged macros for today
  const todayLogged = foodLogs.reduce((acc, f) => ({
    calories: acc.calories + (f.calories || 0),
    protein: acc.protein + (f.protein || 0),
    carbs: acc.carbs + (f.carbs || 0),
    fats: acc.fats + (f.fats || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  todayLogged.water = waterMl;

  if (!myClient) {
    return (
      <div className="px-5 pt-12 pb-28 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-28 space-y-4">
      {/* Header */}
      <div className="px-5 pt-12 pb-2">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Nutrition</p>
        <h1 className="text-white text-xl font-bold mt-0.5">{plan?.title || 'My Nutrition'}</h1>
        <p className="text-white/30 text-xs mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* Tabs */}
      <div className="px-5 flex gap-2">
        {[
          { id: 'today', label: "Today's Log" },
          { id: 'plan', label: 'My Plan' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.06)',
              color: activeTab === tab.id ? '#60A5FA' : 'rgba(255,255,255,0.35)',
              border: activeTab === tab.id ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.08)',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'today' ? (
        <>
          {!plan ? (
            <div className="mx-4 p-6 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Salad className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/50 text-sm font-semibold">No nutrition plan yet</p>
              <p className="text-white/25 text-xs mt-1">Ask your coach about setting up your nutrition plan 🥗</p>
            </div>
          ) : isHabitMode ? (
            <HabitMode
              meals={plan.meals || []}
              loggedHabits={loggedHabits}
              onToggleHabit={(id) => setLoggedHabits(prev => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
              })}
            />
          ) : (
            <>
              {/* Macro Rings */}
              <MacroRings logged={todayLogged} plan={plan} />

              {/* Meal Cards */}
              {(plan.meals || []).map((meal, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <MealCard
                    meal={meal}
                    mealIndex={i}
                    loggedFoods={foodLogs.filter(f => f.meal_name === meal.meal_name)}
                    onLogFood={handleLogFood}
                    onUseMealPlan={handleUseMealPlan}
                  />
                </motion.div>
              ))}

              {/* Water Tracker */}
              <WaterTracker waterMl={waterMl} goalMl={3000} onAdd={addWater} />
            </>
          )}
        </>
      ) : (
        /* My Plan tab */
        <div className="px-4 space-y-4">
          {!plan ? (
            <div className="p-6 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-white/40 text-sm">No plan assigned yet</p>
            </div>
          ) : (
            <>
              {/* Plan info */}
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-white font-bold">{plan.title}</p>
                {plan.description && <p className="text-white/40 text-xs mt-1">{plan.description}</p>}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[
                    { label: 'Cal', val: plan.calories, color: '#F59E0B' },
                    { label: 'Protein', val: plan.protein_g ? `${plan.protein_g}g` : null, color: '#3B82F6' },
                    { label: 'Carbs', val: plan.carbs_g ? `${plan.carbs_g}g` : null, color: '#F97316' },
                    { label: 'Fats', val: plan.fats_g ? `${plan.fats_g}g` : null, color: '#EAB308' },
                  ].filter(x => x.val).map(x => (
                    <div key={x.label} className="p-2 rounded-xl text-center" style={{ background: `${x.color}10` }}>
                      <p className="font-bold text-sm" style={{ color: x.color }}>{x.val}</p>
                      <p className="text-white/30 text-[9px] mt-0.5">{x.label}</p>
                    </div>
                  ))}
                </div>
                {plan.notes && (
                  <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <p className="text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-1">Coach Notes</p>
                    <p className="text-white/60 text-xs leading-relaxed">{plan.notes}</p>
                  </div>
                )}
              </div>

              {/* Full meals breakdown */}
              {(plan.meals || []).map((m, i) => (
                <div key={i} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-bold text-sm">{m.meal_name}</p>
                    {m.time && <p className="text-white/30 text-xs">{m.time}</p>}
                  </div>
                  {(m.foods || []).map((f, fi) => (
                    <div key={fi} className="flex items-center gap-2 py-2" style={{ borderTop: fi > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-xs font-semibold">{f.food_name}</p>
                        <p className="text-white/25 text-[10px]">{f.portion}</p>
                      </div>
                      {f.calories && <p className="text-white/30 text-[10px] flex-shrink-0">{f.calories} kcal</p>}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* AI Assistant FAB */}
      <AIAssistant plan={plan} todayLogged={todayLogged} />

      {/* Food Search Drawer */}
      <FoodSearchDrawer
        open={searchOpen}
        mealName={searchMeal}
        recentFoods={recentFoods.slice(0, 10)}
        onAdd={handleAddFood}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}