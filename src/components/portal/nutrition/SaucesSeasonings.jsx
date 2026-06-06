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
    <div className="mx-4 mb-3 bg-white rounded-[18px] overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
        <span className="text-xl">🧂</span>
        <div className="flex-1 text-left">
          <p className="text-slate-900 font-bold text-sm">Low-Calorie Sauces & Seasonings</p>
          <p className="text-slate-400 text-xs mt-0.5">Keep meals flavorful without blowing macros</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-slate-300" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="border-t border-slate-100 px-4 pb-4 overflow-hidden">

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-4 mb-2">🫙 Sauces</p>
            <div className="space-y-2">
              {SAUCES.map(s => (
                <div key={s.name} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-slate-800 text-xs font-semibold">{s.name}</p>
                    <p className="text-slate-400 text-[10px]">{s.note}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">{s.cal}</span>
                </div>
              ))}
            </div>

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-4 mb-2">🌿 Seasonings (0 calories — use freely)</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {SEASONINGS.map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                  <p className="text-slate-600 text-xs">{s}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}