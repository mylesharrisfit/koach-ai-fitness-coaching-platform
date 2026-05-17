import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ClipboardList, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const OPTIONS = [
  {
    id: 'ai',
    icon: Sparkles,
    iconBg: 'bg-gradient-to-br from-blue-500 to-purple-600',
    iconColor: 'text-white',
    title: 'AI Plan Builder',
    description: 'Answer a few questions and let AI generate a fully personalized plan in seconds',
    badge: 'Recommended',
  },
  {
    id: 'manual',
    icon: ClipboardList,
    iconBg: 'bg-secondary',
    iconColor: 'text-muted-foreground',
    title: 'Build Manually',
    description: 'Create your plan from scratch with full control over meals, macros, and structure',
    badge: null,
  },
];

export default function NewPlanLaunchModal({ open, onOpenChange, onSelectAI, onSelectManual }) {
  const [selected, setSelected] = useState(null);

  function handleSelect(id) {
    setSelected(id);
    setTimeout(() => {
      setSelected(null);
      if (id === 'ai') onSelectAI?.();
      else onSelectManual?.();
    }, 150);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="px-7 pt-7 pb-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold tracking-tight">
              Create a Nutrition Plan
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Choose how you'd like to get started
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid grid-cols-2 gap-4 px-7 py-4">
          {OPTIONS.map((opt, i) => {
            const Icon = opt.icon;
            const isSelected = selected === opt.id;
            return (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.07 }}
                onClick={() => handleSelect(opt.id)}
                className={cn(
                  'relative flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer',
                  'hover:shadow-md',
                  isSelected
                    ? 'border-primary bg-accent/60 shadow-md'
                    : 'border-border bg-white hover:border-primary/40 hover:bg-accent/30'
                )}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}

                {/* Icon */}
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', opt.iconBg)}>
                  <Icon className={cn('w-5 h-5', opt.iconColor)} />
                </div>

                {/* Text */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">{opt.title}</span>
                    {opt.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{opt.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="px-7 pb-6 pt-1 text-center">
          <p className="text-[11px] text-muted-foreground">You can switch modes at any time</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}