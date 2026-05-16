import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MESSAGES = [
  'Analyzing client profile...',
  'Building your program structure...',
  'Selecting optimal exercises...',
  'Applying progressive overload model...',
  'Finalizing your program...',
];

const AnimatedLogo = () => (
  <motion.div
    className="relative w-16 h-16 mx-auto mb-8"
    animate={{ scale: [1, 1.1, 1] }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary/50 opacity-20 blur-xl" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-2xl font-bold text-primary">K</div>
    </div>
  </motion.div>
);

export default function AIGeneratingStep() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(i => (i + 1) % MESSAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-64 gap-6"
    >
      <AnimatedLogo />
      
      <div className="text-center space-y-2">
        <h3 className="font-heading text-lg">Creating Your Program</h3>
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.4 }}
          className="text-muted-foreground text-sm"
        >
          {MESSAGES[messageIndex]}
        </motion.p>
      </div>

      <div className="flex gap-1.5">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.5,
              delay: i * 0.3,
              repeat: Infinity,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}