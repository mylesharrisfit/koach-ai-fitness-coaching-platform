import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const TIME_FILTERS = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'unresponded', label: 'Unresponded' },
];

export default function CheckInFilters({ timeFilter, setTimeFilter, sort, setSort, search, setSearch, counts }) {
  return (
    <div className="space-y-3 mb-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="pl-9 h-9"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {/* Time range */}
        <div className="flex gap-1 bg-secondary rounded-lg p-1 flex-shrink-0">
          {TIME_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setTimeFilter(f.key)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap',
                timeFilter === f.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-1 bg-secondary rounded-lg p-1 flex-wrap">
          <div className="flex items-center gap-1.5 px-2">
            <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
          </div>
          {SORT_OPTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1.5',
                sort === s.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s.label}
              {counts?.[s.key] > 0 && (
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  s.key === 'flagged' ? 'bg-destructive/20 text-destructive' :
                  s.key === 'overdue' ? 'bg-chart-4/20 text-chart-4' :
                  'bg-primary/15 text-primary'
                )}>
                  {counts[s.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}