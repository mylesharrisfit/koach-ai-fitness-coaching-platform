import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DailyTasks({ tasks, onToggle }) {
  const done = tasks.filter(t => t.completed);
  const pending = tasks.filter(t => !t.completed);

  return (
    <div className="mx-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white font-bold text-base">Today's Tasks</p>
        <span className="text-white/40 text-xs font-semibold">{done.length} of {tasks.length} complete</span>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {[...pending, ...done].map((task) => (
            <motion.button
              key={task.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              onClick={() => onToggle(task.id)}
              className={cn('w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left',
                task.completed ? 'opacity-50' : '')}
              style={{
                background: task.completed ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${task.completed ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)'}`,
              }}>
              <motion.div
                initial={false}
                animate={{ scale: task.completed ? [1.2, 1] : 1 }}
                transition={{ duration: 0.2 }}>
                {task.completed
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  : <Circle className="w-5 h-5 text-white/20 flex-shrink-0" />}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold', task.completed ? 'text-white/30 line-through' : 'text-white')}>
                  {task.emoji} {task.label}
                </p>
                {task.sublabel && !task.completed && (
                  <p className="text-[10px] text-white/30 mt-0.5">{task.sublabel}</p>
                )}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}