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

  const cuisineColor = SEASONING_CUISINE_COLORS[item.cuisine] || { bg: 'bg-muted', text: 'text-muted-foreground' };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3.5 flex items-start gap-3 text-left hover:bg-muted transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cuisineColor.bg} ${cuisineColor.text}`}>
              {item.cuisine}
            </span>
          </div>
          <p className="font-bold text-sm text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{item.flavor}</p>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">🥩 Best proteins</p>
                  <div className="space-y-0.5">
                    {item.best_proteins.slice(0, 4).map(p => (
                      <p key={p} className="text-xs text-foreground">• {p}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">🌾 Best carbs</p>
                  <div className="space-y-0.5">
                    {item.best_carbs.slice(0, 4).map(c => (
                      <p key={c} className="text-xs text-foreground">• {c}</p>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">💡 Recipe ideas</p>
                <div className="space-y-0.5">
                  {item.recipe_ideas.map(r => (
                    <p key={r} className="text-xs text-foreground">• {r}</p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-success uppercase tracking-wide mb-1">✅ Pairs well with</p>
                <div className="flex flex-wrap gap-1">
                  {item.pairs_with.map(p => (
                    <span key={p} className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full border border-success">{p}</span>
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
      <p className="text-xs text-muted-foreground">{filtered.length} seasonings</p>
      <div className="space-y-2">
        {filtered.map(item => (
          <SeasoningCard key={item.id} item={item} isPortal={isPortal} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">No seasonings match your search.</p>
        )}
      </div>
    </div>
  );
}