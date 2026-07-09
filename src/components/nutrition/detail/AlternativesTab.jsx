import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';

const STATIC_FOOD_SWAPS = {
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
  Proteins:   { bg: 'bg-accent',    border: 'border-accent',    text: 'text-primary',    dot: 'var(--tc-primary)' },
  Carbs:      { bg: 'bg-orange-50',  border: 'border-orange-100',  text: 'text-orange-600',  dot: 'var(--kc-f97316)' },
  Fats:       { bg: 'bg-warning/10',  border: 'border-warning',  text: 'text-warning',  dot: 'var(--kc-ca8a04)' },
  Vegetables: { bg: 'bg-success/10', border: 'border-success', text: 'text-success', dot: 'var(--tc-success)' },
  Other:      { bg: 'bg-muted',    border: 'border-border',    text: 'text-muted-foreground',    dot: 'var(--tc-muted-foreground)' },
};

// Per-food swap suggestions for dynamic mode
const DYNAMIC_SWAPS = {
  chicken: ['Turkey breast', 'Tilapia fillet', 'Egg whites (3 large)', 'Greek yogurt (150g)'],
  turkey: ['Chicken breast', 'Lean ground beef', 'Tempeh (100g)'],
  beef: ['Lean ground turkey', 'Bison patty', 'Tofu (firm, 200g)'],
  salmon: ['Mackerel', 'Sardines', 'Tilapia + omega-3 supplement'],
  tuna: ['Salmon', 'Sardines', 'Chicken breast (100g)'],
  egg: ['Egg whites', 'Greek yogurt', 'Cottage cheese (100g)'],
  rice: ['Sweet potato (150g)', 'Oats (80g dry)', 'Quinoa (cooked 150g)'],
  oat: ['Cream of rice', 'Quinoa flakes', 'Buckwheat groats'],
  potato: ['White rice', 'Quinoa', 'Butternut squash'],
  bread: ['Ezekiel bread', 'Corn tortilla', 'Rice cakes'],
  pasta: ['Zucchini noodles', 'Shirataki noodles', 'Brown rice pasta'],
  almond: ['Walnuts (30g)', 'Avocado (50g)', 'Peanut butter (1 tbsp)'],
  avocado: ['Olive oil (1 tbsp)', 'Almonds (30g)', 'Sunflower seeds'],
  broccoli: ['Spinach', 'Asparagus', 'Zucchini'],
  spinach: ['Kale', 'Arugula', 'Swiss chard'],
};

function categorizeFood(name) {
  const n = (name || '').toLowerCase();
  if (n.match(/chicken|beef|turkey|fish|salmon|tuna|egg|protein|shrimp|pork|lamb|tempeh|tofu/)) return 'Proteins';
  if (n.match(/rice|oat|bread|pasta|potato|quinoa|tortilla|corn|grain/)) return 'Carbs';
  if (n.match(/broccoli|spinach|kale|asparagus|zucchini|pepper|onion|lettuce|tomato|vegetable/)) return 'Vegetables';
  if (n.match(/almond|walnut|avocado|olive oil|peanut|butter|oil|nut|fat|seed/)) return 'Fats';
  return 'Other';
}

function getSwapsForFood(name) {
  const lower = (name || '').toLowerCase();
  for (const [key, swaps] of Object.entries(DYNAMIC_SWAPS)) {
    if (lower.includes(key)) return swaps;
  }
  return ['Ask your coach for alternatives', 'Similar whole food with same macros'];
}

function MacroBadge({ cal, p, c, f }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <span className="text-muted-foreground">{cal} kcal</span>
      <span className="text-primary font-semibold">{p}g P</span>
      <span className="text-orange-500 font-semibold">{c}g C</span>
      <span className="text-warning font-semibold">{f}g F</span>
    </div>
  );
}

export default function AlternativesTab({ plan }) {
  // Extract unique foods from plan meals
  const planFoods = useMemo(() => {
    if (!plan?.meals?.length) return [];
    const seen = new Set();
    const foods = [];
    plan.meals.forEach(m => {
      (m.foods || []).forEach(f => {
        const name = f.food_name ?? f.name ?? '';
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          foods.push({ name, calories: f.calories ?? 0, protein: f.protein ?? 0, carbs: f.carbs ?? 0, fats: f.fats ?? 0, portion: f.portion ?? f.amount ?? '' });
        }
      });
    });
    return foods;
  }, [plan]);

  const isDynamic = planFoods.length > 0;

  if (isDynamic) {
    // Group plan foods by category
    const grouped = {};
    planFoods.forEach(food => {
      const cat = categorizeFood(food.name);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(food);
    });

    return (
      <div className="space-y-6 pb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/10 rounded-xl">
          <span className="text-sm">🍽️</span>
          <p className="text-xs font-semibold text-primary">Based on your meal plan foods</p>
        </div>

        {Object.entries(grouped).map(([category, foods]) => {
          const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
          return (
            <div key={category}>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${colors.text}`}>{category}</h4>
              <div className="space-y-3">
                {foods.map((food, fi) => {
                  const swaps = getSwapsForFood(food.name);
                  return (
                    <div key={fi} className={`${colors.bg} border ${colors.border} rounded-xl p-3.5`}>
                      <div className="mb-2">
                        <p className="text-sm font-bold text-foreground">{food.name}</p>
                        {food.portion && <p className="text-[11px] text-muted-foreground">{food.portion}</p>}
                        {(food.calories > 0 || food.protein > 0) && (
                          <MacroBadge cal={food.calories} p={food.protein} c={food.carbs} f={food.fats} />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                        <ArrowRight className="w-3 h-3" /> Can swap with:
                      </div>
                      <div className="space-y-1.5">
                        {swaps.map((alt, ai) => (
                          <div key={ai} className="flex items-center gap-2 bg-[var(--kc-w-70)] rounded-lg px-3 py-2">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colors.dot }} />
                            <span className="text-sm text-foreground">{alt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback to static list
  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 border border-border rounded-xl">
        <span className="text-sm">📖</span>
        <p className="text-xs font-semibold text-muted-foreground">General swap guide — add foods to meals for personalized suggestions</p>
      </div>

      {Object.entries(STATIC_FOOD_SWAPS).map(([category, swaps]) => {
        const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
        return (
          <div key={category}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${colors.text}`}>{category}</h4>
            <div className="space-y-3">
              {swaps.map((swap, si) => (
                <div key={si} className={`${colors.bg} border ${colors.border} rounded-xl p-3.5`}>
                  <div className="mb-2">
                    <p className="text-sm font-bold text-foreground">{swap.from}</p>
                    <MacroBadge {...swap.macros} />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                    <ArrowRight className="w-3 h-3" /> Can swap with:
                  </div>
                  <div className="space-y-2">
                    {swap.to.map((alt, ai) => (
                      <div key={ai} className="flex items-center justify-between bg-[var(--kc-w-70)] rounded-lg px-3 py-2">
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