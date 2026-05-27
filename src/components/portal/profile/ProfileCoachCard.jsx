import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function ProfileCoachCard({ client, onMessage }) {
  return (
    <div className="mx-5 mb-2 p-4 rounded-2xl bg-white"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-3">Your Coach</p>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            boxShadow: '0 0 0 3px white, 0 0 0 5px rgba(37,99,235,0.25)',
          }}>
          C
        </div>
        <div className="flex-1">
          <p className="text-slate-900 font-bold text-sm">Your Coach</p>
          <p className="text-slate-400 text-xs">KOACH AI Platform</p>
        </div>
        <button onClick={onMessage}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: '0 2px 10px rgba(37,99,235,0.25)' }}>
          <MessageSquare className="w-3.5 h-3.5" />
          Message
        </button>
      </div>
    </div>
  );
}