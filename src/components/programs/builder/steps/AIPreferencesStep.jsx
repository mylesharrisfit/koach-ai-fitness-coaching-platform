import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Zap, ChevronRight } from 'lucide-react';

const FieldLabel = ({ children, optional }) => (
  <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">
    {children} {optional && <span className="normal-case tracking-normal font-normal text-[#C4C9D4]">— optional</span>}
  </p>
);

const ChipSelect = ({ value, onChange, options, single = false }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => {
      const isActive = single ? value === opt : (Array.isArray(value) && value.includes(opt));
      return (
        <button
          key={opt.value || opt}
          type="button"
          onClick={() => {
            const v = opt.value || opt;
            if (single) { onChange(v); }
            else {
              const arr = Array.isArray(value) ? value : [];
              onChange(isActive ? arr.filter(o => o !== v) : [...arr, v]);
            }
          }}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            background: isActive ? '#2563EB' : '#F8F9FB',
            color: isActive ? '#fff' : '#6B7280',
            border: isActive ? '1px solid #2563EB' : '0.5px solid #E2E5EC',
          }}
        >
          {opt.label || opt}
        </button>
      );
    })}
  </div>
);

export default function AIPreferencesStep({ profile, onSubmit, isLoading }) {
  const [form, setForm] = useState({
    duration: '12',
    progression_style: 'linear',
    include_cardio: false,
    cardio_type: 'liss',
    include_deload: true,
    deload_frequency: 'every_4_weeks',
    extra_notes: '',
  });

  const u = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => onSubmit(form);

  const DURATIONS = [
    { value: '4', label: '4 wks' },
    { value: '8', label: '8 wks' },
    { value: '12', label: '12 wks' },
    { value: '16', label: '16 wks' },
  ];

  const PROGRESSIONS = [
    { value: 'linear', label: 'Linear' },
    { value: 'undulating', label: 'Undulating (DUP)' },
    { value: 'block', label: 'Block Periodization' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-5 max-h-[480px] overflow-y-auto pr-3"
    >
      {/* Duration */}
      <div>
        <FieldLabel>Program Duration</FieldLabel>
        <ChipSelect value={form.duration} onChange={v => u('duration', v)} options={DURATIONS} single />
      </div>

      {/* Progression */}
      <div>
        <FieldLabel>Progression Model</FieldLabel>
        <ChipSelect value={form.progression_style} onChange={v => u('progression_style', v)} options={PROGRESSIONS} single />
        <p className="text-[11px] text-[#9CA3AF] mt-1.5">
          {form.progression_style === 'linear' && 'Add weight each session. Best for beginners–intermediate.'}
          {form.progression_style === 'undulating' && 'Vary rep ranges each session (strength / hypertrophy / endurance). Best for intermediate+.'}
          {form.progression_style === 'block' && 'Accumulation → Intensification → Realization phases. Best for advanced.'}
        </p>
      </div>

      {/* Deload */}
      <div className="flex items-start justify-between p-3 rounded-xl" style={{ border: '0.5px solid #E2E5EC', background: '#F8F9FB' }}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0E1525]">Include Deload Weeks</p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">Reduced volume weeks to aid recovery and adaptation</p>
          {form.include_deload && (
            <div className="mt-2">
              <Select value={form.deload_frequency} onValueChange={v => u('deload_frequency', v)}>
                <SelectTrigger className="h-8 text-xs w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="every_3_weeks">Every 3 weeks</SelectItem>
                  <SelectItem value="every_4_weeks">Every 4 weeks</SelectItem>
                  <SelectItem value="every_5_weeks">Every 5 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <Switch checked={form.include_deload} onCheckedChange={v => u('include_deload', v)} />
      </div>

      {/* Cardio */}
      <div className="flex items-start justify-between p-3 rounded-xl" style={{ border: '0.5px solid #E2E5EC', background: '#F8F9FB' }}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0E1525]">Include Cardio Days</p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">Add conditioning work to the schedule</p>
          {form.include_cardio && (
            <div className="mt-2">
              <Select value={form.cardio_type} onValueChange={v => u('cardio_type', v)}>
                <SelectTrigger className="h-8 text-xs w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="liss">LISS (Low Intensity)</SelectItem>
                  <SelectItem value="hiit">HIIT</SelectItem>
                  <SelectItem value="steady">Steady State</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <Switch checked={form.include_cardio} onCheckedChange={v => u('include_cardio', v)} />
      </div>

      {/* Extra notes */}
      <div>
        <FieldLabel optional>Additional Coaching Notes for the AI</FieldLabel>
        <Textarea
          value={form.extra_notes}
          onChange={e => u('extra_notes', e.target.value)}
          rows={2}
          placeholder="e.g. Client recovers slowly, prefers compound movements, has a competition in 16 weeks..."
          className="text-sm"
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="gap-2 text-sm font-semibold"
          style={{ background: '#2563EB' }}
        >
          <Zap className="w-4 h-4" />
          {isLoading ? 'Generating...' : 'Generate Program'}
        </Button>
      </div>
    </motion.div>
  );
}