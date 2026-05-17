import React from 'react';
import { ArrowRight } from 'lucide-react';

const FOOD_SWAPS = {
  Proteins: [
    { from: 'Chicken Breast (100g)', to: ['Turkey Breast', 'Tilapia Fillet', 'Egg Whites (3 large)', 'Greek Yogurt (150g)'], macros: { cal: 165, p: 31, c: 0, f: 3.6 }, swapMacros: [{ cal: 157, p: 30, c: 0, f: 3.2 }, { cal: 96, p: 20, c: 0, f: 2 }, { cal: 51, p: 11, c: 0.4, f: 0.2 }, { cal: 130, p: 17, c: 7, f: 3.5 }] },
    { from: 'Lean Ground Beef (100g)', to: ['Ground Turkey', 'Bison', 'Tempeh (100g)'], macros: { cal: 215, p: 26, c: 0, f: 12 }, swapMacros: [{ cal: 170, p: 22, c: 0, f: 9 }, { cal: 109, p: 20, c: 0, f: 2.4 }, { cal: 195, p: 20, c: 8, f: 10 }] },
  ],
  Carbs: [
    { from: 'White Rice (100g cooked)', to: ['Sweet Potato (100g)', 'Oats (80g dry)', 'Quinoa (100g cooked)'], macros: { cal: 130, p: 2.7, c: 28, f: 0.3 }, swapMacros: [{ cal: 86, p: 1.6, c: 20, f: 0.1 }, { cal: 303, p: 11, c: 52, f: 5.5 }, { cal: 120, p: 4.4, c: 21, f: 1.9 }] },
    { from: 'White Bread (2 slices)', to: ['Ezekiel Bread', 'Corn Tortilla (2)', 'Rice Cakes (3)'], macros: { cal: 160, p: 5, c: 30, f: 2 }, swapMacros: [{ cal: 160, p: 8, c: 28, f: 1 }, { cal: 110, p: 2.5, c: 23, f: 1.2 }, { cal: 105, p: 2, c: 23, f: 0.7 }] },
  ],
  Fats: [
    { from: 'Almonds (30g)', to: ['Walnuts (30g)', 'Avocado (50g)', 'Olive Oil (1 tbsp)'], macros: { cal: 174, p: 6, c: 6, f: 15 }, swapMacros: [{ cal: 196, p: 4.6, c: 4, f: 19 }, { cal: 80, p: 1, c: 4, f: 7.3 }, { cal: 119, p: 0, c: 0, f: 13.5 }] },
  ],
  Vegetables: [
    { from: 'Broccoli (100g)', to: ['Spinach (100g)', 'Asparagus (100g)', 'Zucchini (100g)'], macros: { cal: 34, p: 2.8, c: 7, f: 0.4 }, swapMacros: [{ cal: 23, p: 2.9, c: 3.6, f: 0.4 }, { cal: 20, p: 2.2, c: 3.9, f: 0.1 }, { cal: 17, p: 1.2, c: 3.1, f: 0.3 }] },
  ],
};

const CATEGORY_COLORS = {
  Proteins: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', dot: '#3B82F6' },
  Carbs: { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', dot: '#F97316' },
  Fats: { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-700', dot: '#CA8A04' },
  Vegetables: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', dot: '#10B981' },
};

function MacroBadge({ cal, p, c, f }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <span className="text-muted-foreground">{cal} kcal</span>
      <span className="text-blue-500 font-semibold">{p}g P</span>
      <span className="text-orange-500 font-semibold">{c}g C</span>
      <span className="text-yellow-600 font-semibold">{f}g F</span>
    </div>
  );
}

export default function AlternativesTab() {
  return (
    <div className="space-y-6 pb-4">
      <p className="text-xs text-muted-foreground">
        Use these approved food swaps to maintain your macro targets while adding variety to the plan.
      </p>
      {Object.entries(FOOD_SWAPS).map(([category, swaps]) => {
        const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.Proteins;
        return (
          <div key={category}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${colors.text}`}>{category}</h4>
            <div className="space-y-3">
              {swaps.map((swap, si) => (
                <div key={si} className={`${colors.bg} border ${colors.border} rounded-xl p-3.5`}>
                  {/* Original food */}
                  <div className="mb-2">
                    <p className="text-sm font-bold text-foreground">{swap.from}</p>
                    <MacroBadge {...swap.macros} />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                    <ArrowRight className="w-3 h-3" /> Can swap with:
                  </div>
                  {/* Alternatives */}
                  <div className="space-y-2">
                    {swap.to.map((alt, ai) => (
                      <div key={ai} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colors.dot }} />
                          <span className="text-sm text-foreground">{alt}</span>
                        </div>
                        {swap.swapMacros[ai] && <MacroBadge {...swap.swapMacros[ai]} />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}