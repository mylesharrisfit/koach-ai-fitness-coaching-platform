import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import {
  Send, ArrowLeft, MessageSquare, ChevronRight, Mic, Image as ImageIcon,
  Paperclip, BarChart2, ClipboardList, Plus, X
} from 'lucide-react';

/* ── helpers ── */
function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  for (const m of messages) {
    const d = m.created_date ? format(new Date(m.created_date), 'yyyy-MM-dd') : null;
    if (d !== lastDate) {
      const date = m.created_date ? new Date(m.created_date) : new Date();
      const label = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMMM d');
      groups.push({ type: 'separator', label });
      lastDate = d;
    }
    groups.push({ type: 'message', data: m });
  }
  return groups;
}

const QUICK_REPLIES = [
  "Thanks coach! 🙌", "Got it, will work on that!", "On it! 💪",
  "Can we chat?", "I have a question", "Just finished my workout! 💪"
];

const SUGGESTED_OPENERS = [
  "Hey Coach, I just got started! 👋",
  "I have a question about my program",
  "When should I expect my program?"
];

/* ── Message Bubble ── */
function MessageBubble({ msg, coachInitial }) {
  const isClient = msg.sender === 'client';
  const time = msg.created_date ? format(new Date(msg.created_date), 'h:mm a') : '';

  // System message detection
  const isSystem = msg.is_broadcast;

  return (
    <div className={`flex gap-2 ${isClient ? 'justify-end' : 'justify-start'}`}>
      {!isClient && (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-auto"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: 'white' }}>
          {coachInitial}
        </div>
      )}
      <div className={`max-w-[78%] ${isClient ? '' : ''}`}>
        <div className={`px-4 py-3 rounded-2xl ${isClient ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
          style={{
            background: isClient
              ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
              : isSystem
                ? 'rgba(99,102,241,0.15)'
                : 'rgba(255,255,255,0.09)',
            border: isSystem ? '1px solid rgba(99,102,241,0.3)' : 'none',
          }}>
          {isSystem && <p className="text-indigo-400 text-[9px] font-bold uppercase tracking-wider mb-1">🤖 KOACH AI</p>}
          {msg.media_type === 'voice' && msg.media_url ? (
            <div className="flex items-center gap-3">
              <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">▶</span>
              </button>
              <div className="flex-1 h-1 rounded-full bg-white/20">
                <div className="w-1/3 h-full bg-white/60 rounded-full" />
              </div>
              <span className="text-white/60 text-xs">0:15</span>
            </div>
          ) : (
            <p className="text-white text-sm leading-relaxed">{msg.content}</p>
          )}
        </div>
        <p className={`text-white/20 text-[9px] mt-1 ${isClient ? 'text-right' : 'text-left'}`}>{time}</p>
      </div>
    </div>
  );
}

/* ── Conversation view ── */
function ConversationView({ myClient, onBack }) {
  const [input, setInput] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['portal-msgs-conv', myClient?.id],
    queryFn: () => base44.entities.Message.filter({ client_id: myClient.id }, '-created_date', 100),
    enabled: !!myClient?.id,
    refetchInterval: 10000,
  });

  const sorted = [...messages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  const grouped = groupByDate(sorted);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark read
  useEffect(() => {
    const unread = messages.filter(m => m.sender === 'coach' && !m.is_read);
    unread.forEach(m => base44.entities.Message.update(m.id, { is_read: true }).catch(() => {}));
  }, [messages]);

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || !myClient?.id) return;
    setInput('');
    setShowQuickReplies(false);
    await base44.entities.Message.create({
      client_id: myClient.id,
      client_name: myClient.name,
      sender: 'client',
      content,
    });
    refetch();
  };

  const coachInitial = 'C';

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0A0F1A' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
          {coachInitial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">Your Coach</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p className="text-emerald-400 text-[10px]">Active</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 140px)' }}>
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
              {coachInitial}
            </div>
            <p className="text-white/50 text-sm font-semibold mb-1">Start a conversation</p>
            <p className="text-white/25 text-xs mb-6">Your coach is ready to help!</p>
            <div className="space-y-2 w-full max-w-xs">
              {SUGGESTED_OPENERS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="w-full p-3 rounded-xl text-sm text-white/60 text-left"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {grouped.map((item, i) => (
          item.type === 'separator'
            ? <p key={i} className="text-center text-white/20 text-[9px] font-semibold uppercase tracking-wider py-2">{item.label}</p>
            : <MessageBubble key={item.data.id} msg={item.data} coachInitial={coachInitial} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick Replies */}
      {showQuickReplies && sorted.length > 0 && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide flex-shrink-0">
          {QUICK_REPLIES.map(r => (
            <button key={r} onClick={() => sendMessage(r)}
              className="px-3 py-1.5 rounded-full text-xs text-white/60 whitespace-nowrap flex-shrink-0 transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Compose */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center gap-2"
        style={{ background: 'rgba(13,17,28,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
        <button onClick={() => setShowAttach(!showAttach)}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <Plus className="w-4 h-4 text-white/50" />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Message Coach..."
          className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <button onClick={() => sendMessage()}
          disabled={!input.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
          style={{ background: input.trim() ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' : 'rgba(255,255,255,0.07)' }}>
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Attach menu */}
      <AnimatePresence>
        {showAttach && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-4 right-4 p-3 rounded-2xl grid grid-cols-4 gap-2"
            style={{ background: '#151B27', border: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { icon: <Paperclip className="w-5 h-5 text-white/50" />, label: 'File' },
              { icon: <ImageIcon className="w-5 h-5 text-white/50" />, label: 'Photo' },
              { icon: <BarChart2 className="w-5 h-5 text-white/50" />, label: 'Progress' },
              { icon: <ClipboardList className="w-5 h-5 text-white/50" />, label: 'Check-in' },
            ].map(({ icon, label }) => (
              <button key={label} onClick={() => setShowAttach(false)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                {icon}
                <span className="text-white/40 text-[9px]">{label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function PortalMessages({ user }) {
  const [view, setView] = useState('conversation'); // auto-open conversation

  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-msgs', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];

  const { data: messages = [] } = useQuery({
    queryKey: ['portal-msgs-home', myClient?.id],
    queryFn: () => base44.entities.Message.filter({ client_id: myClient.id }, '-created_date', 20),
    enabled: !!myClient?.id,
    refetchInterval: 15000,
  });

  const sorted = [...messages].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const lastMsg = sorted[0];
  const unread = messages.filter(m => m.sender === 'coach' && !m.is_read).length;

  if (view === 'conversation' && myClient) {
    return <ConversationView myClient={myClient} onBack={() => setView('home')} />;
  }

  return (
    <div className="px-5 pt-12 pb-28 space-y-5">
      {/* Header */}
      <div>
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Messages</p>
        <h1 className="text-white text-xl font-bold mt-0.5">Messages</h1>
      </div>

      {/* Coach Card */}
      <motion.button whileTap={{ scale: 0.98 }} onClick={() => setView('conversation')}
        className="w-full p-5 rounded-2xl text-left relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))', border: '1.5px solid rgba(59,130,246,0.25)' }}>
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
              C
            </div>
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-[#0A0F1A] bg-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-white font-bold text-base">Your Coach</p>
              {unread > 0 && (
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ background: '#3B82F6' }}>
                  {unread}
                </motion.span>
              )}
            </div>
            <p className="text-white/40 text-xs mb-3">Your Personal Coach</p>
            {lastMsg ? (
              <p className="text-white/50 text-sm line-clamp-1">{lastMsg.sender === 'coach' ? '' : 'You: '}{lastMsg.content}</p>
            ) : (
              <p className="text-white/30 text-sm italic">Start a conversation...</p>
            )}
            {lastMsg?.created_date && (
              <p className="text-white/25 text-[10px] mt-1">{format(new Date(lastMsg.created_date), 'MMM d, h:mm a')}</p>
            )}
          </div>
        </div>
        <button onClick={() => setView('conversation')}
          className="w-full mt-4 py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
          <MessageSquare className="w-4 h-4" />
          Message Coach
        </button>
      </motion.button>

      {/* System messages / announcements */}
      {messages.filter(m => m.is_broadcast).length > 0 && (
        <div>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Announcements</p>
          <div className="space-y-2">
            {messages.filter(m => m.is_broadcast).slice(0, 3).map(m => (
              <div key={m.id} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-indigo-400 text-[9px] font-bold uppercase tracking-wider mb-1">🤖 KOACH AI</p>
                <p className="text-white/60 text-sm">{m.content}</p>
                <p className="text-white/20 text-[9px] mt-1">{m.created_date ? format(new Date(m.created_date), 'MMM d') : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="pt-8 text-center">
          <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No messages yet</p>
          <p className="text-white/15 text-xs mt-1">Tap "Message Coach" to start</p>
        </div>
      )}
    </div>
  );
}