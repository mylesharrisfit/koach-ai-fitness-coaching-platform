import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const SAUCES = [
  { name: 'Hot Sauce (Cholula / Tabasco)', cal: '~0 cal', note: 'Use freely on everything' },
  { name: 'Salsa (fresh or jarred)', cal: '~10 cal', note: 'Per 2 tbsp' },
  { name: 'Mustard (yellow or Dijon)', cal: '~5 cal', note: 'Per tsp' },
  { name: 'Lite Soy Sauce', cal: '~10 cal', note: 'Per tbsp' },
  { name: 'Coconut Aminos', cal: '~10 cal', note: 'Per tbsp' },
  { name: 'Sugar-Free Ketchup', cal: '~5 cal', note: 'Per tbsp' },
  { name: 'Lemon / Lime Juice', cal: '~5 cal', note: 'Squeeze freely' },
];

const SEASONINGS = [
  'Garlic powder', 'Onion powder', 'Smoked paprika', 'Cumin',
  'Chili powder', 'Oregano', 'Lemon pepper', 'Everything bagel seasoning',
  'Salt + black pepper', 'Cinnamon (great on oats & sweet potato)',
];

export default function SaucesSeasonings() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-4 mb-3 bg-card rounded-[18px] overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgb(var(--muted))' }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-4 flex items-center gap-3 active:bg-muted transition-colors">
        <span className="text-xl">🧂</span>
        <div className="flex-1 text-left">
          <p className="text-foreground font-bold text-sm">Low-Calorie Sauces & Seasonings</p>
          <p className="text-muted-foreground text-xs mt-0.5">Keep meals flavorful without blowing macros</p>
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

            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mt-4 mb-2">🫙 Sauces</p>
            <div className="space-y-2">
              {SAUCES.map(s => (
                <div key={s.name} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-foreground text-xs font-semibold">{s.name}</p>
                    <p className="text-muted-foreground text-[10px]">{s.note}</p>
                  </div>
                  <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full flex-shrink-0">{s.cal}</span>
                </div>
              ))}
            </div>

            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mt-4 mb-2">🌿 Seasonings (0 calories — use freely)</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {SEASONINGS.map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-border flex-shrink-0" />
                  <p className="text-muted-foreground text-xs">{s}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}