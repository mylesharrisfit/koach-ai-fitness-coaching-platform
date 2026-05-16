import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Edit3, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import AIBuilder from './builder/AIBuilder';
import ManualBuilder from './builder/ManualBuilder';

const ModeCard = ({ icon: Icon, title, description, onClick }) => (
  <motion.button
    onClick={onClick}
    className="flex flex-col gap-3 p-6 border-2 border-border rounded-2xl hover:border-primary hover:bg-accent transition-all text-left group"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="flex items-start justify-between">
      <Icon className="w-8 h-8 text-primary" />
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
    </div>
    <div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  </motion.button>
);

export default function ProgramCreationModal({ open, onOpenChange, onProgramCreated }) {
  const [mode, setMode] = useState(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <AnimatePresence mode="wait">
          {!mode ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl">Create New Program</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <ModeCard
                  icon={Zap}
                  title="🤖 Build with AI"
                  description="Describe your client and AI generates a complete program in seconds"
                  onClick={() => setMode('ai')}
                />
                <ModeCard
                  icon={Edit3}
                  title="✏️ Build Manually"
                  description="Create a program from scratch with full control over every detail"
                  onClick={() => setMode('manual')}
                />
              </div>
            </motion.div>
          ) : mode === 'ai' ? (
            <AIBuilder
              onBack={() => setMode(null)}
              onProgramCreated={(program) => {
                onProgramCreated(program);
                onOpenChange(false);
              }}
            />
          ) : (
            <ManualBuilder
              onBack={() => setMode(null)}
              onProgramCreated={(program) => {
                onProgramCreated(program);
                onOpenChange(false);
              }}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}