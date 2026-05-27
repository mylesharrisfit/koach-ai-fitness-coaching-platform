import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Send, LayoutTemplate, Tag, ChevronDown, Plus, X,
  Paperclip, Image, ClipboardList, Salad, CheckSquare, BarChart2,
  Mic, Video, Check, Link
} from 'lucide-react';
import { cn } from '@/lib/utils';
import FeatureLock from '@/components/subscription/FeatureLock';
import { TAG_COLORS } from './MessageTemplates';
import { differenceInDays } from 'date-fns';
import AIReplyAssistant from './AIReplyAssistant';

const TAGS = ['general', 'check_in', 'urgent', 'nutrition', 'training', 'motivation'];

const TEMPLATE_CATEGORIES = [
  {
    key: 'onboarding', emoji: '👋', label: 'Onboarding',
    templates: [
      { label: 'Welcome!', text: "Welcome to the team! I'm so excited to work with you. Feel free to message me any time with questions 🎉" },
      { label: 'Getting Started', text: "Hey! Your program and nutrition plan are all set up. Start with Day 1 whenever you feel ready — I'll be checking in 💪" },
      { label: 'First Check-in', text: "Hi! Quick reminder to submit your first weekly check-in when you get a chance 🙏" },
    ]
  },
  {
    key: 'motivation', emoji: '💪', label: 'Motivation',
    templates: [
      { label: 'Great Progress', text: "Just wanted to say — your progress lately has been seriously impressive. Keep trusting the process 🔥" },
      { label: 'Milestone', text: "You hit a major milestone this week and I couldn't be more proud! This is what consistency looks like 🏆" },
      { label: 'Encouragement', text: "Some weeks are harder than others — that's part of the journey. Keep showing up! 💙" },
    ]
  },
  {
    key: 'checkin', emoji: '📋', label: 'Check-in',
    templates: [
      { label: 'Check-in Reminder', text: "Hey! Just a reminder to submit your weekly check-in when you get a chance 💪" },
      { label: 'Great Check-in', text: "Awesome check-in this week! Your consistency is really showing. Let's build on this momentum!" },
      { label: 'Follow-up', text: "Reviewed your check-in — a few things I want to go over. Can you jump on a quick call this week?" },
    ]
  },
  {
    key: 'reengagement', emoji: '⚠️', label: 'Re-engagement',
    templates: [
      { label: 'Miss You!', text: "Hey, I noticed it's been a little quiet — everything okay? I'm here whenever you need me 👊" },
      { label: 'Missed Check-in', text: "Hey, I noticed you missed your check-in this week. Everything okay? Let me know!" },
      { label: 'Win-Back', text: "Whenever you're ready to pick back up, I'm here with a fresh plan and zero judgment 💙" },
    ]
  },
  {
    key: 'progress', emoji: '📈', label: 'Progress Review',
    templates: [
      { label: 'Program Update', text: "I've updated your training program based on your recent progress. Take a look and let me know if you have questions!" },
      { label: 'Nutrition Adjustment', text: "Based on your last few check-ins I've adjusted your calories and macros slightly. Changes are live in the app!" },
      { label: 'Monthly Review', text: "Time for a monthly review! Let's chat about what's working, what to tweak, and goals for next month 📅" },
    ]
  },
];

const ATTACH_OPTIONS = [
  { icon: Paperclip,    label: 'Attach File',          key: 'file',     color: 'text-gray-500' },
  { icon: Image,        label: 'Send Photo',           key: 'photo',    color: 'text-blue-500' },
  { icon: ClipboardList,label: 'Share Program',        key: 'program',  color: 'text-primary' },
  { icon: Salad,        label: 'Share Meal Plan',      key: 'meal',     color: 'text-emerald-500' },
  { icon: CheckSquare,  label: 'Request Check-in',     key: 'checkin',  color: 'text-amber-500' },
  { icon: BarChart2,    label: 'Share Progress Report',key: 'progress', color: 'text-purple-500' },
];

function getContextualChips(client, messages, checkIns = []) {
  const clientMessages = messages.filter(m => m.client_id === client?.id);
  const lastClientMsg = [...clientMessages].reverse().find(m => m.sender === 'client');
  const sortedCI = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastCheckIn = sortedCI[0];
  const daysSinceCheckin = lastCheckIn ? differenceInDays(new Date(), new Date(lastCheckIn.date)) : 999;
  const daysSinceMessage = lastClientMsg ? differenceInDays(new Date(), new Date(lastClientMsg.created_date)) : 999;
  const hasRecentCheckin = daysSinceCheckin <= 2;
  const isInactive = daysSinceMessage > 5;
  const isNewClient = client?.start_date && differenceInDays(new Date(), new Date(client.start_date)) <= 7;

  if (hasRecentCheckin) return [
    { label: '⭐ Great work!', text: "Great work on this week's check-in! Keep that consistency going 💪" },
    { label: '❤️ Love the consistency!', text: "Love seeing the consistency in your check-ins — it's making a real difference!" },
    { label: '📊 Review numbers', text: "Thanks for checking in! Let me review your numbers and get back to you shortly 👍" },
  ];
  if (isNewClient) return [
    { label: "💪 How's the program?", text: "Hey! How's the program feeling so far? Any questions on the workouts?" },
    { label: '❓ Any questions?', text: "Just checking in — any questions on the workouts or nutrition plan?" },
    { label: "🙌 You've got this!", text: "You've got this! Just take it one day at a time 💙" },
  ];
  if (isInactive) return [
    { label: '👋 Just checking in', text: "Just checking in 👋 How are things going?" },
    { label: '💭 How are things?', text: "Hey! How are things going? Miss seeing you active in the app!" },
    { label: '😊 Miss you!', text: "Miss you in the app! Everything okay? Here if you need anything 💙" },
  ];
  return [
    { label: '💪 Great work!', text: 'Great work this week! Keep it up 💪' },
    { label: '📋 Check-in reminder', text: "Hey! Just a reminder to submit your weekly check-in 🙏" },
    { label: '🔥 Stay consistent', text: "Stay consistent — small efforts every day add up to big results 🔥" },
    { label: '🤝 How are you doing?', text: "Hey! Just checking in — how are you feeling this week?" },
  ];
}


function TemplatesDrawer({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState(TEMPLATE_CATEGORIES[0].key);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState('');
  const [customTemplates, setCustomTemplates] = useState([]);
  const [saveText, setSaveText] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const cat = TEMPLATE_CATEGORIES.find(c => c.key === activeCategory);
  const allTemplates = [...(cat?.templates || []), ...customTemplates.filter(t => t.category === activeCategory)];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E7EAF3]">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-[#1F2A44]">Message Templates</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>
        <div className="flex gap-1 px-3 py-2 border-b border-[#F0F2F8] overflow-x-auto">
          {TEMPLATE_CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setActiveCategory(c.key)}
              className={cn('flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all',
                activeCategory === c.key ? 'bg-primary text-white' : 'bg-[#F6F7FB] text-[#6B7280] hover:bg-[#EEF4FF] hover:text-primary'
              )}>
              <span>{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {allTemplates.map((t, i) => (
            <div key={i} className="rounded-xl border border-[#E7EAF3] bg-[#F9FAFB] hover:border-primary/30 transition-all group">
              {editingIdx === i ? (
                <div className="p-3">
                  <textarea className="w-full text-xs rounded-lg border border-primary/30 p-2 resize-none outline-none focus:ring-1 focus:ring-primary bg-white" rows={4} value={editText} onChange={e => setEditText(e.target.value)} />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { onSelect(editText, 'general'); onClose(); }} className="text-[11px] font-semibold px-3 py-1 bg-primary text-white rounded-full">Send This</button>
                    <button onClick={() => setEditingIdx(null)} className="text-[11px] text-[#6B7280] underline">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  <p className="text-xs font-semibold text-[#1F2A44] mb-1">{t.label}</p>
                  <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">{t.text}</p>
                  <div className="flex gap-2 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { onSelect(t.text, 'general'); onClose(); }} className="text-[11px] font-semibold px-2.5 py-1 bg-primary text-white rounded-full hover:bg-primary/90">Use</button>
                    <button onClick={() => { setEditingIdx(i); setEditText(t.text); }} className="text-[11px] font-semibold px-2.5 py-1 border border-primary/30 text-primary bg-white rounded-full hover:bg-primary/5">Edit</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-[#E7EAF3] p-3">
          {showSaveInput ? (
            <div className="space-y-2">
              <textarea className="w-full text-xs rounded-lg border border-[#E7EAF3] p-2 resize-none outline-none focus:ring-1 focus:ring-primary" placeholder="Type your custom template…" rows={3} value={saveText} onChange={e => setSaveText(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => { if (saveText.trim()) { setCustomTemplates(prev => [...prev, { label: 'My Template', text: saveText.trim(), category: activeCategory }]); setSaveText(''); setShowSaveInput(false); } }} className="text-[11px] font-semibold px-3 py-1 bg-primary text-white rounded-full">Save</button>
                <button onClick={() => setShowSaveInput(false)} className="text-[11px] text-[#6B7280] underline">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowSaveInput(true)} className="w-full text-xs text-primary font-semibold flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-primary/30 hover:bg-primary/5 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Save as Template
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AttachmentMenu({ onSelect, onClose }) {
  return (
    <div className="absolute bottom-full mb-2 left-0 z-30 bg-white border border-[#E7EAF3] rounded-2xl shadow-xl p-2 w-52">
      <div className="grid grid-cols-2 gap-1">
        {ATTACH_OPTIONS.map(opt => (
          <button key={opt.key} onClick={() => { onSelect(opt.key); onClose(); }}
            className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl hover:bg-[#F6F7FB] transition-colors text-center">
            <opt.icon className={opt.color} style={{ width: 18, height: 18 }} />
            <span className="text-[10px] font-medium text-[#374151] leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function VoiceRecorder({ onDone, onCancel }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
      <div className="flex-1 flex items-center gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-0.5 bg-red-400 rounded-full" style={{ height: `${6 + Math.abs(Math.sin(i * 0.8)) * 8}px` }} />
        ))}
      </div>
      <span className="text-xs font-mono text-red-600 tabular-nums flex-shrink-0">
        {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
      </span>
      <button onClick={onDone} className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex-shrink-0">Send</button>
      <button onClick={onCancel} className="text-[11px] text-[#9CA3AF] hover:text-gray-600 flex-shrink-0">✕</button>
    </div>
  );
}

function VideoLinkPopover({ clientName, onInsert, onClose }) {
  const [link] = useState(() => `https://meet.jit.si/koach-${Math.random().toString(36).slice(2, 8)}`);
  const [copied, setCopied] = useState(false);
  return (
    <div className="absolute bottom-full mb-2 right-0 z-30 bg-white border border-[#E7EAF3] rounded-xl shadow-xl p-3 w-64">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-[#1F2A44]">Video Call Link</p>
        <button onClick={onClose}><X className="w-3.5 h-3.5 text-[#9CA3AF]" /></button>
      </div>
      <p className="text-[10px] text-[#6B7280] mb-2">Share with {clientName?.split(' ')[0] || 'your client'} to start a video call.</p>
      <div className="flex items-center gap-1.5 bg-[#F6F7FB] rounded-lg px-2 py-1.5 mb-2">
        <span className="text-[10px] text-primary flex-1 truncate font-mono">{link}</span>
        <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Paperclip className="w-3.5 h-3.5 text-[#9CA3AF]" />}
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { onInsert(`📹 Join our video call: ${link}`); onClose(); }} className="flex-1 text-[11px] font-semibold py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          Send Link
        </button>
        <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-semibold py-1.5 px-2 border border-[#E7EAF3] text-[#374151] rounded-lg hover:bg-[#F6F7FB] transition-colors">
          <Link className="w-3 h-3" /> Open
        </a>
      </div>
    </div>
  );
}

export default function ComposeBar({ client, allMessages, checkIns = [], onSend, selectedTag, setSelectedTag, value, onChange }) {
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const textareaRef = useRef(null);
  const isEmpty = !value.trim();

  // Detect if last message is from client (show AI chip)
  const clientMessages = allMessages.filter(m => m.client_id === client?.id);
  const lastMsg = [...clientMessages].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
  const lastIsFromClient = lastMsg?.sender === 'client';
  const recentCheckIn = checkIns?.length > 0
    ? [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!isEmpty) onSend(); }
  };

  const handleAttachSelect = (key) => {
    const map = {
      file: '📎 [Attaching file…]',
      photo: '🖼️ [Sending photo…]',
      program: '📋 Check out your updated workout program in the app!',
      meal: '🥗 Your meal plan is ready in the app — take a look when you get a chance!',
      checkin: '📋 Hey! Time for your weekly check-in — please submit it when you get a chance 🙏',
      progress: "📊 I've put together a progress report for you — check your app for the full breakdown!",
    };
    onChange(map[key] || '');
    textareaRef.current?.focus();
  };

  const sortedConversation = [...clientMessages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)).slice(-8);

  const chips = getContextualChips(client, allMessages, checkIns);

  return (
    <div className="border-t border-[#E7EAF3] bg-white flex-shrink-0">
      {/* AI Reply Assistant */}
      <div className="px-3 pt-2.5">
        {(lastIsFromClient || showAI) && (
          <AIReplyAssistant
            client={client}
            conversationMessages={sortedConversation}
            checkIn={recentCheckIn}
            onUse={(text) => { onChange(text); textareaRef.current?.focus(); }}
            onEditFirst={(text) => { onChange(text); textareaRef.current?.focus(); }}
            onDismiss={() => setShowAI(false)}
          />
        )}
        {!lastIsFromClient && !showAI && (
          <div className="flex gap-1.5 pb-1">
            <button
              onClick={() => setShowAI(true)}
              className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-primary transition-colors"
            >
              ✨ AI Reply
            </button>
          </div>
        )}
      </div>

      {showQuickReplies && !isRecording && (
        <div className="flex gap-1.5 flex-wrap px-4 pt-3 pb-1">
          {chips.map((r, i) => (
            <button key={i} onClick={() => { onChange(r.text); setShowQuickReplies(false); textareaRef.current?.focus(); }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F0F4FF] border border-[#D6E2FF] text-primary hover:bg-primary hover:text-white hover:border-primary transition-colors whitespace-nowrap">
              {r.label}
            </button>
          ))}
          <button onClick={() => setShowTemplates(true)} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F6F7FB] border border-[#E7EAF3] text-[#6B7280] hover:bg-[#EEF4FF] hover:text-primary hover:border-primary/30 transition-colors whitespace-nowrap">
            More →
          </button>
        </div>
      )}

      {!isRecording && (
        <div className="flex items-center gap-1 px-3 pt-2 pb-1">
          <div className="relative">
            <button onClick={() => { setShowTagPicker(!showTagPicker); setShowAttach(false); setShowVideo(false); }}
              className={cn('flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border font-medium transition-colors',
                selectedTag !== 'general' ? TAG_COLORS[selectedTag] : 'bg-secondary text-[#374151] border-border hover:border-primary')}>
              <Tag className="w-3 h-3" />{selectedTag.replace('_', '-')}<ChevronDown className="w-2.5 h-2.5" />
            </button>
            {showTagPicker && (
              <div className="absolute bottom-full mb-2 left-0 bg-card border border-border rounded-xl shadow-xl p-2 flex flex-wrap gap-1.5 w-60 z-20">
                {TAGS.map(t => (
                  <button key={t} onClick={() => { setSelectedTag(t); setShowTagPicker(false); }}
                    className={cn('text-[10px] px-2 py-1 rounded-full border font-medium transition-colors',
                      t !== 'general' ? TAG_COLORS[t] : 'bg-secondary text-[#374151] border-border',
                      selectedTag === t && 'ring-2 ring-primary')}>
                    {t.replace('_', '-')}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setShowTemplates(true)} className="flex items-center gap-1 text-[11px] text-[#6B7280] hover:text-primary px-2 py-1 rounded-lg hover:bg-secondary transition-colors">
            <LayoutTemplate className="w-3.5 h-3.5" /> Templates
          </button>



          <div className="flex-1" />

          <FeatureLock feature="voice_video_messages" className="rounded-lg">
            <button onMouseDown={() => setIsRecording(true)} onTouchStart={() => setIsRecording(true)}
              className="flex items-center gap-1 text-[11px] text-[#6B7280] hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors" title="Hold to record">
              <Mic className="w-3.5 h-3.5" />
            </button>
          </FeatureLock>

          <FeatureLock feature="voice_video_messages" className="rounded-lg">
            <div className="relative">
              <button onClick={() => { setShowVideo(!showVideo); setShowAttach(false); setShowTagPicker(false); }}
                className={cn('flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-colors', showVideo ? 'text-primary bg-primary/10' : 'text-[#6B7280] hover:text-primary hover:bg-secondary')}>
                <Video className="w-3.5 h-3.5" />
              </button>
              {showVideo && <VideoLinkPopover clientName={client?.name} onInsert={(text) => { onChange(text); setShowQuickReplies(false); }} onClose={() => setShowVideo(false)} />}
            </div>
          </FeatureLock>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 pb-3 pt-1">
        <div className="relative flex-shrink-0">
          <button onClick={() => { setShowAttach(!showAttach); setShowTagPicker(false); setShowVideo(false); }}
            className={cn('w-9 h-9 flex items-center justify-center rounded-full border transition-all',
              showAttach ? 'bg-primary border-primary text-white' : 'bg-[#F6F7FB] border-[#E7EAF3] text-[#6B7280] hover:bg-[#EEF4FF] hover:border-primary/30 hover:text-primary')}>
            <Plus className={cn('w-4 h-4 transition-transform', showAttach && 'rotate-45')} />
          </button>
          {showAttach && <AttachmentMenu onSelect={handleAttachSelect} onClose={() => setShowAttach(false)} />}
        </div>

        {isRecording ? (
          <div className="flex-1">
            <VoiceRecorder onDone={() => { setIsRecording(false); onSend(); }} onCancel={() => setIsRecording(false)} />
          </div>
        ) : (
          <textarea ref={textareaRef} value={value}
            onChange={e => { onChange(e.target.value); if (e.target.value) setShowQuickReplies(false); else setShowQuickReplies(true); }}
            onKeyDown={handleKeyDown}
            onFocus={() => !value && setShowQuickReplies(true)}
            placeholder={`Message ${client?.name?.split(' ')[0] || ''}…`}
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-[#E7EAF3] bg-[#F9FAFB] px-4 py-2.5 text-sm text-[#1F2A44] placeholder-[#9CA3AF] outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:bg-white transition-all leading-relaxed"
            style={{ maxHeight: 120, minHeight: 42 }}
          />
        )}

        {!isRecording && (
          <button onClick={onSend} disabled={isEmpty}
            className={cn('w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full transition-all',
              isEmpty ? 'bg-[#F0F2F8] text-[#C4C9D8] cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow-md')}>
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>

      {showTemplates && <TemplatesDrawer onSelect={(text, tag) => { onChange(text); setSelectedTag(tag || 'general'); }} onClose={() => setShowTemplates(false)} />}
    </div>
  );
}