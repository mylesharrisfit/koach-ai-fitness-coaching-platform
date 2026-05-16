import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Pin, Mic, Video, Tag, Check, CheckCheck, Download, FileText, Eye } from 'lucide-react';
import { TAG_COLORS } from './MessageTemplates';

function ReadReceipt({ msg }) {
  if (msg.sender !== 'coach') return null;
  if (msg.is_read) return (
    <span className="flex items-center gap-0.5 text-[10px] text-blue-400 font-medium">
      <CheckCheck className="w-3 h-3" /> Read
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-[#9CA3AF]">
      <Check className="w-3 h-3" /> Sent
    </span>
  );
}

function ImageAttachment({ url }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <img
        src={url}
        alt="attachment"
        onClick={() => setExpanded(true)}
        className="max-w-[220px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity mt-1 object-cover"
      />
      {expanded && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
          onClick={() => setExpanded(false)}
        >
          <img src={url} alt="full" className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl" />
        </div>
      )}
    </>
  );
}

function FileAttachment({ url, isCoach }) {
  const fileName = url.split('/').pop()?.split('?')[0] || 'attachment';
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 mt-1 px-3 py-2 rounded-xl border transition-colors',
        isCoach
          ? 'border-white/20 bg-white/10 hover:bg-white/20'
          : 'border-[#E7EAF3] bg-[#F6F7FB] hover:bg-[#EEF4FF]'
      )}
    >
      <FileText className={cn('w-4 h-4 flex-shrink-0', isCoach ? 'text-white/70' : 'text-primary')} />
      <span className={cn('text-xs font-medium truncate max-w-[160px]', isCoach ? 'text-white/90' : 'text-[#374151]')}>
        {fileName}
      </span>
      <Download className={cn('w-3.5 h-3.5 flex-shrink-0 ml-auto', isCoach ? 'text-white/70' : 'text-primary')} />
    </a>
  );
}

export function DateSeparator({ date }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[#E7EAF3]" />
      <span className="text-[11px] font-semibold text-[#9CA3AF] px-2">{date}</span>
      <div className="flex-1 h-px bg-[#E7EAF3]" />
    </div>
  );
}

export default function MessageBubble({ msg, onTogglePin, isFirst = true, isLast = true, clientName, clientAvatar }) {
  const isCoach = msg.sender === 'coach';

  // Detect media type from URL
  const url = msg.media_url;
  const isImage = url && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
  const isFile = url && !isImage && msg.media_type === 'text';

  return (
    <div className={cn('flex group gap-2', isCoach ? 'flex-row-reverse' : 'flex-row', !isFirst && 'mt-0.5')}>
      {/* Client avatar — only on first message in group */}
      {!isCoach && (
        <div className="flex-shrink-0 self-end w-7">
          {isLast ? (
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[11px] overflow-hidden">
              {clientAvatar
                ? <img src={clientAvatar} alt={clientName} className="w-full h-full object-cover" />
                : (clientName?.[0] || '?').toUpperCase()
              }
            </div>
          ) : null}
        </div>
      )}

      <div className={cn('max-w-[72%] flex flex-col', isCoach ? 'items-end' : 'items-start')}>
        {/* Tag */}
        {msg.tag && msg.tag !== 'general' && isFirst && (
          <div className={cn('flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium w-fit mb-1', TAG_COLORS[msg.tag] || '')}>
            <Tag className="w-2.5 h-2.5" />
            {msg.tag.replace('_', '-')}
          </div>
        )}

        <div className="flex items-end gap-1.5">
          {/* Pin button */}
          <button
            onClick={() => onTogglePin(msg)}
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-[#F6F7FB]',
              isCoach ? 'order-last' : 'order-first'
            )}
          >
            <Pin className={cn('w-3 h-3', msg.is_pinned ? 'text-amber-400 fill-amber-400' : 'text-[#9CA3AF]')} />
          </button>

          {/* Bubble */}
          <div className={cn(
            'px-4 py-2.5 text-sm leading-relaxed',
            isCoach
              ? 'text-white'
              : 'bg-white border border-[#E7EAF3] text-[#1F2A44] shadow-sm',
            // Rounding based on position in group
            isCoach && isFirst && isLast && 'rounded-2xl rounded-br-md',
            isCoach && isFirst && !isLast && 'rounded-2xl rounded-br-sm',
            isCoach && !isFirst && isLast && 'rounded-xl rounded-br-md',
            isCoach && !isFirst && !isLast && 'rounded-xl',
            !isCoach && isFirst && isLast && 'rounded-2xl rounded-bl-md',
            !isCoach && isFirst && !isLast && 'rounded-2xl rounded-bl-sm',
            !isCoach && !isFirst && isLast && 'rounded-xl rounded-bl-md',
            !isCoach && !isFirst && !isLast && 'rounded-xl',
            msg.is_pinned && 'ring-2 ring-amber-400/50',
            isCoach && 'bg-gradient-to-br from-blue-500 to-violet-600',
          )}>
            {/* Voice */}
            {msg.media_type === 'voice' && (
              <div className="flex items-center gap-2 mb-1">
                <Mic className="w-3.5 h-3.5 opacity-70" />
                <span className="text-xs opacity-70">Voice Note</span>
                {url && <audio controls src={url} className="h-6 max-w-[140px]" />}
              </div>
            )}
            {/* Video */}
            {msg.media_type === 'video' && (
              <div className="flex items-center gap-2 mb-1">
                <Video className="w-3.5 h-3.5 opacity-70" />
                <span className="text-xs opacity-70">Video Reply</span>
                {url && <video controls src={url} className="max-w-[200px] rounded mt-1" />}
              </div>
            )}
            {/* Image attachment */}
            {isImage && <ImageAttachment url={url} />}
            {/* File attachment */}
            {isFile && url && <FileAttachment url={url} isCoach={isCoach} />}

            {msg.content && <p>{msg.content}</p>}
          </div>
        </div>

        {/* Timestamp + read receipt — only on last in group */}
        {isLast && (
          <div className={cn('flex items-center gap-1.5 mt-1 px-1', isCoach ? 'flex-row-reverse' : 'flex-row')}>
            <span className="text-[10px] text-[#9CA3AF]">
              {format(new Date(msg.created_date), 'h:mm a')}
            </span>
            <ReadReceipt msg={msg} />
          </div>
        )}
      </div>
    </div>
  );
}