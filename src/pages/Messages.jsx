import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday, isYesterday, format } from 'date-fns';
import MessageBubble, { DateSeparator } from '../components/messages/MessageBubble';
import PinnedNotes from '../components/messages/PinnedNotes';
import ClientListSidebar from '../components/messages/ClientListSidebar';
import ConversationHeader from '../components/messages/ConversationHeader';
import ConversationEmpty from '../components/messages/ConversationEmpty';
import ComposeBar from '../components/messages/ComposeBar.jsx';
import BroadcastModal from '../components/messages/BroadcastModal';

export default function Messages() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramClientId = urlParams.get('clientId');
  const paramMessage  = urlParams.get('message');

  const [selectedClientId, setSelectedClientId] = useState(paramClientId || null);
  const [mobileView, setMobileView] = useState(paramClientId ? 'chat' : 'list');
  const [newMessage, setNewMessage] = useState(paramMessage ? decodeURIComponent(paramMessage) : '');
  const [selectedTag, setSelectedTag] = useState('general');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Message.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const clientMessages = allMessages
    .filter(m => m.client_id === selectedClientId)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const pinnedMessages = clientMessages.filter(m => m.is_pinned);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowJumpToLatest(false);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [clientMessages.length, selectedClientId]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowJumpToLatest(distFromBottom > 200);
  };

  const groupedItems = (() => {
    const items = [];
    let lastDate = null;
    let lastSender = null;
    const msgs = clientMessages;
    msgs.forEach((msg, i) => {
      const d = new Date(msg.created_date);
      const dateKey = format(d, 'yyyy-MM-dd');
      if (dateKey !== lastDate) {
        let label;
        if (isToday(d)) label = 'Today';
        else if (isYesterday(d)) label = 'Yesterday';
        else label = format(d, 'EEEE, MMMM d');
        items.push({ type: 'separator', label, key: `sep-${dateKey}` });
        lastDate = dateKey;
        lastSender = null;
      }
      const isFirst = lastSender !== msg.sender;
      const nextMsg = msgs[i + 1];
      const nextDate = nextMsg ? format(new Date(nextMsg.created_date), 'yyyy-MM-dd') : null;
      const isLast = !nextMsg || nextMsg.sender !== msg.sender || nextDate !== dateKey;
      items.push({ type: 'msg', msg, isFirst, isLast, key: msg.id });
      lastSender = msg.sender;
    });
    return items;
  })();

  const handleSend = () => {
    if (!newMessage.trim() || !selectedClientId) return;
    createMutation.mutate({
      client_id: selectedClientId,
      client_name: selectedClient?.name || '',
      sender: 'coach',
      content: newMessage.trim(),
      is_read: true,
      tag: selectedTag,
      media_type: 'text',
    });
    setNewMessage('');
    setSelectedTag('general');
  };

  const handleTogglePin = (msg) => {
    updateMutation.mutate({ id: msg.id, data: { is_pinned: !msg.is_pinned } });
  };

  const handleSelectClient = (clientId) => {
    setSelectedClientId(clientId);
    setMobileView('chat');
  };

  return (
    <div className="h-[calc(100dvh-64px)] md:h-screen flex overflow-hidden">
      <div className={`${mobileView === 'chat' ? 'hidden' : 'flex'} md:flex w-full md:w-72 border-r border-[#E7EAF3] bg-white flex-col flex-shrink-0`}>
        <ClientListSidebar
          clients={clients}
          allMessages={allMessages}
          selectedClientId={selectedClientId}
          onSelectClient={handleSelectClient}
          onBroadcast={() => setShowBroadcast(true)}
        />
      </div>

      <div className={`${mobileView === 'list' ? 'hidden' : 'flex'} md:flex flex-1 flex-col min-w-0 relative bg-[#F6F7FB]`}>
        {selectedClient ? (
          <>
            <ConversationHeader
              client={selectedClient}
              allMessages={allMessages}
              onBack={() => setMobileView('list')}
              onLogCheckIn={() => {}}
            />

            <PinnedNotes messages={pinnedMessages} onUnpin={handleTogglePin} />

            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-0.5"
            >
              {clientMessages.length === 0 ? (
                <ConversationEmpty client={selectedClient} onSelect={(text) => setNewMessage(text)} />
              ) : (
                groupedItems.map(item =>
                  item.type === 'separator'
                    ? <DateSeparator key={item.key} date={item.label} />
                    : (
                      <MessageBubble
                        key={item.key}
                        msg={item.msg}
                        isFirst={item.isFirst}
                        isLast={item.isLast}
                        onTogglePin={handleTogglePin}
                        clientName={selectedClient.name}
                        clientAvatar={selectedClient.avatar_url}
                      />
                    )
                )
              )}
              <div ref={messagesEndRef} />
            </div>

            {showJumpToLatest && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-24 right-5 flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg hover:bg-primary/90 transition-all z-10"
              >
                <ArrowDown className="w-3.5 h-3.5" /> Jump to latest
              </button>
            )}

            <ComposeBar
              client={selectedClient}
              allMessages={allMessages}
              onSend={handleSend}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              value={newMessage}
              onChange={setNewMessage}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#9CA3AF] gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF4FF] flex items-center justify-center">
              <Send className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm font-medium text-[#6B7280]">Select a client to start messaging</p>
          </div>
        )}
      </div>

      {showBroadcast && (
        <BroadcastModal
          clients={clients}
          onClose={() => setShowBroadcast(false)}
          onSend={(clientIds, message, tag) => {
            clientIds.forEach(cid => {
              const cl = clients.find(c => c.id === cid);
              createMutation.mutate({
                client_id: cid,
                client_name: cl?.name || '',
                sender: 'coach',
                content: message,
                is_read: true,
                tag: tag || 'general',
                is_broadcast: true,
                media_type: 'text',
              });
            });
            setShowBroadcast(false);
          }}
        />
      )}
    </div>
  );
}