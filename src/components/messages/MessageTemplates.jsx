import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const TEMPLATES = [
  { tag: 'check_in', label: 'Check-in Reminder', text: "Hey! Just a reminder to submit your weekly check-in when you get a chance. Let me know how training and nutrition have been going 💪" },
  { tag: 'check_in', label: 'Great Check-in', text: "Awesome check-in this week! Your consistency is really showing. Keep up the great work and let's build on this momentum!" },
  { tag: 'motivation', label: 'Motivation Boost', text: "Just wanted to check in and say I'm proud of the effort you've been putting in. Some weeks are harder than others — keep showing up and the results will follow 🔥" },
  { tag: 'nutrition', label: 'Nutrition Reminder', text: "Quick reminder to stay on track with your nutrition targets this week. Even 80% compliance makes a huge difference over time. You've got this!" },
  { tag: 'training', label: 'Training Adjustment', text: "I've updated your training program based on your recent progress. Take a look and let me know if you have any questions before your next session." },
  { tag: 'urgent', label: 'Missed Check-in', text: "Hey, I noticed you missed your check-in this week. Everything okay? Let me know if anything came up — I'm here to support you!" },
];

const TAG_COLORS = {
  check_in: 'bg-primary/10 text-primary border-primary/30',
  motivation: 'bg-success/10 text-success border-success/30',
  nutrition: 'bg-warning/10 text-warning border-warning/30',
  training: 'bg-primary/10 text-primary border-primary/30',
  urgent: 'bg-destructive/10 text-destructive border-destructive/30',
  general: 'bg-secondary text-foreground border-border',
};

export default function MessageTemplates({ onSelect, onClose }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">Message Templates</p>
        <button onClick={onClose}><X className="w-4 h-4 text-foreground hover:text-foreground" /></button>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {TEMPLATES.map((t, i) => (
          <button
            key={i}
            onClick={() => { onSelect(t.text, t.tag); onClose(); }}
            className="w-full text-left p-2.5 rounded-lg hover:bg-secondary transition-colors group"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium', TAG_COLORS[t.tag])}>
                {t.tag.replace('_', '-')}
              </span>
              <span className="text-xs font-medium group-hover:text-primary transition-colors">{t.label}</span>
            </div>
            <p className="text-[11px] text-foreground line-clamp-2">{t.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export { TAG_COLORS };