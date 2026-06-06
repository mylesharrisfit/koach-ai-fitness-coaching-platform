import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bookmark, ChefHat } from 'lucide-react';
import {
  SAUCES, SAUCE_TIERS, SAUCE_TIER_COLORS
} from '@/lib/nutritionReferenceData';
import RefSearchBar from './RefSearchBar';
import RefFilterChips from './RefFilterChips';

function SauceCard({ item, isPortal }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const tierColor = SAUCE_TIER_COLORS[item.tier] || { bg: 'bg-slate-100', text: 'text-slate-600' };

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3.5 flex items-start gap-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierColor.bg} ${tierColor.text}`}>
              {item.tier}
            </span>
            {item.recipe && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-0.5">
                <ChefHat className="w-2.5 h-2.5" /> DIY
              </span>
            )}
          </div>
          <p className="font-bold text-sm text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{item.calories} cal {item.serving} · {item.macros}</p>
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
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Flavor profile</p>
                <div className="flex flex-wrap gap-1">
                  {item.flavor.map(f => (
                    <span key={f} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Best used with</p>
                <div className="flex flex-wrap gap-1">
                  {item.best_with.map(b => (
                    <span key={b} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{b}</span>
                  ))}
                </div>
              </div>
              {item.recipe && (
                <div>
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-1">👨‍🍳 How to make</p>
                  <p className="text-xs text-slate-700 leading-relaxed bg-purple-50 rounded-lg p-3">{item.recipe}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SaucesTab({ isPortal = false }) {
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('All');

  const filtered = useMemo(() => {
    return SAUCES.filter(s => {
      const matchTier = tier === 'All' || s.tier === tier;
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.flavor.join(' ').toLowerCase().includes(search.toLowerCase()) ||
        s.best_with.join(' ').toLowerCase().includes(search.toLowerCase());
      return matchTier && matchSearch;
    });
  }, [search, tier]);

  return (
    <div className="space-y-3">
      <RefSearchBar value={search} onChange={setSearch} placeholder="Search sauces..." />
      <RefFilterChips options={SAUCE_TIERS} active={tier} onChange={setTier} />
      <p className="text-xs text-slate-400">{filtered.length} sauces</p>
      <div className="space-y-2">
        {filtered.map(item => (
          <SauceCard key={item.id} item={item} isPortal={isPortal} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">No sauces match your search.</p>
        )}
      </div>
    </div>
  );
}