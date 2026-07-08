import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const DAY_TYPES = [
  { key: 'high', label: 'High Carb', color: 'bg-amber-500 text-white border-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'medium', label: 'Medium Carb', color: 'bg-blue-500 text-white border-blue-500', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'low', label: 'Low Carb', color: 'bg-emerald-500 text-white border-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'none', label: 'Not Set', color: 'bg-secondary text-muted-foreground border-border', badge: 'bg-secondary text-muted-foreground border-border' },
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CarbCyclingPanel({ value = {}, onChange }) {
  // value = { enabled, targets: { high, medium, low }, schedule: { Monday: 'high', ... } }
  const enabled = value.enabled || false;
  const targets = value.targets || { high: '', medium: '', low: '' };
  const schedule = value.schedule || {};

  const update = (patch) => onChange({ ...value, ...patch });

  const setDay = (day, type) => {
    update({ schedule: { ...schedule, [day]: type } });
  };

  const setTarget = (type, val) => {
    update({ targets: { ...targets, [type]: val } });
  };

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-4 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Carb Cycling</p>
          <p className="text-xs text-muted-foreground mt-0.5">Assign high/medium/low carb days to the weekly schedule</p>
        </div>
        <button
          type="button"
          onClick={() => update({ enabled: !enabled })}
          className={cn('w-11 h-6 rounded-full transition-all relative flex-shrink-0', enabled ? 'bg-primary' : 'bg-gray-200')}
        >
          <div className={cn('w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all', enabled ? 'left-5' : 'left-0.5')} />
        </button>
      </div>

      {enabled && (
        <>
          {/* Calorie targets per day type */}
          <div className="grid grid-cols-3 gap-3">
            {['high', 'medium', 'low'].map(type => {
              const dt = DAY_TYPES.find(d => d.key === type);
              return (
                <div key={type}>
                  <Label className="text-xs text-muted-foreground">{dt.label} (kcal)</Label>
                  <Input
                    type="number"
                    placeholder={type === 'high' ? '2800' : type === 'medium' ? '2400' : '2000'}
                    value={targets[type] || ''}
                    onChange={e => setTarget(type, e.target.value)}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              );
            })}
          </div>

          {/* Weekly schedule grid */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Weekly Schedule</Label>
            <div className="space-y-1.5">
              {DAYS_OF_WEEK.map(day => {
                const current = schedule[day] || 'none';
                const currentDT = DAY_TYPES.find(d => d.key === current);
                return (
                  <div key={day} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground w-24 flex-shrink-0">{day}</span>
                    <div className="flex gap-1 flex-wrap">
                      {DAY_TYPES.filter(d => d.key !== 'none').map(dt => (
                        <button
                          key={dt.key}
                          type="button"
                          onClick={() => setDay(day, dt.key === current ? 'none' : dt.key)}
                          className={cn(
                            'text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all',
                            current === dt.key ? dt.color : 'bg-white text-muted-foreground border-[#E7EAF3] hover:border-primary/30'
                          )}
                        >
                          {dt.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                    {current !== 'none' && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${currentDT?.badge}`}>
                        {targets[current] ? `${targets[current]} kcal` : currentDT?.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}