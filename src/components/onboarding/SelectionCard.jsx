import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** White selectable row; selected = 2px ink border + ink check. No glow. */
export function SelectionCard({ label, description, icon: Icon, selected, onClick, size = 'md' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!selected}
      className={cn(
        'flex w-full items-center gap-4 rounded-xl bg-card text-left transition-shadow',
        size === 'sm' ? 'px-4 py-3' : 'px-4 py-3.5',
        selected
          ? 'shadow-[inset_0_0_0_2px_rgb(var(--foreground))]'
          : 'shadow-[inset_0_0_0_1px_rgb(var(--border))] hover:shadow-[inset_0_0_0_1px_rgb(var(--input))]'
      )}
    >
      {Icon && <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-foreground">{label}</span>
        {description && <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{description}</span>}
      </span>
      <span className={cn(
        'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
        selected ? 'bg-primary text-primary-foreground' : 'border-[1.5px] border-input'
      )}>
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

export function ChipSelect({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!selected}
      className={cn(
        'touch-compact h-10 rounded-full px-4 text-[15px] font-medium transition-colors',
        selected ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground shadow-[inset_0_0_0_1px_rgb(var(--input))] hover:bg-accent'
      )}
    >
      {label}
    </button>
  );
}

/** Question label above a group of options. */
export function QuestionLabel({ children, className }) {
  return <p className={cn('text-[15px] font-semibold text-foreground', className)}>{children}</p>;
}

/** Text input / textarea classes for onboarding forms. */
export const onboardingFieldCls =
  'w-full rounded-lg border border-input bg-card px-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground';

/** Equal-width options in one row (days per week, meals per day). */
export function SegmentRow({ options, value, onChange, className }) {
  return (
    <div className={cn('flex gap-2', className)}>
      {options.map(o => {
        const id = typeof o === 'object' ? o.id : o;
        const label = typeof o === 'object' ? o.label : o;
        const on = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={on}
            className={cn(
              'touch-compact h-12 flex-1 rounded-lg px-2 text-[15px] font-semibold transition-colors',
              on ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground shadow-[inset_0_0_0_1px_rgb(var(--border))] hover:bg-accent'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Big-number input tile (age, weight). */
export function NumberTile({ label, value, onChange, unit, placeholder }) {
  return (
    <label className="flex flex-1 flex-col gap-1 rounded-xl bg-card px-4 py-3.5 shadow-[inset_0_0_0_1px_rgb(var(--border))] focus-within:shadow-[inset_0_0_0_2px_rgb(var(--foreground))]">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <input
          type="number"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="num w-full min-w-0 border-0 bg-transparent p-0 text-[34px] leading-none text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </span>
    </label>
  );
}
