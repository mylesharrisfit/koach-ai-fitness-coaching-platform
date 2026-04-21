import React from 'react';
import { Link } from 'react-router-dom';
import { Play, AlertTriangle, ClipboardList, MessageSquare, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function StatPill({ icon: Icon, count, label, colorClass, urgent }) {
  const hasIssue = urgent && count > 0;
  return (
    <div className={cn(
      'flex items-center gap-2.5 px-3 py-3 rounded-xl border flex-1',
      hasIssue ? colorClass : 'bg-[#F6F7FB] border-[#E7EAF3]'
    )}>
      <Icon className={cn('w-4 h-4 flex-shrink-0', hasIssue ? '' : 'text-[#6B7280]')} />
      <div>
        <p className={cn('text-lg font-bold font-heading leading-none tabular-nums', !hasIssue && count === 0 && 'text-emerald-500')}>
          {count}
        </p>
        <p className="text-[10px] text-[#6B7280] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function RunMyDayBanner({ atRiskCount, pendingCheckIns, unreadMessages }) {
  const totalUrgent = atRiskCount + pendingCheckIns;
  const allClear = totalUrgent === 0 && unreadMessages === 0;
  const total = totalUrgent + unreadMessages;

  return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          allClear ? 'bg-emerald-50' : 'bg-primary/10'
        )}>
          {allClear
            ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            : <Play className="w-5 h-5 text-primary fill-primary" />
          }
        </div>
        <div className="flex-1">
          <p className="font-heading font-bold text-[15px] text-[#1F2A44]">Run My Day</p>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {allClear
              ? 'All caught up — great work! 🎉'
              : `${total} item${total !== 1 ? 's' : ''} need your attention`
            }
          </p>
        </div>
        {!allClear && (
          <div className={cn(
            'w-2 h-2 rounded-full animate-pulse flex-shrink-0',
            atRiskCount > 0 ? 'bg-red-400' : pendingCheckIns > 0 ? 'bg-amber-400' : 'bg-primary'
          )} />
        )}
      </div>

      {/* Stats row */}
      <div className="flex gap-2">
        <StatPill
          icon={AlertTriangle}
          count={atRiskCount}
          label="At-risk"
          colorClass="bg-red-50 border-red-100 text-red-500"
          urgent
        />
        <StatPill
          icon={ClipboardList}
          count={pendingCheckIns}
          label="Check-ins"
          colorClass="bg-amber-50 border-amber-100 text-amber-500"
          urgent
        />
        <StatPill
          icon={MessageSquare}
          count={unreadMessages}
          label="Messages"
          colorClass="bg-blue-50 border-blue-100 text-primary"
          urgent={false}
        />
      </div>

      {/* CTA */}
      {!allClear ? (
        <Link
          to="/fast-review"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Play className="w-4 h-4 fill-white" />
          Start Coaching Day
          <ArrowRight className="w-4 h-4 ml-auto" />
        </Link>
      ) : (
        <Link
          to="/fast-review"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          Review Queue
        </Link>
      )}
    </div>
  );
}