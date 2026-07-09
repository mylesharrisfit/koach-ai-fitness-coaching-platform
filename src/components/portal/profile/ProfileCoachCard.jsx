import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function ProfileCoachCard({ client, onMessage }) {
  return (
    <div className="mx-5 mb-2 p-4 rounded-2xl bg-card"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgb(var(--muted))' }}>
      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-wider mb-3">Your Coach</p>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))',
            boxShadow: '0 0 0 3px white, 0 0 0 5px rgb(var(--primary) / 0.25)',
          }}>
          C
        </div>
        <div className="flex-1">
          <p className="text-foreground font-bold text-sm">Your Coach</p>
          <p className="text-muted-foreground text-xs">KOACH AI Platform</p>
        </div>
        <button onClick={onMessage}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))', boxShadow: '0 2px 10px rgb(var(--primary) / 0.25)' }}>
          <MessageSquare className="w-3.5 h-3.5" />
          Message
        </button>
      </div>
    </div>
  );
}