import React, { useState } from 'react';
import { Footprints, Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_ADDS = [1000, 2500, 5000];

export default function StepGoal({ steps = 0, goal = 10000, onChange }) {
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState('');
  const pct = Math.min(100, (steps / goal) * 100);
  const done = steps >= goal;
  const remaining = Math.max(0, goal - steps);

  const handleAdd = () => {
    const n = parseInt(input, 10);
    if (!isNaN(n) && n > 0) onChange(steps + n);
    setInput('');
    setAdding(false);
  };

  return (
    <div className={cn(
      'bg-card rounded-2xl border shadow-sm p-5',
      done ? 'border-success' : 'border-border'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            done ? 'bg-success/10' : 'bg-muted')}>
            {done
              ? <CheckCircle2 className="w-5 h-5 text-success" />
              : <Footprints className="w-5 h-5 text-muted-foreground" />
            }
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Daily Steps</p>
            <p className="text-xl font-bold text-foreground" style={{ letterSpacing: '-0.04em' }}>
              {steps.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">/ {goal.toLocaleString()}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          {done
            ? <span className="text-sm font-bold text-success bg-success/10 px-3 py-1.5 rounded-full border border-success">Goal met! 🎉</span>
            : <div>
                <p className="text-xl font-bold text-foreground" style={{ letterSpacing: '-0.04em' }}>{Math.round(pct)}%</p>
                <p className="text-xs text-muted-foreground">{remaining.toLocaleString()} left</p>
              </div>
          }
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className={cn('h-full rounded-full transition-all duration-700', done ? 'bg-success' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Quick add or input */}
      {adding ? (
        <div className="flex gap-2">
          <input
            autoFocus
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Steps to add..."
            className="flex-1 h-10 px-3 text-sm border border-border rounded-xl outline-none focus:border-primary text-foreground"
          />
          <button onClick={handleAdd} className="px-4 h-10 bg-sidebar text-white text-sm font-bold rounded-xl hover:bg-sidebar-accent transition-colors">Add</button>
          <button onClick={() => setAdding(false)} className="px-3 h-10 border border-border text-sm text-muted-foreground rounded-xl hover:bg-background transition-colors">✕</button>
        </div>
      ) : (
        <div className="flex gap-2">
          {QUICK_ADDS.map(n => (
            <button
              key={n}
              onClick={() => onChange(steps + n)}
              className="flex-1 h-9 rounded-xl border border-border text-xs font-semibold text-foreground hover:border-foreground hover:bg-background active:scale-95 transition-all"
            >
              +{n.toLocaleString()}
            </button>
          ))}
          <button
            onClick={() => setAdding(true)}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:border-foreground transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}