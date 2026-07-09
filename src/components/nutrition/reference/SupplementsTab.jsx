import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bookmark } from 'lucide-react';
import {
  SUPPLEMENTS, SUPPLEMENT_CATEGORIES,
  SUPPLEMENT_RATING_COLORS, SUPPLEMENT_CATEGORY_COLORS
} from '@/lib/nutritionReferenceData';
import RefSearchBar from './RefSearchBar';
import RefFilterChips from './RefFilterChips';

function SupplementCard({ item, isPortal }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const catColor = SUPPLEMENT_CATEGORY_COLORS[item.category] || { bg: 'bg-muted', text: 'text-muted-foreground' };
  const ratingColor = SUPPLEMENT_RATING_COLORS[item.rating] || { bg: 'bg-muted', text: 'text-muted-foreground' };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3.5 flex items-start gap-3 text-left hover:bg-muted transition-colors"
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
          <p className="font-bold text-sm text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{item.dose}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPortal && (
            <button
              onClick={e => { e.stopPropagation(); setSaved(v => !v); }}
              className={`p-1.5 rounded-lg transition-colors ${saved ? 'text-primary bg-accent' : 'text-border hover:text-muted-foreground'}`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} />
            </button>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-border" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="border-t border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">What it does</p>
                <p className="text-sm text-foreground leading-relaxed">{item.what_it_does}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Best time</p>
                  <p className="text-xs text-foreground">{item.timing}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Best for</p>
                  <p className="text-xs text-foreground">{item.best_for}</p>
                </div>
              </div>
              {item.stack_with?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-success uppercase tracking-wide mb-1">✅ Stack well with</p>
                  <div className="flex flex-wrap gap-1">
                    {item.stack_with.map(s => (
                      <span key={s} className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full border border-success">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {item.avoid_with?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-destructive uppercase tracking-wide mb-1">⚠️ Avoid with</p>
                  <div className="flex flex-wrap gap-1">
                    {item.avoid_with.map(s => (
                      <span key={s} className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full border border-destructive">{s}</span>
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
      <div className="bg-warning/10 border border-warning rounded-xl px-4 py-2.5 text-xs text-warning">
        ⚠️ Always consult your coach or physician before starting new supplements.
      </div>
      <RefSearchBar value={search} onChange={setSearch} placeholder="Search supplements..." />
      <RefFilterChips options={SUPPLEMENT_CATEGORIES} active={category} onChange={setCategory} />
      <p className="text-xs text-muted-foreground">{filtered.length} supplements</p>
      <div className="space-y-2">
        {filtered.map(item => (
          <SupplementCard key={item.id} item={item} isPortal={isPortal} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">No supplements match your search.</p>
        )}
      </div>
    </div>
  );
}