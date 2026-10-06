import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect, onboardingFieldCls } from './SelectionCard';

const PROMPTS = ['Confidence', 'Family', 'Performance', 'Discipline', 'Health', 'Longevity', 'Strength', 'Freedom'];

export default function ClientWhyScreen({ onNext, onBack, data }) {
  const [why, setWhy] = useState(data.motivation || '');

  return (
    <OnboardingLayout
      eyebrow="Your why"
      headline="Why does this matter to you?"
      subtext="Your coach brings this up on the hard weeks. Be honest."
      onBack={onBack}
      onNext={() => onNext({ motivation: why })}
      nextDisabled={why.trim().length < 3}
      nextLabel="Next"
    >
      <div className="space-y-5">
        <div className="relative">
          <textarea
            value={why}
            onChange={e => setWhy(e.target.value)}
            placeholder="I want to keep up with my kids and stop feeling tired by 3pm"
            rows={6}
            className={`${onboardingFieldCls} resize-none py-3 leading-relaxed`}
          />
          <div className="absolute bottom-3 right-4 text-xs tabular-nums text-muted-foreground">
            {why.length}/500
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Stuck? Tap a word to add it.</p>
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map(p => (
              <ChipSelect key={p} label={`+ ${p}`} selected={false} onClick={() => setWhy(w => w ? `${w}, ${p.toLowerCase()}` : p)} />
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
