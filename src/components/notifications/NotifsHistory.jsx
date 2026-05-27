import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCheck, Filter } from 'lucide-react';
import { format, subDays } from 'date-fns';

const MOCK_HISTORY = [
  { id: 1, type: 'client_activity', title: 'New check-in submitted', body: 'Sarah Johnson submitted her weekly check-in', time: new Date(), read: false, emoji: '📋' },
  { id: 2, type: 'payments', title: 'Payment received', body: '$299 received from Marcus Williams', time: subDays(new Date(), 1), read: false, emoji: '💳' },
  { id: 3, type: 'messages', title: 'New message from client', body: 'Alex Torres: "Hey coach, quick question about..."', time: subDays(new Date(), 1), read: true, emoji: '💬' },
  { id: 4, type: 'ai_insights', title: 'At-risk client flagged', body: 'Emily Chen hasn\'t logged in for 8 days — risk of churn', time: subDays(new Date(), 2), read: true, emoji: '🤖' },
  { id: 5, type: 'scheduling', title: 'Session starting in 1 hour', body: 'Video call with Marcus Williams at 3:00 PM', time: subDays(new Date(), 2), read: true, emoji: '📅' },
  { id: 6, type: 'client_activity', title: 'Client milestone achieved', body: 'Jake Miller lost 10 lbs! 🎉', time: subDays(new Date(), 3), read: true, emoji: '🏆' },
  { id: 7, type: 'payments', title: 'Payment failed', body: 'Retry needed: Chris Lee — $199/month', time: subDays(new Date(), 4), read: true, emoji: '⚠️' },
  { id: 8, type: 'leads', title: 'New lead added', body: 'Jordan Smith entered your pipeline', time: subDays(new Date(), 5), read: true, emoji: '📈' },
  { id: 9, type: 'system', title: 'Plan limit approaching', body: 'You\'re at 90% of your 20-client limit', time: subDays(new Date(), 7), read: true, emoji: '⚙️' },
  { id: 10, type: 'client_activity', title: 'Check-in overdue', body: 'Ryan Chen hasn\'t submitted this week\'s check-in', time: subDays(new Date(), 10), read: true, emoji: '⏰' },
];

const TYPE_LABELS = {
  all: 'All', client_activity: 'Client', payments: 'Payments',
  messages: 'Messages', ai_insights: 'AI', scheduling: 'Schedule',
  leads: 'Leads', system: 'System',
};

export default function NotifsHistory({ onClose }) {
  const [filter, setFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [items, setItems] = useState(MOCK_HISTORY);

  const filtered = items.filter(i => {
    if (filter !== 'all' && i.type !== filter) return false;
    if (readFilter === 'unread' && i.read) return false;
    if (readFilter === 'read' && !i.read) return false;
    return true;
  });

  const markAllRead = () => setItems(prev => prev.map(i => ({ ...i, read: true })));
  const markRead = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));

  const unreadCount = items.filter(i => !i.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-800">Notification History</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <X className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 space-y-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0.5">
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all"
                style={{
                  background: filter === val ? 'linear-gradient(135deg, #2563EB, #7C3AED)' : '#F1F5F9',
                  color: filter === val ? 'white' : '#64748B',
                }}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {['all', 'unread', 'read'].map(v => (
              <button key={v} onClick={() => setReadFilter(v)}
                className="px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all"
                style={{
                  background: readFilter === v ? '#1E293B' : '#F8FAFC',
                  color: readFilter === v ? 'white' : '#94A3B8',
                  border: '1px solid',
                  borderColor: readFilter === v ? '#1E293B' : '#E2E8F0',
                }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No notifications found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(n => (
                <div key={n.id} onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{n.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{n.body}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{format(n.time, 'MMM d, h:mm a')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400 text-center">Showing last 30 days</p>
        </div>
      </motion.div>
    </div>
  );
}