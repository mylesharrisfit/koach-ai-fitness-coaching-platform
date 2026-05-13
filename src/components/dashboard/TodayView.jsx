import React, { useState } from 'react';
import { format } from 'date-fns';
import { Link2, Copy, Check, ExternalLink } from 'lucide-react';
import RunMyDayCenter from './RunMyDayCenter';
import RecommendationsWidget from './RecommendationsWidget';

function OnboardingLinkBanner() {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/start`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
        <Link2 className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-900">Client Onboarding Link</p>
        <p className="text-xs text-blue-600 truncate mt-0.5">{link}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <a href="/start" target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-md bg-white border border-blue-200 hover:bg-blue-50 transition-colors">
          <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
        </a>
        <button onClick={copy}
          className="p-1.5 rounded-md bg-white border border-blue-200 hover:bg-blue-50 transition-colors">
          {copied
            ? <Check className="w-3.5 h-3.5 text-green-600" />
            : <Copy className="w-3.5 h-3.5 text-blue-600" />}
        </button>
      </div>
    </div>
  );
}

export default function TodayView({ clients, checkIns, messages, payments = [] }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 max-w-2xl mx-auto w-full space-y-4 pb-24">
      {/* Header */}
      <div className="fade-up mb-2">
        <h1 className="text-2xl font-heading font-bold text-[#1F2A44]">{greeting} 👋</h1>
        <p className="text-sm text-[#374151] mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* Onboarding link */}
      <div className="fade-up">
        <OnboardingLinkBanner />
      </div>

      {/* Command center */}
      <div className="fade-up fade-up-delay-1">
        <RunMyDayCenter clients={clients} checkIns={checkIns} messages={messages} payments={payments} />
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