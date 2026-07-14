import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';

export default function NotificationPrompt({ isOpen, onEnable, onDismiss }) {
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        onEnable();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            className="fixed inset-0 z-40"
            style={{ background: 'color-mix(in srgb, black 35%, transparent)' }} />

          <motion.div
            initial={{ y: 400, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 w-full"
            onClick={e => e.stopPropagation()}>
            <div className="w-full bg-card rounded-t-[28px] pt-8 pb-8 px-5 shadow-2xl"
              style={{ boxShadow: '0 -8px 40px color-mix(in srgb, black 12%, transparent)' }}>

              {/* Close button */}
              <button onClick={onDismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--tc-muted)' }}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))' }}>
                <Bell className="w-8 h-8 text-white" />
              </div>

              {/* Headline */}
              <h2 className="text-foreground text-2xl font-black text-center mb-2">
                Stay on top of your coaching 🔔
              </h2>

              {/* Subheadline */}
              <p className="text-muted-foreground text-sm text-center mb-5">
                Get real-time updates about your training and progress
              </p>

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                {[
                  'Get notified when coach messages you',
                  'Never miss a check-in reminder',
                  'Celebrate achievements instantly',
                ].map((benefit, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--tc-accent)' }}>
                      <span className="text-primary font-black text-sm">✓</span>
                    </div>
                    <p className="text-foreground text-sm font-medium">{benefit}</p>
                  </motion.div>
                ))}
              </div>

              {/* Buttons */}
              <button onClick={handleEnable} disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-primary-foreground text-base mb-3 flex items-center justify-center gap-2 transition-all"
                style={{ background: 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))', opacity: loading ? 0.7 : 1 }}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Enabling...
                  </>
                ) : (
                  'Enable Notifications'
                )}
              </button>

              <button onClick={onDismiss}
                className="w-full py-3 text-primary font-bold text-sm text-center">
                Maybe Later
              </button>

              {/* Privacy note */}
              <p className="text-center text-xs text-muted-foreground mt-4">
                We'll never spam you. You can manage notifications anytime.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}