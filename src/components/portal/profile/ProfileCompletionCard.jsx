import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function ProfileCompletionCard({ client, user }) {
  const [dismissed, setDismissed] = useState(false);

  const items = [
    { id: 'photo', label: 'Add profile photo', done: !!client?.avatar_url },
    { id: 'weight', label: 'Set goal weight', done: !!client?.target_weight },
    { id: 'health', label: 'Connect Apple Health', done: false },
    { id: 'notifs', label: 'Set notification preferences', done: false },
  ];

  const done = items.filter(i => i.done).length;
  const pct = Math.round((done / items.length) * 100);

  if (pct === 100 || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
        className="mx-5 mt-3 mb-0 p-4 rounded-2xl relative"
        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <button onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-white/25 hover:text-white/50">
          <X className="w-4 h-4" />
        </button>
        <p className="text-blue-300 font-bold text-sm mb-0.5">Complete your profile</p>
        <p className="text-white/30 text-[10px] mb-3">Get the most out of KOACH AI</p>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #3B82F6, #6366F1)' }} />
        </div>
        <div className="space-y-1.5">
          {items.filter(i => !i.done).map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
              <p className="text-white/50 text-xs">{item.label}</p>
            </div>
          ))}
        </div>
        <p className="text-blue-400 text-[10px] mt-2 font-semibold">{pct}% complete</p>
      </motion.div>
    </AnimatePresence>
  );
}