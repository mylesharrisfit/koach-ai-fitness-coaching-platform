import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/** Loading placeholder for the coach dashboard — mirrors TodayView's layout. */
export default function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-8 space-y-5 sm:space-y-7 pb-24">
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
