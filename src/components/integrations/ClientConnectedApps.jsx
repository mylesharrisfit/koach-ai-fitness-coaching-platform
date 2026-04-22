import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  CheckCircle2, AlertCircle, TrendingDown, Moon,
  Footprints, Flame, Weight, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const CLIENT_APPS = [
  {
    id: 'apple_health',
    name: 'Apple Health',
    subtitle: 'Apple Watch · iPhone',
    description: 'Sync steps, sleep, heart rate, and workouts automatically.',
    color: '#FF3B30',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#FF3B30">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  {
    id: 'garmin',
    name: 'Garmin Connect',
    subtitle: 'GPS Watch · Fitness Tracker',
    description: 'Import training data, heart rate zones, and recovery metrics.',
    color: '#007DC5',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#007DC5">
        <circle cx="12" cy="12" r="10"/>
        <path fill="white" d="M12 6a6 6 0 0 0-6 6 6 6 0 0 0 6 6 6 6 0 0 0 6-6 6 6 0 0 0-6-6zm0 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4z"/>
        <circle fill="white" cx="12" cy="12" r="2"/>
      </svg>
    ),
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    subtitle: 'Fitbit Tracker · App',
    description: 'Pull daily steps, sleep score, active minutes, and calorie burn.',
    color: '#00B0B9',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#00B0B9">
        <circle cx="12" cy="6" r="2.5"/>
        <circle cx="12" cy="12" r="3"/>
        <circle cx="12" cy="18" r="2.5"/>
        <circle cx="6" cy="9" r="2"/>
        <circle cx="6" cy="15" r="2"/>
        <circle cx="18" cy="9" r="2"/>
        <circle cx="18" cy="15" r="2"/>
      </svg>
    ),
  },
  {
    id: 'myfitnesspal',
    name: 'MyFitnessPal',
    subtitle: 'Nutrition Tracker',
    description: 'See calorie intake, macro breakdown, and meal logging directly.',
    color: '#0093D0',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#0093D0">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
      </svg>
    ),
  },
];

// Simulated live data keyed by app
const MOCK_LIVE_DATA = {
  apple_health: { steps: 7842, sleep: 6.8, calories: 1820, weight: 178.5 },
  garmin: { steps: 9210, sleep: 7.2, calories: null, weight: null },
  fitbit: { steps: 6500, sleep: 5.9, calories: null, weight: null },
  myfitnesspal: { steps: null, sleep: null, calories: 2140, weight: null },
};

const MOCK_INSIGHTS = {
  apple_health: [
    { type: 'warning', text: 'Steps below 5k for 3 consecutive days' },
    { type: 'warning', text: 'Sleep under 7 hrs last 4 nights' },
  ],
  garmin: [
    { type: 'info', text: 'Recovery score trending up this week' },
  ],
  fitbit: [
    { type: 'warning', text: 'Low activity detected — only 2 active days' },
    { type: 'warning', text: 'Sleep quality declining past 5 nights' },
  ],
  myfitnesspal: [
    { type: 'warning', text: 'Nutrition not logged for 2 days' },
    { type: 'info', text: 'Protein avg. 20g below target this week' },
  ],
};

function LiveDataCard({ icon: IconComponent, label, value, unit, color }) {
  const Icon = IconComponent;
  return (
    <div className="bg-white border border-[#E7EAF3] rounded-xl p-3.5 flex items-center gap-3">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-[#374151] uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-[#1F2A44] tabular-nums">
          {value != null ? <>{value}<span className="text-xs font-normal text-[#374151] ml-1">{unit}</span></> : <span className="text-[#374151] font-normal text-xs">—</span>}
        </p>
      </div>
    </div>
  );
}

export default function ClientConnectedApps({ clientId }) {
  const [connected, setConnected] = useState({});

  const toggle = (id) => {
    if (connected[id]) {
      setConnected(c => ({ ...c, [id]: false }));
      toast.success(`Disconnected ${CLIENT_APPS.find(a => a.id === id)?.name}`);
    } else {
      setConnected(c => ({ ...c, [id]: true }));
      toast.success(`${CLIENT_APPS.find(a => a.id === id)?.name} connected! Data will sync shortly.`);
    }
  };

  const anyConnected = Object.values(connected).some(Boolean);
  const connectedIds = Object.entries(connected).filter(([, v]) => v).map(([k]) => k);

  // Merge live data from all connected apps
  const mergedData = connectedIds.reduce((acc, id) => {
    const d = MOCK_LIVE_DATA[id] || {};
    Object.entries(d).forEach(([k, v]) => {
      if (v != null && acc[k] == null) acc[k] = v;
    });
    return acc;
  }, {});

  // Collect insights from all connected apps
  const allInsights = connectedIds.flatMap(id => MOCK_INSIGHTS[id] || []);

  return (
    <div className="space-y-5 p-1">
      {/* App connections */}
      <div>
        <p className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-3">Available Apps</p>
        <div className="space-y-2.5">
          {CLIENT_APPS.map((app) => {
            const isConnected = !!connected[app.id];
            return (
              <div
                key={app.id}
                className={cn(
                  'border rounded-2xl p-4 transition-all',
                  isConnected ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-[#E7EAF3]'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl border border-[#E7EAF3] bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-[#1F2A44]">{app.name}</p>
                      {isConnected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#374151]">{app.subtitle}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isConnected ? 'outline' : 'default'}
                    onClick={() => toggle(app.id)}
                    className={cn(
                      'text-xs h-8 px-3 flex-shrink-0',
                      isConnected && 'border-[#E7EAF3] text-[#374151] hover:border-red-200 hover:text-red-500 hover:bg-red-50'
                    )}
                  >
                    {isConnected ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
                {!isConnected && (
                  <p className="text-[11px] text-[#374151] mt-2 ml-13 pl-px opacity-80">{app.description}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Data */}
      {anyConnected && (
        <div>
          <p className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-3">Live Data — Today</p>
          <div className="grid grid-cols-2 gap-2">
            <LiveDataCard
              icon={Footprints}
              label="Steps"
              value={mergedData.steps?.toLocaleString()}
              unit="steps"
              color="bg-blue-500"
            />
            <LiveDataCard
              icon={Moon}
              label="Sleep"
              value={mergedData.sleep}
              unit="hrs"
              color="bg-indigo-500"
            />
            <LiveDataCard
              icon={Flame}
              label="Calories"
              value={mergedData.calories?.toLocaleString()}
              unit="kcal"
              color="bg-orange-500"
            />
            <LiveDataCard
              icon={Weight}
              label="Weight"
              value={mergedData.weight}
              unit="lbs"
              color="bg-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Insights */}
      {allInsights.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-3">Insights</p>
          <div className="space-y-2">
            {allInsights.map((insight, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-2.5 rounded-xl px-3.5 py-3 border text-sm',
                  insight.type === 'warning'
                    ? 'bg-amber-50 border-amber-100 text-amber-800'
                    : 'bg-blue-50 border-blue-100 text-blue-800'
                )}
              >
                <AlertCircle className={cn('w-4 h-4 flex-shrink-0 mt-0.5', insight.type === 'warning' ? 'text-amber-500' : 'text-blue-500')} />
                <span className="text-[12px] font-medium leading-snug">{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!anyConnected && (
        <div className="text-center py-6 border border-dashed border-[#E7EAF3] rounded-2xl">
          <Smartphone className="w-8 h-8 text-[#374151] mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold text-[#1F2A44]">No apps connected yet</p>
          <p className="text-xs text-[#374151] mt-1">Connect apps above to see live data and insights</p>
        </div>
      )}
    </div>
  );
}