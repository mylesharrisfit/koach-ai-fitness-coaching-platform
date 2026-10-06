import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Pill } from 'lucide-react';
import { groupSupplements } from '@/lib/supplements';

function StackSection({ title, emoji, items, badgeColor }) {
  return (
    <div className="mb-3">
      <p className={`text-xs font-bold uppercase tracking-wide mb-2`}>
        {emoji} {title}
      </p>
      {items.map(item => (
        <div key={`${title}-${item.name}`} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
            <Pill className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-foreground font-bold text-sm">{item.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{title}</span>
            </div>
            <p className="text-muted-foreground text-xs mt-0.5">{item.dose}</p>
            <p className="text-muted-foreground text-xs mt-0.5 italic">{item.why}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SupplementStack({ customSupplements }) {
  const [open, setOpen] = useState(false);
  const groups = groupSupplements(customSupplements);
  if (groups.length === 0) return null; // nothing prescribed → no card
  const count = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="mx-4 mb-3 bg-card rounded-[18px] overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgb(var(--muted))' }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-4 flex items-center gap-3 active:bg-muted transition-colors">
        <span className="text-xl">💊</span>
        <div className="flex-1 text-left">
          <p className="text-foreground font-bold text-sm">Supplement Stack</p>
          <p className="text-muted-foreground text-xs mt-0.5">{count} from your coach</p>
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

            <div className="mt-3" />
            {groups.map((g) => (
              <StackSection key={g.key} title={g.title} emoji={g.emoji} items={g.items}
                badgeColor="bg-accent text-primary" />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}