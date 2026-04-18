import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Star, Target, Zap, AlertTriangle, Clock, Timer, ChevronRight, Play } from 'lucide-react';
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

function VideoPlayer({ url, thumbnailUrl, name }) {
  const [playing, setPlaying] = useState(false);

  const isYoutube = url && (url.includes('youtube.com/watch') || url.includes('youtu.be/'));
  const isVimeo = url && url.includes('vimeo.com');
  const isDirect = url && (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov'));

  const getEmbedUrl = () => {
    if (isYoutube) {
      const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
      return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1` : url;
    }
    if (isVimeo) {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match ? `https://player.vimeo.com/video/${match[1]}?autoplay=1` : url;
    }
    return url;
  };

  let thumb = thumbnailUrl;
  if (!thumb && isYoutube) {
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (match) thumb = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }

  if (!url) {
    return (
      <div className="w-full aspect-video bg-secondary/50 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <Play className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground/60">No demo video added</p>
        </div>
      </div>
    );
  }

  if (isDirect) {
    return (
      <video
        className="w-full aspect-video rounded-xl bg-black object-contain"
        src={url}
        controls
        playsInline
        preload="metadata"
        poster={thumb}
      />
    );
  }

  if (playing) {
    return (
      <iframe
        className="w-full aspect-video rounded-xl"
        src={getEmbedUrl()}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title={name}
      />
    );
  }

  return (
    <div
      className="relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer group"
      onClick={() => setPlaying(true)}
    >
      {thumb ? (
        <img src={thumb} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-secondary/60" />
      )}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/95 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <Play className="w-7 h-7 text-gray-900 ml-1" fill="currentColor" />
        </div>
      </div>
    </div>
  );
}

export default function ExerciseDetailModal({ exercise, open, onClose, onEdit }) {
  if (!exercise) return null;

  const muscleColor = MUSCLE_COLORS[exercise.muscle_group] || 'text-muted-foreground bg-secondary';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        {/* Video Section */}
        <div className="p-5 pb-0">
          <VideoPlayer url={exercise.video_url} thumbnailUrl={exercise.thumbnail_url} name={exercise.name} />
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {exercise.is_coach_branded && (
                  <Badge className="text-[10px] bg-chart-4/15 text-chart-4 border-chart-4/20 gap-1">
                    <Star className="w-2.5 h-2.5" fill="currentColor" /> Coach-Branded
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-heading font-bold">{exercise.name}</h2>
              {exercise.description && (
                <p className="text-sm text-muted-foreground mt-1">{exercise.description}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={onEdit} className="flex-shrink-0">
              <Edit className="w-4 h-4 mr-1.5" /> Edit
            </Button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {exercise.muscle_group && (
              <Badge className={cn("border-0", muscleColor)}>
                {exercise.muscle_group.replace('_', ' ')}
              </Badge>
            )}
            {exercise.equipment && (
              <Badge variant="outline">{exercise.equipment.replace('_', ' ')}</Badge>
            )}
            {exercise.movement_pattern && (
              <Badge variant="outline">{exercise.movement_pattern}</Badge>
            )}
            {exercise.difficulty && (
              <Badge variant="outline">{exercise.difficulty}</Badge>
            )}
          </div>

          {/* Secondary muscles */}
          {exercise.secondary_muscles?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Also Works</p>
              <div className="flex flex-wrap gap-1.5">
                {exercise.secondary_muscles.map(m => (
                  <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            {exercise.tempo && (
              <div className="bg-secondary/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Timer className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tempo</span>
                </div>
                <p className="font-heading font-bold text-lg">{exercise.tempo}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">ecc–pause–con–pause</p>
              </div>
            )}
            {exercise.default_rest_seconds && (
              <div className="bg-secondary/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Rest Time</span>
                </div>
                <p className="font-heading font-bold text-lg">{exercise.default_rest_seconds}s</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">between sets</p>
              </div>
            )}
          </div>

          {/* Form Cues */}
          {exercise.form_cues?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-semibold">Form Cues</h3>
              </div>
              <div className="space-y-2">
                {exercise.form_cues.map((cue, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-secondary/40 rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{cue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Mistakes */}
          {exercise.common_mistakes?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-chart-4" />
                <h3 className="font-heading font-semibold">Common Mistakes</h3>
              </div>
              <div className="space-y-2">
                {exercise.common_mistakes.map((mistake, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-chart-4/5 border border-chart-4/15 rounded-xl">
                    <AlertTriangle className="w-3.5 h-3.5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">{mistake}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coach notes */}
          {exercise.notes && (
            <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl">
              <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Coach Notes</p>
              <p className="text-sm text-muted-foreground">{exercise.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}