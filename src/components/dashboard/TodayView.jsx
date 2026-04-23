import React from 'react';
import { format } from 'date-fns';
import RunMyDayCenter from './RunMyDayCenter';
import RecommendationsWidget from './RecommendationsWidget';

export default function TodayView({ clients, checkIns, messages }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 max-w-2xl mx-auto w-full space-y-4 pb-24">
      {/* Header */}
      <div className="fade-up mb-2">
        <h1 className="text-2xl font-heading font-bold text-[#1F2A44]">{greeting} 👋</h1>
        <p className="text-sm text-[#374151] mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* Command center */}
      <div className="fade-up fade-up-delay-1">
        <RunMyDayCenter clients={clients} checkIns={checkIns} messages={messages} />
      </div>

      {/* Recommendations */}
      {checkIns.length > 0 && clients.length > 0 && (
        <div className="fade-up fade-up-delay-2">
          <RecommendationsWidget clients={clients} checkIns={checkIns} />
        </div>
      )}
    </div>
  );
}