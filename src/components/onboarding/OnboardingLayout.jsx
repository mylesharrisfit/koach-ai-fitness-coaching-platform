import React from 'react';
import { ChevronLeft } from 'lucide-react';

/** Kept for compatibility with older imports; no entrance animation now. */
const stagger = {
  container: { initial: {}, animate: {} },
  item: { initial: {}, animate: {} },
};

/**
 * One question per screen, page-13 style: back row, step eyebrow, condensed
 * h1, options, and a sticky Back (outline) + Next (ink) footer.
 */
export default function OnboardingLayout({
  eyebrow,
  headline,
  subtext,
  children,
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  hideNext = false,
}) {
  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Top row */}
      {(onBack || eyebrow) && (
        <div className="flex-shrink-0 px-5 pt-4">
          <div className="mx-auto flex w-full max-w-lg items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Back"
                className="touch-compact flex h-11 w-11 items-center justify-center rounded-lg bg-card text-foreground shadow-[0_0_0_1px_rgb(var(--border))]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {eyebrow && <p className="text-[15px] font-semibold text-foreground">{eyebrow}</p>}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-8 pt-5">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
          <div>
            <h1 className="text-[32px] leading-[1.04] text-foreground sm:text-[36px]">{headline}</h1>
            {subtext && <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{subtext}</p>}
          </div>
          <div className="w-full">{children}</div>
        </div>
      </div>

      {/* Sticky footer */}
      {!hideNext && (
        <div className="flex-shrink-0 border-t border-border bg-background px-5 pt-3" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
          <div className="mx-auto flex w-full max-w-lg gap-2">
            {onBack && (
              <button onClick={onBack} className="h-12 rounded-lg border border-input bg-card px-5 text-[15px] font-semibold text-foreground hover:bg-accent">
                Back
              </button>
            )}
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className="h-12 flex-1 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            >
              {nextLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { stagger };
