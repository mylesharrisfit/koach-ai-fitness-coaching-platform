import React, { useMemo, useState } from 'react';
import { Copy, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CATEGORY_ICONS = {
  Proteins: '🥩',
  Carbs: '🍚',
  Vegetables: '🥦',
  Fruits: '🍎',
  Dairy: '🥛',
  Fats: '🥑',
  Condiments: '🧂',
};

function categorizeFood(name) {
  const n = (name || '').toLowerCase();
  if (n.match(/chicken|beef|turkey|fish|salmon|tuna|egg|protein|shrimp|pork|lamb/)) return 'Proteins';
  if (n.match(/rice|oat|bread|pasta|potato|quinoa|tortilla|corn/)) return 'Carbs';
  if (n.match(/broccoli|spinach|kale|asparagus|zucchini|pepper|onion|lettuce|tomato/)) return 'Vegetables';
  if (n.match(/apple|banana|berry|mango|orange|fruit/)) return 'Fruits';
  if (n.match(/milk|yogurt|cheese|dairy|whey/)) return 'Dairy';
  if (n.match(/almond|walnut|avocado|olive oil|peanut|butter|oil|nut/)) return 'Fats';
  return 'Condiments';
}

export default function ShoppingListTab({ plan }) {
  const [copied, setCopied] = useState(false);

  const groupedItems = useMemo(() => {
    const allFoods = (plan.meals || []).flatMap(m => m.foods || []);
    const groups = {};
    allFoods.forEach(f => {
      if (!f.food_name) return;
      const cat = categorizeFood(f.food_name);
      if (!groups[cat]) groups[cat] = [];
      // Deduplicate by name
      const existing = groups[cat].find(x => x.name.toLowerCase() === f.food_name.toLowerCase());
      if (existing) {
        existing.count++;
      } else {
        groups[cat].push({ name: f.food_name, portion: f.portion, count: 1 });
      }
    });
    return groups;
  }, [plan]);

  const allCategories = Object.keys(CATEGORY_ICONS);
  const hasItems = Object.keys(groupedItems).length > 0;

  function buildListText() {
    return allCategories
      .filter(cat => groupedItems[cat]?.length)
      .map(cat => `${cat.toUpperCase()}\n${groupedItems[cat].map(i => `• ${i.name}${i.portion ? ` — ${i.portion}` : ''}${i.count > 1 ? ` (×${i.count})` : ''}`).join('\n')}`)
      .join('\n\n');
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildListText());
    setCopied(true);
    toast.success('Shopping list copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Auto-generated from all foods in the meal plan.</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={handleCopy}>
            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy List'}
          </Button>
          <Button size="sm" className="gap-1.5 text-xs h-7" onClick={() => toast.info('Send to client feature coming soon')}>
            <Send className="w-3 h-3" /> Send to Client
          </Button>
        </div>
      </div>

      {!hasItems ? (
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-2xl mb-2">🛒</p>
          <p className="text-sm font-medium">No food items in this plan yet</p>
          <p className="text-xs mt-1">Add foods to meals to generate a shopping list</p>
        </div>
      ) : (
        allCategories
          .filter(cat => groupedItems[cat]?.length > 0)
          .map(cat => (
            <div key={cat}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                <span>{CATEGORY_ICONS[cat]}</span> {cat}
              </h4>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {groupedItems[cat].map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-muted last:border-0">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-border accent-primary" />
                      <span className="text-sm text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.portion && <span>{item.portion}</span>}
                      {item.count > 1 && <span className="font-semibold text-primary">×{item.count}/wk</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}