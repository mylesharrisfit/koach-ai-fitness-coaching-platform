import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, ArrowDown } from 'lucide-react';

export default function AddToHomeScreenPrompt({ isOpen, onDismiss, isIOS }) {
  if (!isOpen || !isIOS) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        className="fixed inset-0 z-40"
        style={{ background: 'color-mix(in srgb, black 40%, transparent)' }} />

      <motion.div
        initial={{ y: 400, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 w-full"
        onClick={e => e.stopPropagation()}>
        <div className="w-full bg-card rounded-t-[28px] pt-8 pb-8 px-5 shadow-2xl">

          <button onClick={onDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--tc-muted)' }}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <h2 className="text-foreground text-2xl font-black text-center mb-2">
            Get the KOACH AI App
          </h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            Add to home screen for quick access and notifications
          </p>

          {/* Step 1 */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-5 p-4 rounded-2xl"
            style={{ background: 'var(--tc-muted)', border: '1px solid var(--tc-muted)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-white"
                style={{ background: 'var(--tc-primary)' }}>1</div>
              <div>
                <p className="font-bold text-foreground">Tap the Share Button</p>
                <p className="text-muted-foreground text-sm mt-1">Look for the <Share2 className="w-3.5 h-3.5 inline" /> icon at the bottom of Safari</p>
              </div>
            </div>
          </motion.div>

          {/* Arrow */}
          <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="flex justify-center mb-2">
            <ArrowDown className="w-5 h-5 text-border" />
          </motion.div>

          {/* Step 2 */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mb-5 p-4 rounded-2xl"
            style={{ background: 'var(--tc-muted)', border: '1px solid var(--tc-muted)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-white"
                style={{ background: 'var(--tc-primary)' }}>2</div>
              <div>
                <p className="font-bold text-foreground">Tap "Add to Home Screen"</p>
                <p className="text-muted-foreground text-sm mt-1">Scroll down and find this option in the menu</p>
              </div>
            </div>
          </motion.div>

          {/* Arrow */}
          <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="flex justify-center mb-2">
            <ArrowDown className="w-5 h-5 text-border" />
          </motion.div>

          {/* Step 3 */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mb-6 p-4 rounded-2xl"
            style={{ background: 'var(--tc-muted)', border: '1px solid var(--tc-muted)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-white"
                style={{ background: 'var(--tc-primary)' }}>3</div>
              <div>
                <p className="font-bold text-foreground">Tap "Add"</p>
                <p className="text-muted-foreground text-sm mt-1">KOACH AI will appear on your home screen instantly</p>
              </div>
            </div>
          </motion.div>

          <button onClick={onDismiss}
            className="w-full py-4 rounded-xl font-bold text-white text-base"
            style={{ background: 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))' }}>
            Got it!
          </button>

          <p className="text-center text-xs text-muted-foreground mt-3">
            You'll get push notifications after installing
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}