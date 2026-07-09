import React from 'react';
import {
  Dumbbell, Flame, Zap, Trophy, Layers, Target,
  TrendingUp, Wind, Heart, Zap as Lightning
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_OPTIONS = [
  { id: 'dumbbell', icon: Dumbbell, label: 'Dumbbell', color: 'bg-accent text-primary' },
  { id: 'flame', icon: Flame, label: 'Flame', color: 'bg-orange-100 text-orange-600' },
  { id: 'lightning', icon: Zap, label: 'Lightning', color: 'bg-warning/10 text-warning' },
  { id: 'trophy', icon: Trophy, label: 'Trophy', color: 'bg-ai/10 text-ai' },
  { id: 'layers', icon: Layers, label: 'Layers', color: 'bg-pink-100 text-pink-600' },
  { id: 'target', icon: Target, label: 'Target', color: 'bg-destructive/10 text-destructive' },
  { id: 'trending', icon: TrendingUp, label: 'Trending', color: 'bg-success/10 text-success' },
  { id: 'wind', icon: Wind, label: 'Wind', color: 'bg-cyan-100 text-cyan-600' },
  { id: 'heart', icon: Heart, label: 'Heart', color: 'bg-destructive/10 text-destructive' },
  { id: 'bolt', icon: Lightning, label: 'Bolt', color: 'bg-accent text-primary' },
];

export default function ProgramIconSelector({ selected = 'dumbbell', onChange }) {
  return (
    <div className="p-4 border-b border-border">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Program Icon</p>
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
                  : 'bg-muted text-muted-foreground border-transparent hover:border-border'
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