import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from 'lucide-react';

export default function ProgramSettingsStep({
  startDate,
  onStartDateChange,
  repeatProgram,
  onRepeatChange,
  pace,
  onPaceChange,
  showCustomMessage,
  onShowCustomMessageChange,
  customMessage,
  onCustomMessageChange,
}) {
  const formatDate = (date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Start Date */}
      <div>
        <Label className="font-semibold mb-2 block">Start Date</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={formatDate(startDate)}
            onChange={(e) => onStartDateChange(new Date(e.target.value))}
            className="pl-9"
          />
        </div>
      </div>

      {/* Repeat Program */}
      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
        <div>
          <Label className="font-semibold">Repeat program when complete</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Program auto-restarts when the client finishes
          </p>
        </div>
        <Switch checked={repeatProgram} onCheckedChange={onRepeatChange} />
      </div>

      {/* Program Pace */}
      <div>
        <Label className="font-semibold mb-3 block">Program Pace</Label>
        <RadioGroup value={pace} onValueChange={onPaceChange}>
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors">
            <RadioGroupItem value="standard" id="pace-standard" />
            <div className="flex-1">
              <Label htmlFor="pace-standard" className="font-medium cursor-pointer">Standard</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Follow program as written</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors">
            <RadioGroupItem value="accelerated" id="pace-accelerated" />
            <div className="flex-1">
              <Label htmlFor="pace-accelerated" className="font-medium cursor-pointer">Accelerated</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Compress timeline — weeks move faster</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors">
            <RadioGroupItem value="extended" id="pace-extended" />
            <div className="flex-1">
              <Label htmlFor="pace-extended" className="font-medium cursor-pointer">Extended</Label>
              <p className="text-xs text-muted-foreground mt-0.5">More time per phase for beginners</p>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Custom Start Message */}
      <div className="border border-border rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <Label className="font-semibold">Custom start message</Label>
          <Switch checked={showCustomMessage} onCheckedChange={onShowCustomMessageChange} />
        </div>
        {showCustomMessage && (
          <Textarea
            placeholder="Write a personal note to the client (e.g., 'Hey Sarah, I put you on this program because I know it's perfect for your goals — let's crush it! 💪')"
            value={customMessage}
            onChange={(e) => onCustomMessageChange(e.target.value)}
            className="h-24 text-sm"
          />
        )}
      </div>
    </div>
  );
}