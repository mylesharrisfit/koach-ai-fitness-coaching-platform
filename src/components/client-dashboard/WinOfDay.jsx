import React, { useState } from 'react';
import { Star, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const MINDSET_OPTIONS = [
  { score: 1, emoji: '😴', label: 'Tired' },
  { score: 2, emoji: '😕', label: 'Low' },
  { score: 3, emoji: '😐', label: 'Okay' },
  { score: 4, emoji: '😊', label: 'Good' },
  { score: 5, emoji: '🔥', label: 'On fire' },
];

const WIN_PROMPTS = [
  "What's one thing you're proud of today?",
  "Name one small win from today...",
  "What did you do well today?",
  "One positive thing that happened today?",
];

export default function WinOfDay({ win = '', mindsetScore = 0, onWinChange, onMindsetChange }) {
  const [focused, setFocused] = useState(false);
  const prompt = WIN_PROMPTS[new Date().getDay() % WIN_PROMPTS.length];

  return (
    <div className="bg-gradient-to-br from-primary/5 via-card to-accent/5 border border-primary/15 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-sm">Win of the Day</h3>
          <p className="text-[11px] text-muted-foreground">Celebrate every step forward</p>
        </div>
      </div>

      {/* Mindset score */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">How's your energy today?</p>
        <div className="flex gap-2">
          {MINDSET_OPTIONS.map(opt => (
            <button
              key={opt.score}
              onClick={() => onMindsetChange(opt.score)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border transition-all text-xs",
                mindsetScore === opt.score
                  ? "border-primary bg-primary/10 scale-105 shadow-sm"
                  : "border-border hover:border-primary/40 bg-secondary/20"
              )}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className={cn("text-[9px]", mindsetScore === opt.score ? "text-primary font-semibold" : "text-muted-foreground")}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Win text input */}
      <div className={cn(
        "rounded-xl border transition-all p-3",
        focused ? "border-primary bg-background shadow-sm" : "border-border bg-secondary/20"
      )}>
        <textarea
          value={win}
          onChange={e => onWinChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={prompt}
          rows={2}
          className="w-full text-sm bg-transparent outline-none resize-none placeholder:text-muted-foreground/60"
        />
        {win && (
          <div className="flex items-center gap-1 mt-1 pt-2 border-t border-border/50">
            <Star className="w-3 h-3 text-warning fill-warning" />
            <span className="text-[10px] text-warning font-medium">Saved</span>
          </div>
        )}
      </div>
    </div>
  );
}