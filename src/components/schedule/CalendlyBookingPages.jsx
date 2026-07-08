import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getEventTypes } from '@/lib/calendly';
import { Copy, Check, ExternalLink, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function CalendlyBookingPages() {
  const [collapsed, setCollapsed] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const { data: settingsList = [] } = useQuery({
    queryKey: ['coach-settings'],
    queryFn: () => base44.entities.CoachSettings.list(),
  });
  const settings = settingsList[0];
  const isConnected = !!settings?.calendly_connected && !!settings?.calendly_user_uri;

  const { data, isLoading } = useQuery({
    queryKey: ['calendly-event-types', settings?.calendly_user_uri],
    queryFn: () => getEventTypes(settings.calendly_user_uri),
    enabled: isConnected,
    staleTime: 5 * 60 * 1000,
  });

  const eventTypes = data?.collection || [];

  if (!isConnected) return null;

  const copyLink = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Booking link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden mb-4">
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F9FAFB] transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#006BFF]/10 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-[#006BFF]" />
          </div>
          <span className="text-sm font-semibold text-[#111827]">My Booking Pages</span>
          <span className="text-[10px] font-semibold text-[#006BFF] bg-[#EEF4FF] px-2 py-0.5 rounded-full">
            Calendly · {eventTypes.length}
          </span>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronUp className="w-4 h-4 text-[#9CA3AF]" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {isLoading ? (
            [1, 2].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)
          ) : eventTypes.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] col-span-3 py-2">No active event types found in Calendly.</p>
          ) : (
            eventTypes.map(event => (
              <div key={event.uri} className="bg-white border border-[#E5E7EB] rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: event.color || '#006BFF' }} />
                    <p className="font-semibold text-sm text-[#111827] truncate">{event.name}</p>
                  </div>
                  <span className="text-xs text-[#6B7280] flex-shrink-0 ml-2">{event.duration} min</span>
                </div>
                {event.description_plain && (
                  <p className="text-xs text-[#6B7280] mb-3 line-clamp-2">{event.description_plain}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => copyLink(event.uri, event.scheduling_url)}
                    className="flex-1 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors flex items-center justify-center gap-1"
                  >
                    {copiedId === event.uri ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedId === event.uri ? 'Copied!' : 'Copy Link'}
                  </button>
                  <a
                    href={event.scheduling_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 bg-[#111827] text-white rounded-lg text-xs font-semibold text-center hover:bg-[#1F2937] transition-colors flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Preview
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}