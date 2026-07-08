import React from 'react';
import {
  Dumbbell, Flame, Zap, Trophy, Layers, Target,
  TrendingUp, Wind, Heart, Zap as Lightning
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_OPTIONS = [
  { id: 'dumbbell', icon: Dumbbell, label: 'Dumbbell', color: 'bg-blue-100 text-blue-600' },
  { id: 'flame', icon: Flame, label: 'Flame', color: 'bg-orange-100 text-orange-600' },
  { id: 'lightning', icon: Zap, label: 'Lightning', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'trophy', icon: Trophy, label: 'Trophy', color: 'bg-purple-100 text-purple-600' },
  { id: 'layers', icon: Layers, label: 'Layers', color: 'bg-pink-100 text-pink-600' },
  { id: 'target', icon: Target, label: 'Target', color: 'bg-red-100 text-red-600' },
  { id: 'trending', icon: TrendingUp, label: 'Trending', color: 'bg-green-100 text-green-600' },
  { id: 'wind', icon: Wind, label: 'Wind', color: 'bg-cyan-100 text-cyan-600' },
  { id: 'heart', icon: Heart, label: 'Heart', color: 'bg-rose-100 text-rose-600' },
  { id: 'bolt', icon: Lightning, label: 'Bolt', color: 'bg-indigo-100 text-indigo-600' },
];

export default function ProgramIconSelector({ selected = 'dumbbell', onChange }) {
  return (
    <div className="p-4 border-b border-[#E7EAF3]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2.5">Program Icon</p>
      <div className="grid grid-cols-5 gap-2">
        {ICON_OPTIONS.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-all border-2',
                selected === opt.id
                  ? `${opt.color} border-current`
                  : 'bg-[#F6F7FB] text-[#9CA3AF] border-transparent hover:border-[#E7EAF3]'
              )}
              title={opt.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}