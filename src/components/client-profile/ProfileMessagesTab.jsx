import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

const TAG_COLORS = {
  urgent: 'bg-red-100 text-red-600',
  check_in: 'bg-blue-100 text-blue-600',
  nutrition: 'bg-emerald-100 text-emerald-700',
  training: 'bg-purple-100 text-purple-700',
  motivation: 'bg-amber-100 text-amber-700',
  general: 'bg-gray-100 text-gray-600',
};

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
    <div className="flex flex-col gap-3">
      {/* Compose */}
      <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
        <Textarea
          placeholder={`Message ${client.name}…`}
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          className="resize-none border-[#E7EAF3] text-sm mb-3"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => sendMutation.mutate()}
            disabled={!text.trim() || sendMutation.isPending}
          >
            <Send className="w-4 h-4" />
            Send
          </Button>
        </div>
      </div>

      {/* Messages list */}
      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] flex flex-col items-center justify-center py-12 text-center px-6">
          <div className="w-12 h-12 rounded-full bg-[#F6F7FB] flex items-center justify-center mb-3">
            <MessageCircle className="w-5 h-5 text-[#9CA3AF]" />
          </div>
          <p className="text-sm font-semibold text-[#374151]">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                'bg-white rounded-2xl border border-[#E7EAF3] px-4 py-3',
                msg.sender === 'coach' && 'border-l-4 border-l-primary'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#374151]">{msg.sender === 'coach' ? 'You' : client.name}</span>
                <div className="flex items-center gap-2">
                  {msg.tag && (
                    <span className={`text-[10px] rounded-md px-1.5 py-0.5 font-medium ${TAG_COLORS[msg.tag] || 'bg-gray-100 text-gray-600'}`}>{msg.tag}</span>
                  )}
                  <span className="text-[10px] text-[#9CA3AF]">
                    {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-[#374151] leading-relaxed">{msg.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}