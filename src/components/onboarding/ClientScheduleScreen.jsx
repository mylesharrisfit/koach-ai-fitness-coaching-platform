import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect, QuestionLabel, SegmentRow } from './SelectionCard';

const DURATIONS = [
  { id: '30', label: '30 min' },
  { id: '45', label: '45 min' },
  { id: '60', label: '60 min' },
  { id: '90', label: '90+ min' },
];

const TIMES = [
  { id: 'early_morning', label: 'Early morning' },
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'late_night', label: 'Late night' },
];

export default function ClientScheduleScreen({ onNext, onBack, data }) {
  const [days, setDays] = useState(data.training_days || 4);
  const [duration, setDuration] = useState(data.workout_duration || null);
  const [time, setTime] = useState(data.workout_time || null);

  return (
    <OnboardingLayout
      eyebrow="Schedule"
      headline="How many days a week can you train?"
      onBack={onBack}
      onNext={() => onNext({ training_days: days, workout_duration: duration, workout_time: time })}
      nextDisabled={!duration}
    >
      <div className="space-y-6">
        <SegmentRow options={[1, 2, 3, 4, 5, 6, 7]} value={days} onChange={setDays} />

        <div className="space-y-3">
          <QuestionLabel>How long can a workout be?</QuestionLabel>
          <SegmentRow options={DURATIONS} value={duration} onChange={setDuration} />
        </div>

        <div className="space-y-3">
          <QuestionLabel>When do you usually train?</QuestionLabel>
          <div className="flex flex-wrap gap-2">
            {TIMES.map(t => (
              <ChipSelect key={t.id} label={t.label} selected={time === t.id} onClick={() => setTime(t.id)} />
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
