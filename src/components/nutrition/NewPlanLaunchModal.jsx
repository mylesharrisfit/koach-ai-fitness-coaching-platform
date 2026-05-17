import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, PenLine, Zap, Clock } from 'lucide-react';

export default function NewPlanLaunchModal({ open, onOpenChange, onSelectAI, onSelectManual }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Close */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[#E7EAF3]">
          <h2 className="text-xl font-heading font-bold text-foreground">Create Nutrition Plan</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose how you want to build this plan</p>
        </div>

        {/* Options */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* AI Build */}
          <button
            onClick={onSelectAI}
            className="group relative flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50 hover:border-primary hover:shadow-lg transition-all duration-200 text-left overflow-hidden"
          >
            {/* Glow accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
            
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-md shadow-primary/30 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-heading font-bold text-foreground text-base">Build with AI</p>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-primary/10 text-primary uppercase tracking-wider">Recommended</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Describe your client — AI generates a full, personalized meal plan with macros, meals, shopping list & supplements in seconds.
              </p>
            </div>

            <div className="relative flex flex-wrap gap-1.5 mt-1">
              {['Full Meal Plan', 'Auto Macros', 'Shopping List', 'Supplements'].map(tag => (
                <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{tag}</span>
              ))}
            </div>

            <div className="relative flex items-center gap-1.5 text-[11px] text-primary font-semibold mt-1">
              <Zap className="w-3 h-3" /> Ready in ~15 seconds
            </div>
          </button>

          {/* Manual Build */}
          <button
            onClick={onSelectManual}
            className="group relative flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-[#E7EAF3] bg-white hover:border-foreground/20 hover:shadow-lg transition-all duration-200 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/80 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />

            <div className="relative w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center shadow-md flex-shrink-0">
              <PenLine className="w-5 h-5 text-white" />
            </div>

            <div className="relative">
              <p className="font-heading font-bold text-foreground text-base mb-1">Build Manually</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Create a plan from scratch with full control. Set your own macros, build each meal, add foods, and customize every detail.
              </p>
            </div>

            <div className="relative flex flex-wrap gap-1.5 mt-1">
              {['Full Control', 'Custom Macros', 'Habit Mode', 'Templates'].map(tag => (
                <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{tag}</span>
              ))}
            </div>

            <div className="relative flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold mt-1">
              <Clock className="w-3 h-3" /> Full editing control
            </div>
          </button>
        </div>

        {/* Footer hint */}
        <div className="px-6 pb-5">
          <p className="text-center text-xs text-muted-foreground">
            You can always edit or adjust the plan after it's created
          </p>
        </div>
      </motion.div>
    </div>
  );
}