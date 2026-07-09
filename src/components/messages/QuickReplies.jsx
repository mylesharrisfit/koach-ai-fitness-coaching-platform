import React from 'react';

const QUICK_REPLIES = [
  { label: '💪 Great work!', text: 'Great work this week! Keep it up 💪' },
  { label: '📋 Check-in reminder', text: "Hey! Just a reminder to submit your weekly check-in when you get a chance 🙏" },
  { label: '🔥 Stay consistent', text: "Stay consistent — small efforts every day add up to big results 🔥" },
  { label: '🥗 Nutrition nudge', text: "Quick reminder to stay on track with your nutrition targets this week. 80% compliance makes a huge difference!" },
  { label: '✅ Program updated', text: "I've updated your program based on your recent progress. Check it out and let me know if you have questions!" },
  { label: '🤝 How are you doing?', text: "Hey! Just checking in — how are you feeling this week? Any wins or struggles to share?" },
];

export default function QuickReplies({ onSelect }) {
  return (
    <div className="flex gap-1.5 flex-wrap py-2 px-0.5">
      {QUICK_REPLIES.map((r, i) => (
        <button
          key={i}
          onClick={() => onSelect(r.text)}
          className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-accent/10 border border-[#D6E2FF] text-primary hover:bg-primary hover:text-white hover:border-primary transition-colors whitespace-nowrap"
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}