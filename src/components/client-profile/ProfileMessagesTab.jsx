import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { toast } from 'sonner';

const TAG_STYLES = {
  urgent:     'bg-red-50 text-red-600 border-red-100',
  check_in:   'bg-blue-50 text-blue-600 border-blue-100',
  nutrition:  'bg-emerald-50 text-emerald-700 border-emerald-100',
  training:   'bg-purple-50 text-purple-700 border-purple-100',
  motivation: 'bg-amber-50 text-amber-700 border-amber-100',
  general:    'bg-[#F6F7FB] text-[#6B7280] border-[#E7EAF3]',
};

function msgDate(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
}

export default function ProfileMessagesTab({ client, messages }) {
  const [text, setText] = useState('');
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: () => base44.entities.Message.create({
      client_id: client.id,
      client_name: client.name,
      sender: 'coach',
      content: text.trim(),
      media_type: 'text',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', client.id] });
      setText('');
      toast.success('Message sent');
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Compose box */}
      <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4 shadow-sm">
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">New Message</p>
        <Textarea
          placeholder={`Write a message to ${client.name}…`}
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          className="resize-none border-[#E7EAF3] text-sm bg-[#F8F9FD] focus:bg-white rounded-xl mb-3 transition-colors"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && text.trim()) {
              sendMutation.mutate();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#9CA3AF]">⌘+Enter to send</span>
          <Button
            size="sm"
            onClick={() => sendMutation.mutate()}
            disabled={!text.trim() || sendMutation.isPending}
            className="gap-1.5 h-8 px-4 text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </Button>
        </div>
      </div>

      {/* Messages thread */}
      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] flex flex-col items-center justify-center py-14 text-center px-6">
          <div className="w-12 h-12 rounded-full bg-[#F6F7FB] flex items-center justify-center mb-3">
            <MessageCircle className="w-5 h-5 text-[#9CA3AF]" />
          </div>
          <p className="text-sm font-semibold text-[#374151]">No messages yet</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Start a conversation with {client.name}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => {
            const isCoach = msg.sender === 'coach';
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  isCoach ? 'justify-end' : 'justify-start'
                )}
              >
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 border',
                  isCoach
                    ? 'bg-primary text-white border-transparent rounded-tr-md'
                    : 'bg-white text-[#1F2A44] border-[#E7EAF3] rounded-tl-md'
                )}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className={cn('text-[10px] font-bold', isCoach ? 'text-white/70' : 'text-[#9CA3AF]')}>
                      {isCoach ? 'You' : client.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {msg.tag && (
                        <span className={cn(
                          'text-[9px] font-bold border rounded px-1 py-0.5',
                          isCoach ? 'bg-white/20 text-white/80 border-white/30' : (TAG_STYLES[msg.tag] || TAG_STYLES.general)
                        )}>
                          {msg.tag}
                        </span>
                      )}
                      <span className={cn('text-[10px]', isCoach ? 'text-white/60' : 'text-[#C4C9D4]')}>
                        {msgDate(msg.created_date)}
                      </span>
                    </div>
                  </div>
                  <p className={cn('text-sm leading-relaxed', isCoach ? 'text-white' : 'text-[#374151]')}>
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}