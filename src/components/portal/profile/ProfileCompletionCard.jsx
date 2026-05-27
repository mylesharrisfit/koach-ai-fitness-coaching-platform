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
        className="mx-5 mt-3 mb-0 p-4 rounded-2xl relative bg-white"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
        <button onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <p className="text-slate-900 font-black text-sm mb-0.5">Complete your profile</p>
        <p className="text-slate-400 text-[10px] mb-3">Get the most out of KOACH AI</p>
        {/* Progress bar */}
        <div className="h-2 rounded-full mb-3 bg-slate-100">
          <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }} />
        </div>
        <div className="space-y-1.5">
          {items.filter(i => !i.done).map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0" />
              <p className="text-slate-500 text-xs">{item.label}</p>
            </div>
          ))}
        </div>
        <p className="text-blue-600 text-[10px] mt-2 font-bold">{pct}% complete</p>
      </motion.div>
    </AnimatePresence>
  );
}