import React, { useState } from 'react';
import { Play, Star, Edit, Trash2, MoreHorizontal, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const MUSCLE_COLORS = {
  chest: 'text-chart-1 bg-chart-1/10',
  back: 'text-chart-2 bg-chart-2/10',
  shoulders: 'text-chart-3 bg-chart-3/10',
  biceps: 'text-primary bg-primary/10',
  triceps: 'text-primary bg-primary/10',
  legs: 'text-chart-5 bg-chart-5/10',
  glutes: 'text-chart-5 bg-chart-5/10',
  core: 'text-chart-4 bg-chart-4/10',
  full_body: 'text-accent bg-accent/10',
  cardio: 'text-accent bg-accent/10',
};

function VideoThumbnail({ url, thumbnailUrl, name }) {
  const isYoutube = url && (url.includes('youtube.com') || url.includes('youtu.be'));
  const isVimeo = url && url.includes('vimeo.com');

  let thumb = thumbnailUrl;
  if (!thumb && isYoutube) {
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (match) thumb = `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  }

  if (thumb) {
    return (
      <div className="relative w-full h-full">
        <img src={thumb} alt={name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-gray-900 ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-secondary/60 flex flex-col items-center justify-center gap-2">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Play className="w-4 h-4 text-primary ml-0.5" />
      </div>
      <span className="text-xs text-muted-foreground">{url ? 'Video' : 'No demo'}</span>
    </div>
  );
}

export default function ExerciseCard({ exercise, onView, onEdit, onDelete, compact = false }) {
  const muscleColor = MUSCLE_COLORS[exercise.muscle_group] || 'text-muted-foreground bg-secondary';

  return (
    <div
      className={cn(
        "group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer",
        compact && "flex gap-3 p-3 items-center"
      )}
      onClick={onView}
    >
      {!compact && (
        <div className="relative h-44 bg-secondary/40 overflow-hidden">
          <VideoThumbnail url={exercise.video_url} thumbnailUrl={exercise.thumbnail_url} name={exercise.name} />
          {exercise.is_coach_branded && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-chart-4/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
              <Star className="w-2.5 h-2.5" fill="currentColor" /> Coach
            </div>
          )}
          <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      <div className={cn("p-4", compact && "p-0 flex-1")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={cn("font-heading font-semibold leading-tight truncate", compact ? "text-sm" : "text-base")}>{exercise.name}</h3>
            {exercise.description && !compact && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exercise.description}</p>
            )}
          </div>
          {compact && exercise.video_url && (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Play className="w-3.5 h-3.5 text-primary ml-0.5" />
            </div>
          )}
        </div>

        <div className={cn("flex flex-wrap gap-1.5", compact ? "mt-1" : "mt-3")}>
          {exercise.muscle_group && (
            <Badge className={cn("text-[10px] px-2 py-0 border-0", muscleColor)}>
              {exercise.muscle_group.replace('_', ' ')}
            </Badge>
          )}
          {exercise.equipment && (
            <Badge variant="outline" className="text-[10px] px-2 py-0">
              {exercise.equipment.replace('_', ' ')}
            </Badge>
          )}
          {exercise.movement_pattern && !compact && (
            <Badge variant="outline" className="text-[10px] px-2 py-0">
              {exercise.movement_pattern}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}