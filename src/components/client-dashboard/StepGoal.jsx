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
      'bg-white rounded-2xl border shadow-sm p-5',
      done ? 'border-[#BBF7D0]' : 'border-[#E5E7EB]'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            done ? 'bg-[#DCFCE7]' : 'bg-[#F3F4F6]')}>
            {done
              ? <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
              : <Footprints className="w-5 h-5 text-[#6B7280]" />
            }
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] font-medium">Daily Steps</p>
            <p className="text-xl font-bold text-[#111827]" style={{ letterSpacing: '-0.04em' }}>
              {steps.toLocaleString()}
              <span className="text-sm font-normal text-[#9CA3AF] ml-1">/ {goal.toLocaleString()}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          {done
            ? <span className="text-sm font-bold text-[#16A34A] bg-[#F0FDF4] px-3 py-1.5 rounded-full border border-[#BBF7D0]">Goal met! 🎉</span>
            : <div>
                <p className="text-xl font-bold text-[#111827]" style={{ letterSpacing: '-0.04em' }}>{Math.round(pct)}%</p>
                <p className="text-xs text-[#9CA3AF]">{remaining.toLocaleString()} left</p>
              </div>
          }
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-[#F3F4F6] rounded-full overflow-hidden mb-4">
        <div
          className={cn('h-full rounded-full transition-all duration-700', done ? 'bg-[#16A34A]' : 'bg-[#2563EB]')}
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
            className="flex-1 h-10 px-3 text-sm border border-[#E5E7EB] rounded-xl outline-none focus:border-[#2563EB] text-[#111827]"
          />
          <button onClick={handleAdd} className="px-4 h-10 bg-[#111827] text-white text-sm font-bold rounded-xl hover:bg-[#1F2937] transition-colors">Add</button>
          <button onClick={() => setAdding(false)} className="px-3 h-10 border border-[#E5E7EB] text-sm text-[#6B7280] rounded-xl hover:bg-[#F9FAFB] transition-colors">✕</button>
        </div>
      ) : (
        <div className="flex gap-2">
          {QUICK_ADDS.map(n => (
            <button
              key={n}
              onClick={() => onChange(steps + n)}
              className="flex-1 h-9 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#374151] hover:border-[#111827] hover:bg-[#F9FAFB] active:scale-95 transition-all"
            >
              +{n.toLocaleString()}
            </button>
          ))}
          <button
            onClick={() => setAdding(true)}
            className="w-9 h-9 rounded-xl border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:border-[#111827] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}