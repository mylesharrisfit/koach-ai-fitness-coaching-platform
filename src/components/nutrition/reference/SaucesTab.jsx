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

  const tierColor = SAUCE_TIER_COLORS[item.tier] || { bg: 'bg-muted', text: 'text-muted-foreground' };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3.5 flex items-start gap-3 text-left hover:bg-muted transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierColor.bg} ${tierColor.text}`}>
              {item.tier}
            </span>
            {item.recipe && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ai/10 text-ai flex items-center gap-0.5">
                <ChefHat className="w-2.5 h-2.5" /> DIY
              </span>
            )}
          </div>
          <p className="font-bold text-sm text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{item.calories} cal {item.serving} · {item.macros}</p>
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
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Flavor profile</p>
                <div className="flex flex-wrap gap-1">
                  {item.flavor.map(f => (
                    <span key={f} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Best used with</p>
                <div className="flex flex-wrap gap-1">
                  {item.best_with.map(b => (
                    <span key={b} className="text-[10px] bg-accent text-primary px-2 py-0.5 rounded-full border border-accent">{b}</span>
                  ))}
                </div>
              </div>
              {item.recipe && (
                <div>
                  <p className="text-[10px] font-bold text-ai uppercase tracking-wide mb-1">👨‍🍳 How to make</p>
                  <p className="text-xs text-foreground leading-relaxed bg-ai/10 rounded-lg p-3">{item.recipe}</p>
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
      <p className="text-xs text-muted-foreground">{filtered.length} sauces</p>
      <div className="space-y-2">
        {filtered.map(item => (
          <SauceCard key={item.id} item={item} isPortal={isPortal} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">No sauces match your search.</p>
        )}
      </div>
    </div>
  );
}