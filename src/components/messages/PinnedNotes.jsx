import React from 'react';
import { Pin, X } from 'lucide-react';
import { format } from 'date-fns';

export default function PinnedNotes({ messages, onUnpin }) {
  if (!messages.length) return null;
  return (
    <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2">
      <div className="flex items-center gap-2 mb-2">
        <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        <span className="text-xs font-semibold text-amber-400">Pinned Notes ({messages.length})</span>
      </div>
      <div className="space-y-1">
        {messages.map(m => (
          <div key={m.id} className="flex items-start justify-between gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
            <p className="text-xs text-foreground line-clamp-1 flex-1">{m.content}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-[#374151]">{format(new Date(m.created_date), 'MMM d')}</span>
              <button onClick={() => onUnpin(m)}><X className="w-3 h-3 text-[#374151] hover:text-destructive" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}