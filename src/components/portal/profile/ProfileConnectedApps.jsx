import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ProfileSectionCard from './ProfileSectionCard';

const APPS = [
  { id: 'apple_health', name: 'Apple Health', emoji: '🍎', platform: 'iOS' },
  { id: 'google_fit', name: 'Google Fit', emoji: '🏃', platform: 'Android' },
  { id: 'apple_watch', name: 'Apple Watch', emoji: '⌚', platform: 'iOS' },
  { id: 'fitbit', name: 'Fitbit', emoji: '💚', platform: 'All' },
  { id: 'myfitnesspal', name: 'MyFitnessPal', emoji: '🍽️', platform: 'All' },
  { id: 'garmin', name: 'Garmin', emoji: '🔵', platform: 'All' },
  { id: 'withings', name: 'Withings', emoji: '📊', platform: 'All' },
];

export default function ProfileConnectedApps() {
  const [connected, setConnected] = useState({});

  const toggle = (id) => {
    setConnected(p => ({ ...p, [id]: !p[id] }));
  };

  return (
    <ProfileSectionCard icon="📱" title="Connected Apps & Devices">
      <div className="pt-3 space-y-2">
        {APPS.map(app => (
          <motion.div key={app.id} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
            <span className="text-xl w-8 text-center flex-shrink-0">{app.emoji}</span>
            <div className="flex-1">
              <p className="text-white/80 text-sm font-medium">{app.name}</p>
              {connected[app.id] ? (
                <p className="text-success text-[10px]">● Connected · Last sync: just now</p>
              ) : (
                <p className="text-white/25 text-[10px]">{app.platform}</p>
              )}
            </div>
            <button onClick={() => toggle(app.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: connected[app.id] ? 'rgb(var(--success) / 0.15)' : 'rgb(var(--primary) / 0.15)',
                color: connected[app.id] ? 'rgb(var(--success))' : 'rgb(var(--primary))',
                border: `1px solid ${connected[app.id] ? 'rgb(var(--success) / 0.3)' : 'rgb(var(--primary) / 0.3)'}`,
              }}>
              {connected[app.id] ? 'Connected ✓' : 'Connect'}
            </button>
          </motion.div>
        ))}
        <p className="text-white/20 text-[10px] text-center pt-2">
          Connecting syncs steps, workouts, weight & sleep data
        </p>
      </div>
    </ProfileSectionCard>
  );
}