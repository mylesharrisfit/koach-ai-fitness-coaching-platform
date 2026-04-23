import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CheckCircle2, ExternalLink, Zap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const INTEGRATION_GROUPS = [
  {
    label: 'Fitness & Health',
    items: [
      {
        id: 'apple_health',
        name: 'Apple Health',
        description: 'Sync client steps, sleep, heart rate, and workouts from iPhone and Apple Watch.',
        category: 'Health',
        note: 'Clients connect via their iPhone — data syncs automatically each check-in.',
        icon: (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#FF3B30">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
        ),
        color: '#FF3B30',
      },
      {
        id: 'garmin',
        name: 'Garmin Connect',
        description: 'Pull training data, heart rate zones, recovery metrics, and GPS sessions from Garmin devices.',
        category: 'Health',
        note: 'Clients authorize via Garmin Connect — syncs training load and sleep automatically.',
        icon: (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#007DC5">
            <circle cx="12" cy="12" r="10"/>
            <path fill="white" d="M12 6a6 6 0 0 0-6 6 6 6 0 0 0 6 6 6 6 0 0 0 6-6 6 6 0 0 0-6-6zm0 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4z"/>
            <circle fill="white" cx="12" cy="12" r="2"/>
          </svg>
        ),
        color: '#007DC5',
      },
      {
        id: 'myfitnesspal',
        name: 'MyFitnessPal',
        description: 'See client calorie intake, macro breakdown, and meal logging data in real time.',
        category: 'Nutrition',
        note: 'Clients connect their MFP account — nutrition diary syncs to their profile automatically.',
        icon: (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#0093D0">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        ),
        color: '#0093D0',
      },
    ],
  },
  {
    label: 'Business & Payments',
    items: [
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Accept payments, manage subscriptions, and track revenue from clients.',
        category: 'Payments',
        note: 'Connect your Stripe account to enable payment links and auto-billing.',
        icon: (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#635BFF">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C4.68 22.75 7.420 24 11.315 24c2.58 0 4.718-.615 6.254-1.944 1.65-1.415 2.474-3.35 2.474-5.764 0-4.014-2.441-5.726-6.067-7.142z"/>
          </svg>
        ),
        color: '#635BFF',
      },
      {
        id: 'google_calendar',
        name: 'Google Calendar',
        description: 'Sync sessions, schedule calls, and manage availability directly from Google Calendar.',
        category: 'Scheduling',
        note: 'Authorize once — sessions automatically appear in your Google Calendar.',
        icon: (
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="#4285F4" d="M19.5 3h-2.25V1.5h-1.5V3h-7.5V1.5h-1.5V3H4.5C3.675 3 3 3.675 3 4.5v15C3 20.325 3.675 21 4.5 21h15c.825 0 1.5-.675 1.5-1.5v-15C21 3.675 20.325 3 19.5 3zm0 16.5h-15V9h15v10.5z"/>
            <path fill="#EA4335" d="M7 10.5h2.25v2.25H7zm3.75 0H13v2.25h-2.25zM14.5 10.5h2.25v2.25H14.5zM7 14.25h2.25v2.25H7zm3.75 0H13v2.25h-2.25zM14.5 14.25h2.25v2.25H14.5z"/>
          </svg>
        ),
        color: '#4285F4',
      },
      {
        id: 'zapier',
        name: 'Zapier / Webhooks',
        description: 'Connect to 5,000+ apps. Automate workflows with custom webhook triggers.',
        category: 'Automation',
        note: 'Use Zapier to trigger actions in any app when clients check in or hit milestones.',
        icon: (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#FF4A00">
            <path d="M14.488 9.512L12 12l-2.488-2.488A8.494 8.494 0 0 0 3.5 12a8.5 8.5 0 1 0 17 0 8.494 8.494 0 0 0-6.012-2.488zM12 20.5a8.5 8.5 0 1 1 0-17 8.5 8.5 0 0 1 0 17z"/>
            <circle cx="12" cy="12" r="2.5"/>
          </svg>
        ),
        color: '#FF4A00',
      },
    ],
  },
];

export default function CoachIntegrations() {
  const [connected, setConnected] = useState({});
  const [expandedNote, setExpandedNote] = useState(null);

  const toggle = (id, name) => {
    if (connected[id]) {
      setConnected(c => ({ ...c, [id]: false }));
      toast.success(`Disconnected from ${name}`);
    } else {
      setConnected(c => ({ ...c, [id]: true }));
      toast.success(`${name} connected!`);
    }
  };

  return (
    <div className="space-y-6">
      {INTEGRATION_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">{group.label}</p>
          <div className="space-y-2.5">
            {group.items.map((integration) => {
              const isConnected = !!connected[integration.id];
              const showNote = expandedNote === integration.id;
              return (
                <div
                  key={integration.id}
                  className={cn(
                    'bg-white border rounded-2xl p-4 transition-all',
                    isConnected ? 'border-emerald-200 bg-emerald-50/20' : 'border-[#E7EAF3]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl border border-[#E7EAF3] bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      {integration.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[#1F2A44] text-sm">{integration.name}</p>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F6F7FB] border border-[#E7EAF3] text-[#374151]">
                          {integration.category}
                        </span>
                        {isConnected && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5 leading-snug line-clamp-1">{integration.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setExpandedNote(showNote ? null : integration.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-primary hover:bg-[#EEF4FF] transition-colors"
                        title="How it works"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      <Button
                        size="sm"
                        variant={isConnected ? 'outline' : 'default'}
                        onClick={() => toggle(integration.id, integration.name)}
                        className={cn(
                          'text-xs h-8 px-3',
                          isConnected && 'border-[#E7EAF3] text-[#374151] hover:border-red-200 hover:text-red-500 hover:bg-red-50'
                        )}
                      >
                        {isConnected ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                  {showNote && (
                    <div className="mt-3 flex items-start gap-2 bg-[#EEF4FF] border border-blue-100 rounded-xl px-3 py-2.5 fade-up">
                      <Info className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[#374151] leading-snug">{integration.note}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}