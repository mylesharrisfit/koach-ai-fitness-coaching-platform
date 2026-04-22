import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CheckCircle2, Circle, ExternalLink, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const INTEGRATIONS = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept payments, manage subscriptions, and track revenue from clients.',
    category: 'Payments',
    color: '#635BFF',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#635BFF">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C4.68 22.75 7.420 24 11.315 24c2.58 0 4.718-.615 6.254-1.944 1.65-1.415 2.474-3.35 2.474-5.764 0-4.014-2.441-5.726-6.067-7.142z"/>
      </svg>
    ),
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync sessions, schedule calls, and manage availability with Google Calendar.',
    category: 'Scheduling',
    color: '#4285F4',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path fill="#4285F4" d="M19.5 3h-2.25V1.5h-1.5V3h-7.5V1.5h-1.5V3H4.5C3.675 3 3 3.675 3 4.5v15C3 20.325 3.675 21 4.5 21h15c.825 0 1.5-.675 1.5-1.5v-15C21 3.675 20.325 3 19.5 3zm0 16.5h-15V9h15v10.5z"/>
        <path fill="#EA4335" d="M7 10.5h2.25v2.25H7zm3.75 0H13v2.25h-2.25zM14.5 10.5h2.25v2.25H14.5zM7 14.25h2.25v2.25H7zm3.75 0H13v2.25h-2.25zM14.5 14.25h2.25v2.25H14.5z"/>
      </svg>
    ),
  },
  {
    id: 'zapier',
    name: 'Zapier / Webhooks',
    description: 'Connect to 5,000+ apps. Automate workflows with custom webhook triggers.',
    category: 'Automation',
    color: '#FF4A00',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#FF4A00">
        <path d="M14.488 9.512L12 12l-2.488-2.488A8.494 8.494 0 0 0 3.5 12a8.5 8.5 0 1 0 17 0 8.494 8.494 0 0 0-6.012-2.488zM12 20.5a8.5 8.5 0 1 1 0-17 8.5 8.5 0 0 1 0 17z"/>
        <circle cx="12" cy="12" r="2.5"/>
      </svg>
    ),
  },
];

export default function CoachIntegrations() {
  const [connected, setConnected] = useState({});

  const toggle = (id) => {
    if (connected[id]) {
      setConnected(c => ({ ...c, [id]: false }));
      toast.success(`Disconnected from ${INTEGRATIONS.find(i => i.id === id)?.name}`);
    } else {
      setConnected(c => ({ ...c, [id]: true }));
      toast.success(`Connected to ${INTEGRATIONS.find(i => i.id === id)?.name}! Configure in dashboard settings.`);
    }
  };

  return (
    <div className="space-y-3">
      {INTEGRATIONS.map((integration) => {
        const isConnected = !!connected[integration.id];
        return (
          <div
            key={integration.id}
            className={cn(
              'bg-white border rounded-2xl p-5 transition-all',
              isConnected ? 'border-emerald-200 bg-emerald-50/30' : 'border-[#E7EAF3]'
            )}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl border border-[#E7EAF3] bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                {integration.icon}
              </div>

              {/* Info */}
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
                <p className="text-xs text-[#374151] mt-1 leading-relaxed">{integration.description}</p>
              </div>

              {/* Action */}
              <div className="flex-shrink-0 flex items-center gap-2">
                {isConnected && (
                  <a href="#" className="text-[#374151] hover:text-primary transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <Button
                  size="sm"
                  variant={isConnected ? 'outline' : 'default'}
                  onClick={() => toggle(integration.id)}
                  className={cn(
                    'text-xs h-8 px-3',
                    isConnected && 'border-[#E7EAF3] text-[#374151] hover:border-red-200 hover:text-red-500 hover:bg-red-50'
                  )}
                >
                  {isConnected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      <div className="bg-[#F6F7FB] border border-dashed border-[#E7EAF3] rounded-2xl p-5 text-center">
        <Zap className="w-5 h-5 text-[#374151] mx-auto mb-2" />
        <p className="text-sm font-semibold text-[#1F2A44]">More integrations coming soon</p>
        <p className="text-xs text-[#374151] mt-1">Apple Health, Garmin, MyFitnessPal, and more</p>
      </div>
    </div>
  );
}