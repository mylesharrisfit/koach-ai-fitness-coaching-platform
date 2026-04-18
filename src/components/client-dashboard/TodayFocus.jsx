import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TodayFocus({ tasks = [], onChange }) {
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState('');

  const toggle = (idx) => {
    const updated = tasks.map((t, i) => i === idx ? { ...t, done: !t.done } : t);
    onChange(updated);
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    onChange([...tasks, { text: newTask.trim(), done: false }]);
    setNewTask('');
    setAdding(false);
  };

  const remove = (idx) => onChange(tasks.filter((_, i) => i !== idx));

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-semibold">Today's Focus</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tasks.filter(t => t.done).length}/{tasks.length} done
          </p>
        </div>
        {tasks.length < 3 && (
          <button
            onClick={() => setAdding(true)}
            className="w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {tasks.length === 0 && !adding && (
          <button onClick={() => setAdding(true)} className="w-full py-3 text-sm text-muted-foreground border border-dashed border-border rounded-xl hover:border-primary/40 hover:text-primary transition-colors">
            + Add up to 3 focus tasks
          </button>
        )}
        {tasks.map((task, idx) => (
          <div key={idx} className={cn(
            "flex items-center gap-3 p-3 rounded-xl transition-all group",
            task.done ? "bg-secondary/30" : "bg-secondary/10 hover:bg-secondary/20"
          )}>
            <button
              onClick={() => toggle(idx)}
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                task.done ? "bg-primary border-primary" : "border-border hover:border-primary"
              )}
            >
              {task.done && <Check className="w-3 h-3 text-primary-foreground" />}
            </button>
            <span className={cn("flex-1 text-sm", task.done && "line-through text-muted-foreground")}>{task.text}</span>
            <button onClick={() => remove(idx)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {adding && (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setAdding(false); }}
              placeholder="What's one thing to focus on?"
              className="flex-1 text-sm bg-secondary/30 border border-border rounded-xl px-3 py-2 outline-none focus:border-primary transition-colors"
            />
            <button onClick={addTask} className="text-xs text-primary font-medium px-3 py-2 rounded-xl hover:bg-primary/10 transition-colors">Add</button>
            <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground px-2 py-2 rounded-xl hover:bg-secondary/30 transition-colors">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}