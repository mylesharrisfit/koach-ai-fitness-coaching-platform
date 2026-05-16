import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, BarChart3, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_ICON = {
  strength: '💪',
  hypertrophy: '🔨',
  fat_loss: '🔥',
  athletic: '⚡',
  mobility: '🧘',
  custom: '⚙️',
};

const DIFFICULTY_BADGE = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-purple-100 text-purple-700',
  elite: 'bg-red-100 text-red-700',
};

export default function ProgramDetailHeader({ program }) {
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Badge className={cn('capitalize', DIFFICULTY_BADGE[program.difficulty] || DIFFICULTY_BADGE.intermediate)}>
          {program.difficulty || 'custom'}
        </Badge>
        {program.category && (
          <Badge variant="outline" className="capitalize">
            {CATEGORY_ICON[program.category]} {program.category.replace('_', ' ')}
          </Badge>
        )}
      </div>
    </div>
  );
}