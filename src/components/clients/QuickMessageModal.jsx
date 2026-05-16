import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageCircle } from 'lucide-react';

// clients = array of client objects, suggestedTemplate = optional string
export default function QuickMessageModal({ clients = [], suggestedTemplate = '', onClose }) {
  const firstName = clients.length === 1 ? clients[0].name?.split(' ')[0] || clients[0].name : '';
  const defaultMsg = suggestedTemplate
    ? suggestedTemplate.replace('[First Name]', firstName || '[First Name]')
    : '';
  const [content, setContent] = useState(defaultMsg);
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(clients.map(c =>
        base44.entities.Message.create({
          client_id: c.id,
          client_name: c.name,
          sender: 'coach',
          content,
          is_read: false,
          tag: 'general',
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      const names = clients.length === 1
        ? clients[0].name
        : `${clients.length} clients`;
      toast.success(`Message sent to ${names} ✓`);
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-[#E7EAF3]">
          <DialogTitle className="text-base font-bold text-[#1F2A44] flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Quick Message
          </DialogTitle>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {clients.length === 1
              ? `To: ${clients[0].name}`
              : `To: ${clients.length} clients`}
          </p>
        </div>
        <div className="p-4 space-y-3">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Type your message…"
            className="min-h-[96px] text-sm border-[#E7EAF3] bg-[#F6F7FB] resize-none"
            autoFocus
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 text-xs border-[#E7EAF3]" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 text-xs"
              disabled={!content.trim() || sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
            >
              {sendMutation.isPending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}