import React from 'react';
import { motion } from 'framer-motion';
import { differenceInHours, parseISO } from 'date-fns';

export default function CoachMessageCard({ message, coachName, onReply }) {
  if (!message) return null;
  const hoursAgo = differenceInHours(new Date(), parseISO(message.created_date));
  if (hoursAgo > 24) return null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className="mx-5 p-4 rounded-2xl relative overflow-hidden"
      style={{
        background: 'rgba(59,130,246,0.08)',
        border: '1.5px solid rgba(59,130,246,0.35)',
        boxShadow: '0 0 20px rgba(59,130,246,0.12)',
      }}>
      {/* Pulsing border effect */}
      <div className="absolute inset-0 rounded-2xl animate-pulse pointer-events-none"
        style={{ boxShadow: '0 0 0 1px rgba(59,130,246,0.3)', animationDuration: '2s' }} />

      <div className="flex items-center gap-3 mb-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {coachName?.[0]?.toUpperCase() || 'C'}
        </div>
        <div>
          <p className="text-white font-semibold text-xs">{coachName || 'Your Coach'}</p>
          <p className="text-primary text-[10px]">{hoursAgo === 0 ? 'Just now' : `${hoursAgo}h ago`}</p>
        </div>
      </div>
      <p className="text-white/70 text-sm leading-relaxed mb-3 line-clamp-3">{message.content}</p>
      <button onClick={onReply}
        className="px-4 py-2 rounded-xl text-xs font-bold text-white"
        style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary)))' }}>
        Reply →
      </button>
    </motion.div>
  );
}