import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { LogOut } from 'lucide-react';

export default function SignOutModal({ onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onCancel}>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm mx-4 mb-8 p-6 rounded-3xl"
        style={{ background: '#131928', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(239,68,68,0.15)' }}>
          <LogOut className="w-5 h-5 text-red-400" />
        </div>
        <h3 className="text-white font-bold text-lg text-center mb-1">Sign Out?</h3>
        <p className="text-white/40 text-sm text-center mb-6">You'll need to log back in to access your coaching dashboard.</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-sm text-white/60"
            style={{ background: 'rgba(255,255,255,0.07)' }}>Cancel</button>
          <button onClick={() => base44.auth.logout()}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white"
            style={{ background: 'rgba(239,68,68,0.7)' }}>Sign Out</button>
        </div>
      </motion.div>
    </motion.div>
  );
}