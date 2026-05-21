import React, { useState } from 'react';
import { Footprints, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StepGoal({ steps = 0, goal = 10000, onChange }) {
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState('');
  const pct = Math.min(100, (steps / goal) * 100);
  const done = steps >= goal;

  const handleAdd = () => {
    const n = parseInt(input, 10);
    if (!isNaN(n) && n > 0) onChange(steps + n);
    setInput('');
    setAdding(false);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', done ? 'bg-[#DCFCE7]' : 'bg-[#F3F4F6]')}>
            <Footprints className={cn('w-5 h-5', done ? 'text-[#16A34A]' : 'text-[#6B7280]')} />
          </div>
          <div>
            <p className="text-xs text-[#6B7280]">Step Goal</p>
            <p className="text-base font-semibold text-[#111827]">
              {steps.toLocaleString()} <span className="text-sm font-normal text-[#9CA3AF]">/ {goal.toLocaleString()}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-[#111827]">{Math.round(pct)}%</p>
          {!done && <p className="text-xs text-[#9CA3AF]">{(goal - steps).toLocaleString()} left</p>}
          {done && <p className="text-xs text-[#16A34A] font-semibold">Goal met!</p>}
        </div>
      </div>

      <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden mb-3">
        <div className="h-full bg-[#2563EB] rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      {adding ? (
        <div className="flex gap-2">
          <input
            autoFocus
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Steps to add..."
            className="flex-1 h-9 px-3 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-[#111827] text-[#111827]"
          />
          <button onClick={handleAdd} className="px-3 h-9 bg-[#111827] text-white text-sm font-semibold rounded-lg hover:bg-[#1F2937] transition-colors">Add</button>
          <button onClick={() => setAdding(false)} className="px-3 h-9 border border-[#E5E7EB] text-sm text-[#6B7280] rounded-lg hover:bg-[#F9FAFB] transition-colors">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full h-9 border border-[#E5E7EB] text-[#111827] text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 hover:border-[#111827] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Steps
        </button>
      )}
    </div>
  );
}