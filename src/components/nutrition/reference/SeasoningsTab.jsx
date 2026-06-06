import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bookmark } from 'lucide-react';
import {
  SEASONINGS, SEASONING_CUISINES, SEASONING_CUISINE_COLORS
} from '@/lib/nutritionReferenceData';
import RefSearchBar from './RefSearchBar';
import RefFilterChips from './RefFilterChips';

function SeasoningCard({ item, isPortal }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const cuisineColor = SEASONING_CUISINE_COLORS[item.cuisine] || { bg: 'bg-slate-100', text: 'text-slate-600' };

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3.5 flex items-start gap-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cuisineColor.bg} ${cuisineColor.text}`}>
              {item.cuisine}
            </span>
          </div>
          <p className="font-bold text-sm text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{item.flavor}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPortal && (
            <button
              onClick={e => { e.stopPropagation(); setSaved(v => !v); }}
              className={`p-1.5 rounded-lg transition-colors ${saved ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-slate-500'}`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} />
            </button>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-slate-300" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">🥩 Best proteins</p>
                  <div className="space-y-0.5">
                    {item.best_proteins.slice(0, 4).map(p => (
                      <p key={p} className="text-xs text-slate-700">• {p}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">🌾 Best carbs</p>
                  <div className="space-y-0.5">
                    {item.best_carbs.slice(0, 4).map(c => (
                      <p key={c} className="text-xs text-slate-700">• {c}</p>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">💡 Recipe ideas</p>
                <div className="space-y-0.5">
                  {item.recipe_ideas.map(r => (
                    <p key={r} className="text-xs text-slate-700">• {r}</p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">✅ Pairs well with</p>
                <div className="flex flex-wrap gap-1">
                  {item.pairs_with.map(p => (
                    <span key={p} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SeasoningsTab({ isPortal = false }) {
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('All');

  const filtered = useMemo(() => {
    return SEASONINGS.filter(s => {
      const matchCuisine = cuisine === 'All' || s.cuisine === cuisine;
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.flavor.toLowerCase().includes(search.toLowerCase()) ||
        s.best_proteins.join(' ').toLowerCase().includes(search.toLowerCase());
      return matchCuisine && matchSearch;
    });
  }, [search, cuisine]);

  return (
    <div className="space-y-3">
      <RefSearchBar value={search} onChange={setSearch} placeholder="Search seasonings..." />
      <RefFilterChips options={SEASONING_CUISINES} active={cuisine} onChange={setCuisine} />
      <p className="text-xs text-slate-400">{filtered.length} seasonings</p>
      <div className="space-y-2">
        {filtered.map(item => (
          <SeasoningCard key={item.id} item={item} isPortal={isPortal} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">No seasonings match your search.</p>
        )}
      </div>
    </div>
  );
}