import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Zap } from 'lucide-react';

const FieldLabel = ({ children, optional }) => (
  <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">
    {children} {optional && <span className="normal-case tracking-normal font-normal text-[#C4C9D4]">— optional</span>}
  </p>
);

const CARDIO_OPTIONS = [
  'LISS (Incline Walking)',
  'Steady-State Cardio',
  'HIIT',
  'Sprint Intervals',
  'Zone 2',
  'Sled Pushes/Drags',
  'Assault Bike',
  'Rowing',
  'Stair Climber',
  'Jump Rope',
  'Circuit/Conditioning',
  'Hybrid (HYROX-style)',
  'Sport-Specific',
];

const PROGRESSIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'undulating', label: 'Undulating (DUP)' },
  { value: 'block', label: 'Block Periodization' },
];

const QUICK_DURATIONS = ['4', '8', '12', '16'];

export default function AIPreferencesStep({ profile, onSubmit, isLoading }) {
  const [form, setForm] = useState({
    duration: '12',
    progression_style: 'linear',
    include_cardio: false,
    cardio_types: [],
    include_deload: true,
    deload_frequency: 'every_4_weeks',
    extra_notes: '',
  });
  const [customDuration, setCustomDuration] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);

  const u = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectDuration = (val) => {
    setIsCustomDuration(false);
    setCustomDuration('');
    u('duration', val);
  };

  const handleCustomDurationChange = (val) => {
    setCustomDuration(val);
    setIsCustomDuration(true);
    u('duration', val);
  };

  const toggleCardioType = (type) => {
    const arr = form.cardio_types || [];
    u('cardio_types', arr.includes(type) ? arr.filter(t => t !== type) : [...arr, type]);
  };

  const handleSubmit = () => {
    const finalDuration = isCustomDuration ? customDuration : form.duration;
    onSubmit({ ...form, duration: finalDuration });
  };

  const isValid = isCustomDuration ? (Number(customDuration) >= 1 && Number(customDuration) <= 52) : !!form.duration;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-5"
    >
      {/* Duration */}
      <div>
        <FieldLabel>Program Duration</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {QUICK_DURATIONS.map(d => {
            const active = !isCustomDuration && form.duration === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => selectDuration(d)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: active ? '#2563EB' : '#F8F9FB',
                  color: active ? '#fff' : '#6B7280',
                  border: active ? '1px solid #2563EB' : '0.5px solid #E2E5EC',
                }}
              >
                {d} wks
              </button>
            );
          })}
          {/* Custom option */}
          <button
            type="button"
            onClick={() => { setIsCustomDuration(true); setCustomDuration(''); u('duration', ''); }}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: isCustomDuration ? '#2563EB' : '#F8F9FB',
              color: isCustomDuration ? '#fff' : '#6B7280',
              border: isCustomDuration ? '1px solid #2563EB' : '0.5px solid #E2E5EC',
            }}
          >
            Custom
          </button>
        </div>
        {isCustomDuration && (
          <div className="mt-2 flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={52}
              value={customDuration}
              onChange={e => handleCustomDurationChange(e.target.value)}
              placeholder="e.g. 20"
              className="h-8 text-sm w-24"
              autoFocus
            />
            <span className="text-xs text-[#9CA3AF]">weeks (1–52)</span>
          </div>
        )}
      </div>

      {/* Progression */}
      <div>
        <FieldLabel>Progression Model</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {PROGRESSIONS.map(opt => {
            const active = form.progression_style === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => u('progression_style', opt.value)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: active ? '#2563EB' : '#F8F9FB',
                  color: active ? '#fff' : '#6B7280',
                  border: active ? '1px solid #2563EB' : '0.5px solid #E2E5EC',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
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
      <div className="p-3 rounded-xl" style={{ border: '0.5px solid #E2E5EC', background: '#F8F9FB' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0E1525]">Include Cardio / Conditioning</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Add conditioning work to the schedule</p>
          </div>
          <Switch checked={form.include_cardio} onCheckedChange={v => u('include_cardio', v)} />
        </div>
        {form.include_cardio && (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Select type(s)</p>
            <div className="flex flex-wrap gap-1.5">
              {CARDIO_OPTIONS.map(type => {
                const active = (form.cardio_types || []).includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleCardioType(type)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                    style={{
                      background: active ? '#2563EB' : '#fff',
                      color: active ? '#fff' : '#6B7280',
                      border: active ? '1px solid #2563EB' : '0.5px solid #D1D5DB',
                    }}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
            {(form.cardio_types || []).length === 0 && (
              <p className="text-[11px] text-[#EF4444] mt-1.5">Select at least one cardio type</p>
            )}
          </div>
        )}
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
          disabled={isLoading || !isValid || (form.include_cardio && (form.cardio_types || []).length === 0)}
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