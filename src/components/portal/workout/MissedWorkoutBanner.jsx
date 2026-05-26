import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function MissedWorkoutBanner({ workoutName, onDoNow, onSkip }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        className="mx-4 p-4 rounded-2xl"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">😅</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Missed yesterday's workout</p>
            <p className="text-white/50 text-xs mt-0.5">Want to make up <span className="text-white/70">{workoutName}</span>?</p>
            <div className="flex gap-2 mt-3">
              <button onClick={onDoNow}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
                Do it now
              </button>
              <button onClick={() => { setVisible(false); onSkip?.(); }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white/40"
                style={{ background: 'rgba(255,255,255,0.07)' }}>
                Skip it
              </button>
            </div>
          </div>
          <button onClick={() => setVisible(false)} className="text-white/20 hover:text-white/40">
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}