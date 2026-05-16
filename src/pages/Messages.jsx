import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, LayoutTemplate, Sparkles, Mic, Video, Tag, ChevronDown } from 'lucide-react';
import { useUpgradeModal } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import MessageBubble from '../components/messages/MessageBubble';
import PinnedNotes from '../components/messages/PinnedNotes';
import MessageTemplates from '../components/messages/MessageTemplates';
import AISuggestions from '../components/messages/AISuggestions';
import QuickReplies from '../components/messages/QuickReplies';
import { TAG_COLORS } from '../components/messages/MessageTemplates';
import FeatureLock from '@/components/subscription/FeatureLock';
import ClientListSidebar from '../components/messages/ClientListSidebar';

const TAGS = ['general', 'check_in', 'urgent', 'nutrition', 'training', 'motivation'];

export default function Messages() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramClientId = urlParams.get('clientId');
  const paramMessage  = urlParams.get('message');

  const [selectedClientId, setSelectedClientId] = useState(paramClientId || null);
  const [mobileView, setMobileView] = useState(paramClientId ? 'chat' : 'list');
  const [newMessage, setNewMessage] = useState(paramMessage ? decodeURIComponent(paramMessage) : '');
  const [selectedTag, setSelectedTag] = useState('general');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const { openUpgradeModal } = useUpgradeModal();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [clientMessages.length]);

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
    setShowQuickReplies(true);
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
      {/* Sidebar — hidden on mobile when chat is open */}
      <div className={`${mobileView === 'chat' ? 'hidden' : 'flex'} md:flex w-full md:w-72 border-r border-[#E7EAF3] bg-white flex-col flex-shrink-0`}>
        <ClientListSidebar
          clients={clients}
          allMessages={allMessages}
          selectedClientId={selectedClientId}
          onSelectClient={handleSelectClient}
        />
      </div>

      {/* Chat Area */}
      <div className={`${mobileView === 'list' ? 'hidden' : 'flex'} md:flex flex-1 flex-col min-w-0 relative bg-[#F6F7FB]`}>
        {selectedClient ? (
          <>
            {/* Header */}
            <div className="h-14 md:h-16 border-b border-[#E7EAF3] flex items-center px-4 md:px-6 bg-white flex-shrink-0 gap-3">
              {/* Back button on mobile */}
              <button onClick={() => setMobileView('list')} className="md:hidden -ml-1 p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                {selectedClient.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{selectedClient.name}</p>
                <p className="text-xs text-[#374151] truncate">{selectedClient.email}</p>
              </div>
            </div>

            {/* Pinned notes */}
            <PinnedNotes messages={pinnedMessages} onUnpin={handleTogglePin} />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {clientMessages.length === 0 && (
                <p className="text-center text-[#374151] text-sm py-8">No messages yet. Start the conversation!</p>
              )}
              {clientMessages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} onTogglePin={handleTogglePin} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="border-t border-[#E7EAF3] bg-white p-4 flex-shrink-0">
              {/* Tag + toolbar row */}
              <div className="flex items-center gap-2 mb-2">
                {/* Tag picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowTagPicker(!showTagPicker)}
                    className={cn('flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors',
                      selectedTag !== 'general' ? TAG_COLORS[selectedTag] : 'bg-secondary text-[#374151] border-border hover:border-primary'
                    )}
                  >
                    <Tag className="w-3 h-3" />
                    {selectedTag.replace('_', '-')}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showTagPicker && (
                    <div className="absolute bottom-full mb-2 left-0 bg-card border border-border rounded-xl shadow-xl p-2 flex flex-wrap gap-1.5 w-64 z-20">
                      {TAGS.map(t => (
                        <button
                          key={t}
                          onClick={() => { setSelectedTag(t); setShowTagPicker(false); }}
                          className={cn('text-[10px] px-2 py-1 rounded-full border font-medium transition-colors',
                            t !== 'general' ? TAG_COLORS[t] : 'bg-secondary text-[#374151] border-border',
                            selectedTag === t && 'ring-2 ring-primary'
                          )}
                        >
                          {t.replace('_', '-')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Templates */}
                <div className="relative">
                  <button
                    onClick={() => { setShowTemplates(!showTemplates); setShowAI(false); }}
                    className="flex items-center gap-1 text-xs text-[#374151] hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5" /> Templates
                  </button>
                  {showTemplates && (
                    <div className="absolute bottom-full mb-2 left-0 z-20">
                      <MessageTemplates
                        onSelect={(text, tag) => { setNewMessage(text); setSelectedTag(tag || 'general'); }}
                        onClose={() => setShowTemplates(false)}
                      />
                    </div>
                  )}
                </div>

                {/* AI Suggestions — locked via FeatureLock for non-Elite tiers */}
                <FeatureLock feature="ai_suggestions" className="rounded-lg">
                  <div className="relative">
                    <button
                      onClick={() => { setShowAI(!showAI); setShowTemplates(false); }}
                      className="flex items-center gap-1 text-xs text-[#374151] hover:text-primary px-2 py-1 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> AI Reply
                    </button>
                    {showAI && (
                      <div className="absolute bottom-full mb-2 left-0 z-20">
                        <AISuggestions
                          clientName={selectedClient.name}
                          recentMessages={clientMessages}
                          onSelect={(text) => setNewMessage(text)}
                          onClose={() => setShowAI(false)}
                        />
                      </div>
                    )}
                  </div>
                </FeatureLock>

                {/* Voice + Video — locked via FeatureLock for Starter */}
                <div className="ml-auto flex items-center gap-1">
                  <FeatureLock feature="voice_video_messages" className="flex items-center gap-1 rounded-lg">
                    <>
                      <button className="flex items-center gap-1 text-xs text-[#374151] hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary transition-colors">
                        <Mic className="w-3.5 h-3.5" /> Voice
                      </button>
                      <button className="flex items-center gap-1 text-xs text-[#374151] hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary transition-colors">
                        <Video className="w-3.5 h-3.5" /> Video
                      </button>
                    </>
                  </FeatureLock>
                </div>
              </div>

              {/* Quick reply chips */}
              {showQuickReplies && (
                <div className="border-t border-[#F0F2F8] -mx-4 px-4 mb-2">
                  <QuickReplies onSelect={(text) => { setNewMessage(text); setShowQuickReplies(false); }} />
                </div>
              )}

              {/* Input row */}
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={e => { setNewMessage(e.target.value); if (e.target.value) setShowQuickReplies(false); }}
                  placeholder="Type a message..."
                  className="flex-1"
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  onFocus={() => !newMessage && setShowQuickReplies(true)}
                />
                <Button onClick={handleSend} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#374151] gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF4FF] flex items-center justify-center">
              <Send className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm">Select a client to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}