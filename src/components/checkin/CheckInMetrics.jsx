import React from 'react';

const MOOD_EMOJI = { great: '😄', good: '🙂', okay: '😐', tired: '😴', stressed: '😰' };

export default function CheckInMetrics({ checkIn }) {
  const metrics = [
    { label: 'Weight', value: checkIn.weight ? `${checkIn.weight} lbs` : null, icon: '⚖️' },
    { label: 'Body Fat', value: checkIn.body_fat_pct ? `${checkIn.body_fat_pct}%` : null, icon: '📊' },
    { label: 'Sleep', value: checkIn.sleep_hours ? `${checkIn.sleep_hours}h` : null, icon: '😴' },
    { label: 'Mood', value: checkIn.mood ? `${MOOD_EMOJI[checkIn.mood]} ${checkIn.mood}` : null, icon: null },
    { label: 'Training', value: checkIn.compliance_training != null ? `${checkIn.compliance_training}%` : null, icon: '💪', isCompliance: true, val: checkIn.compliance_training },
    { label: 'Nutrition', value: checkIn.compliance_nutrition != null ? `${checkIn.compliance_nutrition}%` : null, icon: '🥗', isCompliance: true, val: checkIn.compliance_nutrition },
  ].filter(m => m.value);

  if (!metrics.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {metrics.map(m => (
        <div key={m.label} className="bg-secondary/40 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{m.label}</p>
          <p className="text-sm font-semibold">{m.value}</p>
          {m.isCompliance && m.val != null && (
            <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${m.val >= 80 ? 'bg-accent' : m.val >= 60 ? 'bg-chart-4' : 'bg-destructive'}`}
                style={{ width: `${m.val}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}