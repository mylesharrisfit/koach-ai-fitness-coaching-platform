import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function Messages() {
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);
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

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const clientMessages = allMessages
    .filter(m => m.client_id === selectedClientId)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  // Group messages by client for sidebar
  const clientMessageCounts = {};
  const clientLastMessages = {};
  allMessages.forEach(m => {
    clientMessageCounts[m.client_id] = (clientMessageCounts[m.client_id] || 0) + (m.is_read === false && m.sender === 'client' ? 1 : 0);
    if (!clientLastMessages[m.client_id] || new Date(m.created_date) > new Date(clientLastMessages[m.client_id].created_date)) {
      clientLastMessages[m.client_id] = m;
    }
  });

  const filteredClients = clients.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

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
    });
    setNewMessage('');
  };

  return (
    <div className="h-screen flex">
      {/* Client List */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading font-bold text-lg mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredClients.map(client => {
            const lastMsg = clientLastMessages[client.id];
            const unread = clientMessageCounts[client.id] || 0;
            return (
              <button
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-all border-b border-border/50",
                  selectedClientId === client.id && "bg-secondary"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {client.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{client.name}</p>
                    {lastMsg && <span className="text-[10px] text-muted-foreground">{format(new Date(lastMsg.created_date), 'MMM d')}</span>}
                  </div>
                  {lastMsg && <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMsg.content}</p>}
                </div>
                {unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                    {unread}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedClient ? (
          <>
            <div className="h-16 border-b border-border flex items-center px-6 bg-card">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mr-3">
                {selectedClient.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">{selectedClient.name}</p>
                <p className="text-xs text-muted-foreground">{selectedClient.email}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {clientMessages.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Start the conversation!</p>
              )}
              {clientMessages.map(msg => (
                <div key={msg.id} className={cn("flex", msg.sender === 'coach' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-3 text-sm",
                    msg.sender === 'coach'
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  )}>
                    <p>{msg.content}</p>
                    <p className={cn("text-[10px] mt-1 opacity-60")}>
                      {format(new Date(msg.created_date), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-3">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <Button onClick={handleSend} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Select a client to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}