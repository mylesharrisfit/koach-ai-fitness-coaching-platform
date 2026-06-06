import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bookmark, Star } from 'lucide-react';
import {
  SUPPLEMENTS, SUPPLEMENT_CATEGORIES,
  SUPPLEMENT_RATING_COLORS, SUPPLEMENT_CATEGORY_COLORS
} from '@/lib/nutritionReferenceData';
import RefSearchBar from './RefSearchBar';
import RefFilterChips from './RefFilterChips';

function SupplementCard({ item, isPortal }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const catColor = SUPPLEMENT_CATEGORY_COLORS[item.category] || { bg: 'bg-slate-100', text: 'text-slate-600' };
  const ratingColor = SUPPLEMENT_RATING_COLORS[item.rating] || { bg: 'bg-slate-100', text: 'text-slate-600' };

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3.5 flex items-start gap-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catColor.bg} ${catColor.text}`}>
              {item.category}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ratingColor.bg} ${ratingColor.text}`}>
              {item.rating}
            </span>
          </div>
          <p className="font-bold text-sm text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{item.dose}</p>
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">What it does</p>
                <p className="text-sm text-slate-700 leading-relaxed">{item.what_it_does}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Best time</p>
                  <p className="text-xs text-slate-700">{item.timing}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Best for</p>
                  <p className="text-xs text-slate-700">{item.best_for}</p>
                </div>
              </div>
              {item.stack_with?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">✅ Stack well with</p>
                  <div className="flex flex-wrap gap-1">
                    {item.stack_with.map(s => (
                      <span key={s} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {item.avoid_with?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">⚠️ Avoid with</p>
                  <div className="flex flex-wrap gap-1">
                    {item.avoid_with.map(s => (
                      <span key={s} className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SupplementsTab({ isPortal = false }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    return SUPPLEMENTS.filter(s => {
      const matchCat = category === 'All' || s.category === category;
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.what_it_does.toLowerCase().includes(search.toLowerCase()) ||
        s.best_for.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, category]);

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-xs text-amber-700">
        ⚠️ Always consult your coach or physician before starting new supplements.
      </div>
      <RefSearchBar value={search} onChange={setSearch} placeholder="Search supplements..." />
      <RefFilterChips options={SUPPLEMENT_CATEGORIES} active={category} onChange={setCategory} />
      <p className="text-xs text-slate-400">{filtered.length} supplements</p>
      <div className="space-y-2">
        {filtered.map(item => (
          <SupplementCard key={item.id} item={item} isPortal={isPortal} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">No supplements match your search.</p>
        )}
      </div>
    </div>
  );
}