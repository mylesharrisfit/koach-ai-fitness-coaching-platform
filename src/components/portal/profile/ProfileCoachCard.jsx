import React from 'react';
import { MessageSquare, Phone } from 'lucide-react';

export default function ProfileCoachCard({ client, onMessage }) {
  return (
    <div className="mx-5 mb-2 p-4 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider mb-3">Your Coach</p>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
          C
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Your Coach</p>
          <p className="text-white/30 text-xs">KOACH AI Platform</p>
        </div>
        <button onClick={onMessage}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-400"
          style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <MessageSquare className="w-3.5 h-3.5" />
          Message
        </button>
      </div>
    </div>
  );
}