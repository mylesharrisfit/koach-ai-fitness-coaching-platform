import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  CheckCircle2, AlertCircle, TrendingUp, TrendingDown,
  Moon, Footprints, Flame, Smartphone, Info,
  Activity, Zap, Droplets
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const CLIENT_APPS = [
  {
    id: 'apple_health',
    name: 'Apple Health',
    subtitle: 'iPhone · Apple Watch',
    description: 'Steps, sleep, heart rate, and workout data synced from your device.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#FF3B30">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
    data: { steps: 7842, sleep: 6.8, calories: 1820, heartRate: 68 },
    insights: [
      { type: 'warning', text: 'Steps below 5,000 for the last 3 days — activity is down.' },
      { type: 'warning', text: 'Sleep averaging 6.8 hrs — below the recommended 7–8 hrs.' },
    ],
    trend: { steps: -12, sleep: -0.4 },
  },
  {
    id: 'garmin',
    name: 'Garmin Connect',
    subtitle: 'GPS Watch · Fitness Tracker',
    description: 'Training load, heart rate zones, recovery scores, and GPS sessions.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#007DC5">
        <circle cx="12" cy="12" r="10"/>
        <path fill="white" d="M12 6a6 6 0 0 0-6 6 6 6 0 0 0 6 6 6 6 0 0 0 6-6 6 6 0 0 0-6-6zm0 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4z"/>
        <circle fill="white" cx="12" cy="12" r="2"/>
      </svg>
    ),
    data: { steps: 9210, sleep: 7.2, heartRate: 62, recovery: 72 },
    insights: [
      { type: 'success', text: 'Recovery score trending upward — body is adapting well.' },
      { type: 'info', text: 'Training load is in the optimal zone for this week.' },
    ],
    trend: { steps: +8, sleep: +0.3 },
  },
  {
    id: 'myfitnesspal',
    name: 'MyFitnessPal',
    subtitle: 'Nutrition Tracker',
    description: 'Daily calorie intake, macros, and meal logging data.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#0093D0">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
      </svg>
    ),
    data: { calories: 2140, protein: 142, carbs: 218, fat: 67 },
    insights: [
      { type: 'warning', text: 'Nutrition not logged for 2 days — tracking streak broken.' },
      { type: 'info', text: 'Protein averaging 20g below weekly target.' },
    ],
    trend: { calories: +3 },
  },
];

/* ── Live data tile ── */
function DataTile({ icon: Icon, label, value, unit, color, trend }) {
  const isUp = trend > 0;
  const isDown = trend < 0;
  return (
    <div className="bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl p-3 flex items-center gap-2.5">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-[#1F2A44] tabular-nums leading-tight">
          {value != null ? <>{value}<span className="text-xs font-normal text-[#6B7280] ml-0.5">{unit}</span></> : <span className="text-[#9CA3AF] text-xs font-normal">—</span>}
        </p>
      </div>
      {trend != null && (
        <div className={cn('flex items-center gap-0.5 text-[10px] font-bold flex-shrink-0',
          isDown ? 'text-red-500' : isUp ? 'text-emerald-500' : 'text-[#9CA3AF]')}>
          {isDown ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
          {isUp ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  );
}

/* ── Insight row ── */
function InsightRow({ insight }) {
  const styles = {
    warning: 'bg-amber-50 border-amber-100 text-amber-700',
    info: 'bg-blue-50 border-blue-100 text-blue-700',
    success: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  };
  const icons = {
    warning: <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />,
    info: <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />,
  };
  return (
    <div className={cn('flex items-start gap-2 rounded-xl px-3 py-2.5 border text-xs font-medium leading-snug', styles[insight.type] || styles.info)}>
      {icons[insight.type] || icons.info}
      {insight.text}
    </div>
  );
}

/* ── Per-app data view ── */
function AppDataView({ app }) {
  const d = app.data || {};
  return (
    <div className="mt-3 space-y-3 border-t border-[#E7EAF3] pt-3">
      <div className="grid grid-cols-2 gap-2">
        {d.steps != null && (
          <DataTile icon={Footprints} label="Steps" value={d.steps.toLocaleString()} unit="steps" color="bg-blue-500" trend={app.trend?.steps} />
        )}
        {d.sleep != null && (
          <DataTile icon={Moon} label="Sleep" value={d.sleep} unit="hrs" color="bg-indigo-500" trend={app.trend?.sleep} />
        )}
        {d.calories != null && (
          <DataTile icon={Flame} label="Calories" value={d.calories.toLocaleString()} unit="kcal" color="bg-orange-500" trend={app.trend?.calories} />
        )}
        {d.heartRate != null && (
          <DataTile icon={Activity} label="Heart Rate" value={d.heartRate} unit="bpm" color="bg-red-500" />
        )}
        {d.recovery != null && (
          <DataTile icon={Zap} label="Recovery" value={d.recovery} unit="/100" color="bg-emerald-500" />
        )}
        {d.protein != null && (
          <DataTile icon={Droplets} label="Protein" value={d.protein} unit="g" color="bg-emerald-600" />
        )}
        {d.carbs != null && (
          <DataTile icon={Flame} label="Carbs" value={d.carbs} unit="g" color="bg-amber-500" />
        )}
      </div>

      {app.insights?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">Insights</p>
          {app.insights.map((ins, i) => <InsightRow key={i} insight={ins} />)}
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
export default function ClientConnectedApps({ clientId }) {
  const [connected, setConnected] = useState({});

  const toggle = (id) => {
    const name = CLIENT_APPS.find(a => a.id === id)?.name;
    if (connected[id]) {
      setConnected(c => ({ ...c, [id]: false }));
      toast.success(`${name} disconnected`);
    } else {
      setConnected(c => ({ ...c, [id]: true }));
      toast.success(`${name} connected! Data will sync shortly.`);
    }
  };

  const anyConnected = Object.values(connected).some(Boolean);

  return (
    <div className="space-y-3">
      {/* Summary strip if any connected */}
      {anyConnected && (() => {
        const connectedApps = CLIENT_APPS.filter(a => connected[a.id]);
        const merged = connectedApps.reduce((acc, a) => {
          Object.entries(a.data || {}).forEach(([k, v]) => { if (v != null && acc[k] == null) acc[k] = v; });
          return acc;
        }, {});
        return (
          <div className="bg-gradient-to-r from-[#EEF4FF] to-[#F0F8FF] border border-blue-100 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary mb-3">Today's Overview</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {merged.steps != null && (
                <div className="text-center">
                  <Footprints className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <p className="text-base font-bold tabular-nums text-[#1F2A44]">{merged.steps.toLocaleString()}</p>
                  <p className="text-[10px] text-[#6B7280]">steps</p>
                </div>
              )}
              {merged.sleep != null && (
                <div className="text-center">
                  <Moon className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                  <p className="text-base font-bold tabular-nums text-[#1F2A44]">{merged.sleep}</p>
                  <p className="text-[10px] text-[#6B7280]">hrs sleep</p>
                </div>
              )}
              {merged.calories != null && (
                <div className="text-center">
                  <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                  <p className="text-base font-bold tabular-nums text-[#1F2A44]">{merged.calories.toLocaleString()}</p>
                  <p className="text-[10px] text-[#6B7280]">kcal</p>
                </div>
              )}
              {merged.heartRate != null && (
                <div className="text-center">
                  <Activity className="w-4 h-4 text-red-400 mx-auto mb-1" />
                  <p className="text-base font-bold tabular-nums text-[#1F2A44]">{merged.heartRate}</p>
                  <p className="text-[10px] text-[#6B7280]">bpm avg</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* App cards */}
      {CLIENT_APPS.map((app) => {
        const isConnected = !!connected[app.id];
        return (
          <div
            key={app.id}
            className={cn(
              'border rounded-2xl p-4 transition-all bg-white',
              isConnected ? 'border-emerald-200' : 'border-[#E7EAF3]'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-[#E7EAF3] bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                {app.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-[#1F2A44]">{app.name}</p>
                  {isConnected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                </div>
                <p className="text-[11px] text-[#6B7280]">{app.subtitle}</p>
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
              <p className="text-xs text-[#6B7280] mt-2 ml-[52px] leading-snug">{app.description}</p>
            )}

            {isConnected && <AppDataView app={app} />}
          </div>
        );
      })}

      {!anyConnected && (
        <div className="text-center py-8 border border-dashed border-[#E7EAF3] rounded-2xl">
          <Smartphone className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#1F2A44]">No apps connected yet</p>
          <p className="text-xs text-[#6B7280] mt-1">Connect apps above to see live data and coaching insights</p>
        </div>
      )}
    </div>
  );
}