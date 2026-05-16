import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ChevronRight } from 'lucide-react';

const INTENSITY_LABELS = ['Light', 'Moderate', 'Intense', 'Very Intense'];

export default function AIPreferencesStep({ profile, onSubmit, isLoading }) {
  const [form, setForm] = useState({
    duration: '12',
    progression_style: 'linear',
    intensity: [2],
    include_cardio: false,
    cardio_type: 'liss',
    include_rest_activities: false,
  });

  const handleSubmit = () => {
    onSubmit({
      ...form,
      intensity: form.intensity[0],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 max-h-96 overflow-y-auto pr-4"
    >
      <div>
        <Label>Program Duration *</Label>
        <Select value={form.duration} onValueChange={v => setForm(f => ({ ...f, duration: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="4">4 weeks</SelectItem>
            <SelectItem value="8">8 weeks</SelectItem>
            <SelectItem value="12">12 weeks</SelectItem>
            <SelectItem value="16">16 weeks</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Progression Style</Label>
        <Select value={form.progression_style} onValueChange={v => setForm(f => ({ ...f, progression_style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear Progression</SelectItem>
            <SelectItem value="undulating">Undulating Periodization</SelectItem>
            <SelectItem value="block">Block Periodization</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-4 block">Intensity Level</Label>
        <div className="space-y-3">
          <Slider
            value={form.intensity}
            onValueChange={v => setForm(f => ({ ...f, intensity: v }))}
            min={0}
            max={3}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Light</span>
            <span>Moderate</span>
            <span>Intense</span>
            <span>Very Intense</span>
          </div>
          <p className="text-sm font-semibold text-primary pt-2">
            {INTENSITY_LABELS[form.intensity[0]]}
          </p>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <Label>Include Cardio?</Label>
          <Switch
            checked={form.include_cardio}
            onCheckedChange={v => setForm(f => ({ ...f, include_cardio: v }))}
          />
        </div>
        {form.include_cardio && (
          <div className="mt-3">
            <Label className="text-sm">Cardio Type</Label>
            <Select value={form.cardio_type} onValueChange={v => setForm(f => ({ ...f, cardio_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="liss">LISS (Low Intensity Steady State)</SelectItem>
                <SelectItem value="hiit">HIIT (High Intensity Interval Training)</SelectItem>
                <SelectItem value="steady">Steady State</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <Label>Include Rest Day Activities?</Label>
        <Switch
          checked={form.include_rest_activities}
          onCheckedChange={v => setForm(f => ({ ...f, include_rest_activities: v }))}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={() => window.history.back()}>Back</Button>
        <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
          Generate Program <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}