import React, { useState } from 'react';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect, QuestionLabel, onboardingFieldCls } from './SelectionCard';

const NICHES = [
  { id: 'fat_loss', label: 'Fat loss' },
  { id: 'muscle', label: 'Muscle building' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'strength', label: 'Strength' },
  { id: 'general', label: 'General health' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'performance', label: 'Performance' },
  { id: 'sports', label: 'Sport-specific' },
];

export default function CoachProfileScreen({ onNext, onBack, data }) {
  const [name, setName] = useState(data.business_name || '');
  const [handle, setHandle] = useState(data.social_handle || '');
  const [niche, setNiche] = useState(data.niche || null);

  const canContinue = name.trim().length > 0 && niche;

  return (
    <OnboardingLayout
      eyebrow="Your brand"
      headline="Name your coaching brand."
      subtext="Shown on your client app, emails and package pages."
      onBack={onBack}
      onNext={() => onNext({ business_name: name.trim(), social_handle: handle.trim(), niche })}
      nextDisabled={!canContinue}
    >
      <div className="space-y-6">
        <label className="block space-y-2">
          <QuestionLabel>Business name</QuestionLabel>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Hybrid Life"
            className={`${onboardingFieldCls} h-12`}
          />
        </label>

        <label className="block space-y-2">
          <QuestionLabel>Instagram or other handle (optional)</QuestionLabel>
          <span className="relative block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground">@</span>
            <input
              type="text"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              placeholder="yourhandle"
              className={`${onboardingFieldCls} h-12 pl-8`}
            />
          </span>
        </label>

        <div className="space-y-3">
          <QuestionLabel>What do you coach most?</QuestionLabel>
          <div className="flex flex-wrap gap-2">
            {NICHES.map(n => (
              <ChipSelect key={n.id} label={n.label} selected={niche === n.id} onClick={() => setNiche(n.id)} />
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
