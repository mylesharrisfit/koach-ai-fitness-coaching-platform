import React from 'react';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'C';
}

export default function CoachNote({ note, coachName }) {
  if (!note) return null;
  return (
    <div className="mx-4 mb-3 bg-accent border border-accent rounded-[18px] p-4"
      style={{ boxShadow: '0 2px 12px rgb(var(--primary) / 0.08)' }}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-ai flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">{getInitials(coachName)}</span>
        </div>
        <div>
          <p className="text-foreground font-bold text-xs">{coachName || 'Your Coach'}</p>
          <p className="text-muted-foreground text-[10px]">Note from your coach</p>
        </div>
        <span className="ml-auto text-lg">💬</span>
      </div>
      <p className="text-foreground text-sm leading-relaxed italic">"{note}"</p>
    </div>
  );
}