import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Apple } from 'lucide-react';

const MacroBar = ({ label, grams, color }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-[#9CA3AF] w-16 flex-shrink-0">{label}</span>
    <div className="flex-1 h-1.5 bg-[#F0F2F8] rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (grams / 300) * 100)}%` }} />
    </div>
    <span className="text-xs font-semibold text-[#374151] w-10 text-right tabular-nums">{grams}g</span>
  </div>
);

export default function ProfileNutritionTab({ client }) {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['nutrition-plans'],
    queryFn: () => base44.entities.NutritionPlan.list(),
  });

  const assigned = plans.find(p => p.id === client.assigned_nutrition_id);

  if (isLoading) return <div className="h-32 bg-white rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-4">
      {assigned ? (
        <>
          <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Apple className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">Assigned Plan</h3>
            </div>
            <h4 className="text-base font-bold text-[#1F2A44] mb-1">{assigned.title}</h4>
            {assigned.description && <p className="text-sm text-[#6B7280] mb-3">{assigned.description}</p>}

            {assigned.calories && (
              <div className="bg-[#F6F7FB] rounded-xl p-3 mb-3 text-center">
                <span className="text-xl font-bold text-[#1F2A44]">{assigned.calories}</span>
                <span className="text-xs text-[#9CA3AF] ml-1">kcal/day</span>
              </div>
            )}

            {(assigned.protein_g || assigned.carbs_g || assigned.fats_g) && (
              <div className="space-y-2">
                {assigned.protein_g && <MacroBar label="Protein"  grams={assigned.protein_g}  color="bg-blue-400" />}
                {assigned.carbs_g   && <MacroBar label="Carbs"    grams={assigned.carbs_g}    color="bg-amber-400" />}
                {assigned.fats_g    && <MacroBar label="Fats"     grams={assigned.fats_g}     color="bg-rose-400" />}
              </div>
            )}
          </div>

          {assigned.meals?.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
              <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Meals</h3>
              <div className="space-y-3">
                {assigned.meals.map((meal, i) => (
                  <div key={i} className="border border-[#F0F2F8] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-[#1F2A44]">{meal.meal_name}</span>
                      {meal.time && <span className="text-xs text-[#9CA3AF]">{meal.time}</span>}
                    </div>
                    {meal.foods?.map((f, fi) => (
                      <div key={fi} className="flex items-center justify-between text-xs text-[#6B7280] py-1 border-t border-[#F6F7FB] first:border-0">
                        <span>{f.food_name} · {f.portion}</span>
                        {f.calories && <span className="tabular-nums">{f.calories} kcal</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] flex flex-col items-center justify-center py-12 text-center px-6">
          <div className="w-12 h-12 rounded-full bg-[#F6F7FB] flex items-center justify-center mb-3">
            <Apple className="w-5 h-5 text-[#9CA3AF]" />
          </div>
          <p className="text-sm font-semibold text-[#374151]">No nutrition plan assigned</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Assign a plan from the Nutrition page</p>
        </div>
      )}
    </div>
  );
}