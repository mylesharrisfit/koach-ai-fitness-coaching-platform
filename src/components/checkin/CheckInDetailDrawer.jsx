import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Moon, Zap, Heart, Smile, Dumbbell, Salad, Scale, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { scoreColor, checkInScore } from '@/lib/adherence';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MOOD_EMOJI = { great: '😄', good: '🙂', okay: '😐', tired: '😴', stressed: '😰' };

function MetricTile({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Icon className={cn('w-3.5 h-3.5', color || 'text-muted-foreground')} />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-bold text-[#1F2A44]">
        {value ?? '–'}
        {value != null && unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

export default function CheckInDetailDrawer({ checkIn, client, allCheckIns, currentIndex, total, onNavigate, open, onOpenChange }) {
  const [coachNotes, setCoachNotes] = useState(checkIn?.coach_notes || '');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CheckIn.update(checkIn.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins-review'] });
      toast.success('Check-in updated');
    },
  });

  if (!checkIn) return null;

  const score = checkInScore(checkIn);
  const clientName = client?.name || checkIn.client_name || 'Client';

  const handleMarkReviewed = () => {
    updateMutation.mutate({ coach_responded: true, review_status: 'reviewed', coach_notes: coachNotes || checkIn.coach_notes });
  };

  const handleFlag = () => {
    updateMutation.mutate({ review_status: 'flagged' });
  };

  const handleSaveResponse = async () => {
    if (!coachNotes.trim()) return;
    setSaving(true);
    updateMutation.mutate({ coach_notes: coachNotes, coach_responded: true, review_status: 'reviewed' });
    setSaving(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E7EAF3] flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {clientName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{clientName}</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(checkIn.date), 'EEEE, MMM d, yyyy')}
              {checkIn.mood && <span className="ml-1.5">{MOOD_EMOJI[checkIn.mood]}</span>}
            </p>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-[#F6F7FB] transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        {total > 1 && (
          <div className="flex items-center justify-between px-5 py-2 bg-[#F6F7FB] border-b border-[#E7EAF3] flex-shrink-0">
            <button
              disabled={currentIndex === 0}
              onClick={() => onNavigate(currentIndex - 1)}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-xs text-muted-foreground">{currentIndex + 1} / {total}</span>
            <button
              disabled={currentIndex === total - 1}
              onClick={() => onNavigate(currentIndex + 1)}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Score badge */}
          {score !== null && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F6F7FB] border border-[#E7EAF3]">
              <span className="text-sm font-semibold">Overall Score</span>
              <span className={cn('text-2xl font-extrabold', scoreColor(score))}>{score}<span className="text-sm font-normal text-muted-foreground">%</span></span>
            </div>
          )}

          {/* Metrics grid */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Metrics</p>
            <div className="grid grid-cols-2 gap-2">
              <MetricTile icon={Moon} label="Sleep" value={checkIn.sleep_hours} unit="hrs"
                color={checkIn.sleep_hours >= 7 ? 'text-indigo-500' : checkIn.sleep_hours >= 6 ? 'text-amber-500' : 'text-red-500'} />
              <MetricTile icon={Zap} label="Energy" value={checkIn.energy_level} unit="/10"
                color={checkIn.energy_level >= 7 ? 'text-emerald-500' : checkIn.energy_level >= 4 ? 'text-amber-500' : 'text-red-500'} />
              <MetricTile icon={Heart} label="Stress" value={checkIn.stress_level} unit="/10"
                color={checkIn.stress_level <= 3 ? 'text-emerald-500' : checkIn.stress_level <= 6 ? 'text-amber-500' : 'text-red-500'} />
              <MetricTile icon={Smile} label="Mood" value={checkIn.mood ? MOOD_EMOJI[checkIn.mood] + ' ' + checkIn.mood : null}
                color="text-amber-500" />
              <MetricTile icon={Dumbbell} label="Training" value={checkIn.compliance_training} unit="%"
                color={checkIn.compliance_training >= 75 ? 'text-emerald-500' : checkIn.compliance_training >= 50 ? 'text-amber-500' : 'text-red-500'} />
              <MetricTile icon={Salad} label="Nutrition" value={checkIn.compliance_nutrition} unit="%"
                color={checkIn.compliance_nutrition >= 75 ? 'text-emerald-500' : checkIn.compliance_nutrition >= 50 ? 'text-amber-500' : 'text-red-500'} />
              {checkIn.weight != null && (
                <MetricTile icon={Scale} label="Weight" value={checkIn.weight} unit="lbs" color="text-blue-500" />
              )}
            </div>
          </div>

          {/* Photos */}
          {checkIn.photo_urls?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Progress Photos</p>
              <div className="flex gap-2 flex-wrap">
                {checkIn.photo_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="progress" className="w-20 h-20 object-cover rounded-xl border border-[#E7EAF3] hover:scale-105 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Client notes */}
          {checkIn.notes && (
            <div className="bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Client Notes</p>
              <p className="text-sm leading-relaxed">{checkIn.notes}</p>
            </div>
          )}

          {/* Coach response */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Coach Response</p>
            <textarea
              rows={4}
              value={coachNotes}
              onChange={e => setCoachNotes(e.target.value)}
              placeholder="Type your feedback and coaching notes..."
              className="w-full rounded-xl border border-[#E7EAF3] bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-primary/40"
            />
            <Button size="sm" onClick={handleSaveResponse} disabled={!coachNotes.trim() || updateMutation.isPending} className="w-full mt-2">
              Send Response
            </Button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex-shrink-0 border-t border-[#E7EAF3] px-5 py-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleFlag}
            disabled={updateMutation.isPending}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Flag
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5 bg-emerald-500 hover:bg-emerald-600"
            onClick={handleMarkReviewed}
            disabled={updateMutation.isPending || checkIn.coach_responded}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {checkIn.coach_responded ? 'Reviewed' : 'Mark Reviewed'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}