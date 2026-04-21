import React from 'react';
import { Link } from 'react-router-dom';
import { Play, AlertTriangle, ClipboardList, MessageSquare, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function StatPill({ icon: Icon, count, label, color, urgent }) {
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2.5 rounded-xl border flex-1 min-w-0',
      urgent && count > 0
        ? color.bg + ' ' + color.border
        : 'bg-secondary/40 border-border'
    )}>
      <Icon className={cn('w-4 h-4 flex-shrink-0', urgent && count > 0 ? color.icon : 'text-muted-foreground')} />
      <div className="min-w-0">
        <p className={cn('text-lg font-bold font-heading leading-none tabular-nums', urgent && count > 0 ? color.icon : count === 0 ? 'text-emerald-400' : 'text-foreground')}>
          {count}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function RunMyDayBanner({ atRiskCount, pendingCheckIns, unreadMessages }) {
  const totalUrgent = atRiskCount + pendingCheckIns;
  const allClear = totalUrgent === 0 && unreadMessages === 0;

  const urgencyLevel = atRiskCount > 0 ? 'red' : pendingCheckIns > 0 ? 'yellow' : 'green';

  const COLORS = {
    red:    { bg: 'bg-destructive/10',  border: 'border-destructive/30',  icon: 'text-destructive',  cta: 'from-destructive/80 to-destructive' },
    yellow: { bg: 'bg-amber-500/10',    border: 'border-amber-500/30',    icon: 'text-amber-400',    cta: 'from-amber-500/80 to-amber-500' },
    green:  { bg: 'bg-emerald-500/10',  border: 'border-emerald-500/30',  icon: 'text-emerald-400',  cta: 'from-emerald-500/80 to-emerald-500' },
  };

  const colors = COLORS[urgencyLevel];

  return (
    <div className={cn(
      'rounded-2xl border p-4 space-y-4',
      urgencyLevel === 'red' ? 'bg-destructive/5 border-destructive/20'
        : urgencyLevel === 'yellow' ? 'bg-amber-500/5 border-amber-500/20'
        : 'bg-emerald-500/5 border-emerald-500/20'
    )}>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', colors.bg, colors.border, 'border')}>
          {allClear
            ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
            : <Play className={cn('w-4 h-4 fill-current', colors.icon)} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-base leading-tight">Run My Day</p>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">
            {allClear
              ? 'All caught up — great work! 🎉'
              : `${totalUrgent + unreadMessages} item${totalUrgent + unreadMessages !== 1 ? 's' : ''} need your attention`
            }
          </p>
        </div>
        {/* Urgency dot */}
        {!allClear && (
          <div className={cn(
            'w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0',
            urgencyLevel === 'red' ? 'bg-destructive' : urgencyLevel === 'yellow' ? 'bg-amber-400' : 'bg-emerald-400'
          )} />
        )}
      </div>

      {/* Stats row */}
      <div className="flex gap-2">
        <StatPill
          icon={AlertTriangle}
          count={atRiskCount}
          label="At-risk"
          color={{ bg: 'bg-destructive/10', border: 'border-destructive/30', icon: 'text-destructive' }}
          urgent
        />
        <StatPill
          icon={ClipboardList}
          count={pendingCheckIns}
          label="Check-ins"
          color={{ bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: 'text-amber-400' }}
          urgent
        />
        <StatPill
          icon={MessageSquare}
          count={unreadMessages}
          label="Messages"
          color={{ bg: 'bg-primary/10', border: 'border-primary/20', icon: 'text-primary' }}
          urgent={false}
        />
      </div>

      {/* CTA */}
      {!allClear ? (
        <Link
          to="/fast-review"
          className={cn(
            'flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]',
            'bg-gradient-to-r shadow-sm',
            urgencyLevel === 'red' ? 'from-destructive/90 to-destructive hover:from-destructive hover:to-destructive/90'
              : urgencyLevel === 'yellow' ? 'from-amber-500/90 to-amber-500 hover:from-amber-500 hover:to-amber-400'
              : 'from-primary/90 to-primary hover:from-primary hover:to-primary/90'
          )}
        >
          <Play className="w-4 h-4 fill-white" />
          Start Coaching Day
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Link>
      ) : (
        <Link
          to="/fast-review"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-all active:scale-[0.98]"
        >
          <CheckCircle2 className="w-4 h-4" />
          Review Queue
        </Link>
      )}
    </div>
  );
}