import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Pin, Mic, Video, Tag } from 'lucide-react';
import { TAG_COLORS } from './MessageTemplates';

export default function MessageBubble({ msg, onTogglePin }) {
  const isCoach = msg.sender === 'coach';

  return (
    <div className={cn('flex group', isCoach ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[72%] space-y-1', isCoach ? 'items-end' : 'items-start', 'flex flex-col')}>
        {/* Tag */}
        {msg.tag && msg.tag !== 'general' && (
          <div className={cn('flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium w-fit', TAG_COLORS[msg.tag] || '')}>
            <Tag className="w-2.5 h-2.5" />
            {msg.tag.replace('_', '-')}
          </div>
        )}

        <div className="flex items-end gap-1.5">
          {/* Pin button */}
          <button
            onClick={() => onTogglePin(msg)}
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-secondary',
              isCoach ? 'order-first' : 'order-last'
            )}
          >
            <Pin className={cn('w-3 h-3', msg.is_pinned ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground')} />
          </button>

          <div className={cn(
            'rounded-2xl px-4 py-3 text-sm',
            isCoach ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border rounded-bl-md',
            msg.is_pinned && 'ring-2 ring-amber-400/50'
          )}>
            {/* Media indicators */}
            {msg.media_type === 'voice' && (
              <div className="flex items-center gap-2 mb-1">
                <Mic className="w-3.5 h-3.5 opacity-70" />
                <span className="text-xs opacity-70">Voice Note</span>
                {msg.media_url && <audio controls src={msg.media_url} className="h-6 max-w-[140px]" />}
              </div>
            )}
            {msg.media_type === 'video' && (
              <div className="flex items-center gap-2 mb-1">
                <Video className="w-3.5 h-3.5 opacity-70" />
                <span className="text-xs opacity-70">Video Reply</span>
                {msg.media_url && <video controls src={msg.media_url} className="max-w-[200px] rounded mt-1" />}
              </div>
            )}
            <p className="leading-relaxed">{msg.content}</p>
            <p className="text-[10px] mt-1 opacity-60">{format(new Date(msg.created_date), 'h:mm a')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}