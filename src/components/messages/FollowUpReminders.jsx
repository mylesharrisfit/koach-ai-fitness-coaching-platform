import React, { useState, useMemo } from 'react';
import { Bell, Sparkles, Loader2, X, ChevronRight, MessageSquare } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const FOLLOW_UP_THRESHOLD_DAYS = 5;

export default function FollowUpReminders({ clients, allMessages, checkIns, onSelectClient, onInsertMessage }) {
  const [generating, setGenerating] = useState(null);
  const [dismissed, setDismissed] = useState(new Set());

  const reminders = useMemo(() => {
    return clients
      .filter(c => c.lifecycle_status === 'active' || !c.lifecycle_status)
      .map(c => {
        const clientMsgs = allMessages.filter(m => m.client_id === c.id && m.sender === 'coach');
        const lastMsg = [...clientMsgs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        const daysSince = lastMsg ? differenceInDays(new Date(), new Date(lastMsg.created_date)) : 999;
        const lastCI = [...checkIns.filter(ci => ci.client_id === c.id)].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        return { client: c, daysSince, lastCI };
      })
      .filter(r => r.daysSince >= FOLLOW_UP_THRESHOLD_DAYS && !dismissed.has(r.client.id))
      .sort((a, b) => b.daysSince - a.daysSince)
      .slice(0, 5);
  }, [clients, allMessages, checkIns, dismissed]);

  const generateFollowUp = async (reminder) => {
    setGenerating(reminder.client.id);
    try {
      const res = await base44.functions.invoke('aiMessageAssistant', {
        action: 'followUpSuggestions',
        client: reminder.client,
        checkIn: reminder.lastCI,
        daysSince: reminder.daysSince,
      });
      const msg = res.data?.message || '';
      onSelectClient(reminder.client.id);
      setTimeout(() => onInsertMessage(msg), 300);
    } catch (e) {}
    setGenerating(null);
  };

  if (reminders.length === 0) return null;

  return (
    <div className="border-b border-[#E7EAF3] bg-amber-50/60 px-4 py-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <Bell className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-[11px] font-bold text-amber-700">Follow-up Reminders</span>
      </div>
      <div className="space-y-1.5">
        {reminders.map(r => (
          <div key={r.client.id} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-2 border border-amber-100 shadow-sm">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-[#1F2A44] truncate">
                You haven't messaged {r.client.name?.split(' ')[0]} in {r.daysSince} days
              </p>
              {r.lastCI && (
                <p className="text-[10px] text-[#9CA3AF]">
                  Last check-in: mood {r.lastCI.mood}, {r.lastCI.compliance_training}% training
                </p>
              )}
            </div>
            <button
              onClick={() => generateFollowUp(r)}
              disabled={generating === r.client.id}
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-60 flex-shrink-0"
            >
              {generating === r.client.id
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Sparkles className="w-3 h-3" />
              }
              Message
            </button>
            <button
              onClick={() => setDismissed(prev => new Set([...prev, r.client.id]))}
              className="text-[#9CA3AF] hover:text-gray-500 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}