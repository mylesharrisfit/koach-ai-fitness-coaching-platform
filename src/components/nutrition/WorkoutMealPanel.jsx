import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

const PRE_WORKOUT_OPTIONS = [
  { id: 'banana',       label: 'Banana',              detail: '1 medium · 27g carbs · 105 cal',  cal: 105, p: 1,  c: 27, f: 0 },
  { id: 'rice_cakes',   label: 'Rice Cakes + Honey',  detail: '2 cakes + 1 tsp · 22g carbs · 100 cal', cal: 100, p: 1, c: 22, f: 0 },
  { id: 'oats',         label: 'Oats + Banana',       detail: '½ cup oats + ½ banana · 38g carbs · 190 cal', cal: 190, p: 5, c: 38, f: 2 },
  { id: 'dates',        label: 'Medjool Dates (2)',    detail: '2 dates · 36g carbs · 133 cal',  cal: 133, p: 1,  c: 36, f: 0 },
  { id: 'toast_jam',    label: 'White Toast + Jam',    detail: '1 slice + 1 tbsp · 28g carbs · 130 cal', cal: 130, p: 3, c: 28, f: 1 },
  { id: 'apple',        label: 'Apple + Rice Cake',    detail: '1 apple + 1 cake · 32g carbs · 130 cal', cal: 130, p: 1, c: 32, f: 0 },
];

const POST_WORKOUT_OPTIONS = [
  { id: 'shake_oats',   label: 'Protein Shake + Oats',     detail: '1 scoop + ½ cup · 40P · 50C · 350 cal', cal: 350, p: 40, c: 50, f: 4 },
  { id: 'chicken_rice', label: 'Chicken + White Rice',      detail: '150g chicken + 1 cup rice · 42P · 55C · 390 cal', cal: 390, p: 42, c: 55, f: 5 },
  { id: 'greek_banana', label: 'Greek Yogurt + Banana',     detail: '200g yogurt + 1 banana · 22P · 42C · 270 cal', cal: 270, p: 22, c: 42, f: 2 },
  { id: 'eggs_toast',   label: 'Eggs + Toast + OJ',        detail: '3 eggs + 2 toast + 1 cup OJ · 28P · 50C · 370 cal', cal: 370, p: 28, c: 50, f: 10 },
  { id: 'tuna_rice',    label: 'Tuna + Rice + Veg',        detail: '1 can tuna + 1 cup rice + veg · 38P · 52C · 370 cal', cal: 370, p: 38, c: 52, f: 3 },
  { id: 'shake_fruit',  label: 'Protein Shake + Fruit Bowl', detail: '1 scoop + mixed fruit · 30P · 45C · 310 cal', cal: 310, p: 30, c: 45, f: 3 },
];

function OptionPill({ opt, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(opt.id)}
      className={cn(
        'flex items-start gap-2 px-3 py-2.5 rounded-xl border text-left transition-all w-full',
        selected
          ? 'bg-primary/5 border-primary/40 text-foreground'
          : 'bg-white border-border hover:border-primary/20 hover:bg-secondary/30 text-foreground'
      )}
    >
      <div className={cn(
        'w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors',
        selected ? 'border-primary bg-primary' : 'border-border'
      )}>
        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{opt.label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{opt.detail}</p>
      </div>
    </button>
  );
}

export default function WorkoutMealPanel({ value = {}, onChange }) {
  const [open, setOpen] = useState(false);

  const preSelected = value.pre || null;
  const postSelected = value.post || null;

  const setPreSelected = (id) => onChange({ ...value, pre: preSelected === id ? null : id });
  const setPostSelected = (id) => onChange({ ...value, post: postSelected === id ? null : id });

  const hasSelections = preSelected || postSelected;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">⚡ Workout Meals</span>
            {hasSelections && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                {[preSelected, postSelected].filter(Boolean).length} set
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">Pre & Post workout nutrition</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border">
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {/* Pre-workout */}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">Pre-Workout</span>
                <span className="text-[11px] text-muted-foreground">Light carbs · 30–60 min before</span>
              </div>
              <div className="space-y-1.5">
                {PRE_WORKOUT_OPTIONS.map(opt => (
                  <OptionPill key={opt.id} opt={opt} selected={preSelected === opt.id} onToggle={setPreSelected} />
                ))}
              </div>
            </div>

            {/* Post-workout */}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Post-Workout</span>
                <span className="text-[11px] text-muted-foreground">Protein + carbs · within 30 min</span>
              </div>
              <div className="space-y-1.5">
                {POST_WORKOUT_OPTIONS.map(opt => (
                  <OptionPill key={opt.id} opt={opt} selected={postSelected === opt.id} onToggle={setPostSelected} />
                ))}
              </div>
            </div>
          </div>

          {/* Summary bar */}
          {hasSelections && (
            <div className="px-4 py-3 border-t border-border bg-secondary/20 flex flex-wrap gap-3 text-xs">
              {preSelected && (() => {
                const o = PRE_WORKOUT_OPTIONS.find(x => x.id === preSelected);
                return o ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-600 font-medium">Pre:</span>
                    <span className="text-foreground font-medium">{o.label}</span>
                    <span className="text-muted-foreground">{o.cal} cal · {o.c}g C</span>
                  </span>
                ) : null;
              })()}
              {postSelected && (() => {
                const o = POST_WORKOUT_OPTIONS.find(x => x.id === postSelected);
                return o ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-medium">Post:</span>
                    <span className="text-foreground font-medium">{o.label}</span>
                    <span className="text-muted-foreground">{o.cal} cal · {o.p}g P · {o.c}g C</span>
                  </span>
                ) : null;
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}