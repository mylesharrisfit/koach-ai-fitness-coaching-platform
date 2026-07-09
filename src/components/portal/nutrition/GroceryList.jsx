import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const PROTEIN_KEYWORDS = ['chicken', 'beef', 'steak', 'salmon', 'tuna', 'turkey', 'egg', 'shrimp', 'pork', 'tilapia', 'cod', 'protein', 'whey', 'greek yogurt', 'cottage cheese', 'tofu', 'tempeh', 'bison'];
const CARB_KEYWORDS = ['rice', 'oat', 'potato', 'bread', 'pasta', 'quinoa', 'wrap', 'tortilla', 'bagel', 'cereal', 'fruit', 'banana', 'apple', 'berry', 'blueberry', 'strawberry', 'mango'];
const PRODUCE_KEYWORDS = ['spinach', 'broccoli', 'lettuce', 'kale', 'pepper', 'tomato', 'cucumber', 'zucchini', 'onion', 'garlic', 'mushroom', 'carrot', 'celery', 'arugula', 'asparagus', 'green bean', 'avocado', 'lemon', 'lime'];
const SAUCE_KEYWORDS = ['sauce', 'salsa', 'mustard', 'ketchup', 'soy', 'aminos', 'oil', 'vinegar', 'dressing'];
const SUPPLEMENT_KEYWORDS = ['creatine', 'protein powder', 'fish oil', 'vitamin', 'magnesium', 'zinc', 'ashwagandha', 'supplement'];

function categorize(name) {
  const n = name.toLowerCase();
  if (SUPPLEMENT_KEYWORDS.some(k => n.includes(k))) return 'Supplements';
  if (SAUCE_KEYWORDS.some(k => n.includes(k))) return 'Sauces & Condiments';
  if (PROTEIN_KEYWORDS.some(k => n.includes(k))) return 'Proteins';
  if (CARB_KEYWORDS.some(k => n.includes(k))) return 'Carbs';
  if (PRODUCE_KEYWORDS.some(k => n.includes(k))) return 'Produce & Vegetables';
  return 'Other';
}

const CATEGORY_ORDER = ['Proteins', 'Carbs', 'Produce & Vegetables', 'Sauces & Condiments', 'Supplements', 'Other'];
const CATEGORY_EMOJI = { Proteins: '🥩', Carbs: '🌾', 'Produce & Vegetables': '🥦', 'Sauces & Condiments': '🫙', Supplements: '💊', Other: '🛒' };

export default function GroceryList({ nutritionPlan }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState({});
  const [copied, setCopied] = useState(false);

  const grouped = useMemo(() => {
    const allFoods = [];
    const meals = nutritionPlan?.meals || [];
    meals.forEach(meal => {
      (meal.foods || []).forEach(food => {
        const name = food.name || food.food_name || '';
        if (name) allFoods.push(name);
      });
    });
    // Deduplicate
    const unique = [...new Set(allFoods.map(f => f.trim()).filter(Boolean))];
    const cats = {};
    unique.forEach(name => {
      const cat = categorize(name);
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(name);
    });
    return cats;
  }, [nutritionPlan]);

  const totalItems = Object.values(grouped).flat().length;

  const handleCopy = () => {
    const lines = [];
    CATEGORY_ORDER.forEach(cat => {
      if (grouped[cat]?.length) {
        lines.push(`\n${CATEGORY_EMOJI[cat]} ${cat}`);
        grouped[cat].forEach(item => lines.push(`  • ${item}`));
      }
    });
    navigator.clipboard.writeText(lines.join('\n').trim());
    setCopied(true);
    toast.success('Grocery list copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-4 mb-3 bg-card rounded-[18px] overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgb(var(--muted))' }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-4 flex items-center gap-3 active:bg-muted transition-colors">
        <span className="text-xl">🛒</span>
        <div className="flex-1 text-left">
          <p className="text-foreground font-bold text-sm">Grocery List</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {totalItems > 0 ? `${totalItems} items from your meal plan` : 'Auto-generated from your meal plan'}
          </p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-border" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="border-t border-border px-4 pb-4 overflow-hidden">

            {totalItems === 0 ? (
              <p className="text-muted-foreground text-xs text-center py-6">No meal plan assigned yet. Ask your coach to assign a plan.</p>
            ) : (
              <>
                <button onClick={handleCopy}
                  className="mt-3 mb-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-primary border border-primary bg-accent active:opacity-70 transition-opacity">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy List'}
                </button>

                {CATEGORY_ORDER.map(cat => {
                  if (!grouped[cat]?.length) return null;
                  return (
                    <div key={cat} className="mb-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                        {CATEGORY_EMOJI[cat]} {cat}
                      </p>
                      <div className="space-y-1.5">
                        {grouped[cat].map(item => {
                          const key = `${cat}-${item}`;
                          return (
                            <button key={item} onClick={() => setChecked(p => ({ ...p, [key]: !p[key] }))}
                              className="w-full flex items-center gap-3 py-2 px-3 rounded-xl active:bg-muted transition-colors text-left">
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked[key] ? 'bg-success border-success' : 'border-border'}`}>
                                {checked[key] && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                              </div>
                              <span className={`text-xs font-medium transition-colors ${checked[key] ? 'line-through text-border' : 'text-foreground'}`}>
                                {item}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}