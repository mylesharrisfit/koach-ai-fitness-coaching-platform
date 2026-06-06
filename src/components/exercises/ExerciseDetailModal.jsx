import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Star, AlertTriangle, Clock, Timer, Play, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MUSCLE_TAG_COLORS = {
  chest:     'bg-red-50 text-red-600',
  back:      'bg-emerald-50 text-emerald-700',
  shoulders: 'bg-purple-50 text-purple-700',
  biceps:    'bg-blue-50 text-blue-700',
  triceps:   'bg-blue-50 text-blue-700',
  legs:      'bg-orange-50 text-orange-700',
  glutes:    'bg-pink-50 text-pink-700',
  core:      'bg-amber-50 text-amber-700',
  full_body: 'bg-indigo-50 text-indigo-700',
  cardio:    'bg-teal-50 text-teal-700',
};

function VideoPlayer({ url, imageUrl, thumbnailUrl, name }) {
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
    const match = url?.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (match) thumb = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }

  // If has a video URL
  if (url) {
    if (isDirect) {
      return (
        <video className="w-full aspect-video rounded-xl bg-black object-contain"
          src={url} controls playsInline preload="metadata" poster={thumb || imageUrl} />
      );
    }
    if (playing) {
      return (
        <iframe className="w-full aspect-video rounded-xl"
          src={getEmbedUrl()} allow="autoplay; fullscreen" allowFullScreen title={name} />
      );
    }
    const displayThumb = thumb || imageUrl;
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer group" onClick={() => setPlaying(true)}>
        {displayThumb
          ? <img src={displayThumb} alt={name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-[#F3F4F6]" />}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/95 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-[#0E1525] ml-1" fill="currentColor" />
          </div>
        </div>
      </div>
    );
  }

  // No video — show image if available
  if (imageUrl) {
    return (
      <div className="w-full rounded-xl overflow-hidden bg-[#F3F4F6]">
        <img src={imageUrl} alt={name} className="w-full object-cover max-h-64" onError={e => { e.target.style.display = 'none'; }} />
      </div>
    );
  }

  // Nothing at all
  return (
    <div className="w-full aspect-video bg-[#F3F4F6] rounded-xl flex items-center justify-center">
      <div className="text-center">
        <Play className="w-10 h-10 text-[#9CA3AF] mx-auto mb-2" />
        <p className="text-sm text-[#9CA3AF]">No demo available</p>
      </div>
    </div>
  );
}

export default function ExerciseDetailModal({ exercise, open, onClose, onEdit }) {
  if (!exercise) return null;

  const muscleTagClass = MUSCLE_TAG_COLORS[exercise.muscle_group] || 'bg-gray-100 text-gray-600';
  // Use instructions if present, fall back to form_cues
  const steps = (exercise.instructions?.length > 0 ? exercise.instructions : exercise.form_cues) || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl">

        {/* Media */}
        <div className="p-5 pb-0">
          <VideoPlayer
            url={exercise.video_url}
            imageUrl={exercise.image_url}
            thumbnailUrl={exercise.thumbnail_url}
            name={exercise.name}
          />
        </div>

        <div className="p-6 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {exercise.is_coach_branded && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 mb-1">
                  <Star className="w-2.5 h-2.5" fill="currentColor" /> Coach-Branded
                </span>
              )}
              <h2 className="text-xl font-bold text-[#0E1525]">{exercise.name}</h2>
              {exercise.description && (
                <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">{exercise.description}</p>
              )}
            </div>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} className="flex-shrink-0 text-xs h-8">
                <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
              </Button>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {exercise.muscle_group && (
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', muscleTagClass)}>
                {exercise.muscle_group.replace('_', ' ')}
              </span>
            )}
            {exercise.equipment && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#374151]">
                {exercise.equipment.replace('_', ' ')}
              </span>
            )}
            {exercise.difficulty && (
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full capitalize',
                exercise.difficulty === 'beginner' ? 'bg-emerald-50 text-emerald-700' :
                exercise.difficulty === 'advanced' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700')}>
                {exercise.difficulty}
              </span>
            )}
            {exercise.category && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#3730a3]">
                {exercise.category}
              </span>
            )}
          </div>

          {/* Secondary muscles */}
          {exercise.secondary_muscles?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Also Works</p>
              <div className="flex flex-wrap gap-1.5">
                {exercise.secondary_muscles.map(m => (
                  <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280]">{m}</span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {(exercise.tempo || exercise.default_rest_seconds) && (
            <div className="grid grid-cols-2 gap-3">
              {exercise.tempo && (
                <div className="bg-[#F8F9FB] rounded-xl p-3" style={{ border: '0.5px solid #E2E5EC' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Timer className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Tempo</span>
                  </div>
                  <p className="font-bold text-lg text-[#0E1525]">{exercise.tempo}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">ecc–pause–con–pause</p>
                </div>
              )}
              {exercise.default_rest_seconds && (
                <div className="bg-[#F8F9FB] rounded-xl p-3" style={{ border: '0.5px solid #E2E5EC' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Rest Time</span>
                  </div>
                  <p className="font-bold text-lg text-[#0E1525]">{exercise.default_rest_seconds}s</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">between sets</p>
                </div>
              )}
            </div>
          )}

          {/* Instructions / Form Cues */}
          {steps.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">How to Perform</p>
              <div className="space-y-2.5">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#F8F9FB]" style={{ border: '0.5px solid #E2E5EC' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold"
                      style={{ background: '#2563EB', minWidth: 24 }}>
                      {i + 1}
                    </div>
                    <p className="text-sm text-[#374151] leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Mistakes */}
          {exercise.common_mistakes?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Common Mistakes</p>
              <div className="space-y-2">
                {exercise.common_mistakes.map((m, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50" style={{ border: '0.5px solid #FECACA' }}>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#374151] leading-relaxed">{m}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coach notes */}
          {exercise.notes && (
            <div className="p-3 rounded-xl bg-blue-50" style={{ border: '0.5px solid #BFDBFE' }}>
              <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider mb-1">Coach Notes</p>
              <p className="text-sm text-[#374151]">{exercise.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}