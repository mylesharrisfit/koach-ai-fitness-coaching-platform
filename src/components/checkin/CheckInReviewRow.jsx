import React from 'react';
import { differenceInHours, differenceInDays, parseISO, format } from 'date-fns';
import { ImageIcon, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOOD_EMOJI = { great: '😄', good: '🙂', okay: '😐', tired: '😴', stressed: '😰' };

function StatusBadge({ checkIn }) {
  const reviewed = checkIn.coach_responded || checkIn.review_status === 'reviewed';
  const flagged = checkIn.review_status === 'flagged';
  if (reviewed) return (
    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
      <CheckCircle2 className="w-2.5 h-2.5" /> Reviewed
    </span>
  );
  if (flagged) return (
    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
      <AlertTriangle className="w-2.5 h-2.5" /> Follow-up
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
      <Clock className="w-2.5 h-2.5" /> New
    </span>
  );
}

function timeAgo(dateStr) {
  const date = parseISO(dateStr);
  const hoursAgo = differenceInHours(new Date(), date);
  if (hoursAgo < 1) return 'Just now';
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  const daysAgo = differenceInDays(new Date(), date);
  if (daysAgo < 7) return `${daysAgo}d ago`;
  return format(date, 'MMM d');
}

export default function CheckInReviewRow({ checkIn, client, onReview }) {
  const clientName = client?.name || checkIn.client_name || 'Client';
  const initial = clientName[0]?.toUpperCase() || '?';

  const complianceAvg = [checkIn.compliance_training, checkIn.compliance_nutrition]
    .filter(v => v != null);
  const avgCompliance = complianceAvg.length
    ? Math.round(complianceAvg.reduce((s, v) => s + v, 0) / complianceAvg.length)
    : null;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm hover:border-[#D1D5DB] hover:shadow-md transition-all">
      <div className="flex items-center gap-3 p-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
          {client?.avatar_url
            ? <img src={client.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
            : initial}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm text-[#111827]">{clientName}</span>
            <StatusBadge checkIn={checkIn} />
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6B7280] flex-wrap">
            <span>Submitted {timeAgo(checkIn.date)}</span>
            <span className="text-[#D1D5DB]">·</span>
            <span>Weekly Check-in</span>
            {checkIn.weight && <span className="text-[#D1D5DB]">·</span>}
            {checkIn.weight && <span>⚖️ {checkIn.weight} lbs</span>}
            {checkIn.mood && <span>{MOOD_EMOJI[checkIn.mood]}</span>}
            {avgCompliance != null && (
              <>
                <span className="text-[#D1D5DB]">·</span>
                <span className={cn(
                  'font-semibold',
                  avgCompliance >= 75 ? 'text-emerald-600' : avgCompliance >= 50 ? 'text-amber-600' : 'text-red-600'
                )}>{avgCompliance}% adherence</span>
              </>
            )}
          </div>
        </div>

        {/* Photo thumbnails */}
        {checkIn.photo_urls?.length > 0 && (
          <div className="hidden sm:flex gap-1 flex-shrink-0">
            {checkIn.photo_urls.slice(0, 2).map((url, i) => (
              <img key={i} src={url} alt="" className="w-9 h-9 rounded-lg object-cover border border-[#E5E7EB]" />
            ))}
            {checkIn.photo_urls.length > 2 && (
              <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center">
                <span className="text-[10px] font-bold text-[#6B7280]">+{checkIn.photo_urls.length - 2}</span>
              </div>
            )}
          </div>
        )}

        {/* Review button */}
        <button
          onClick={() => onReview(checkIn)}
          className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
        >
          Review
        </button>
      </div>
    </div>
  );
}