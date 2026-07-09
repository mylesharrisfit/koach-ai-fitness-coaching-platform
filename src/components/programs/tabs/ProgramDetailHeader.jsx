import React from 'react';
import { Badge } from '@/components/ui/badge';
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
  beginner: 'bg-success/10 text-success',
  intermediate: 'bg-accent text-primary',
  advanced: 'bg-ai/10 text-ai',
  elite: 'bg-destructive/10 text-destructive',
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