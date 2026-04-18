import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const REMINDER_TYPES = [
  { key: 'workout', emoji: '🏋️', label: 'Workout Reminder', time: '07:00', description: 'Morning workout prompt' },
  { key: 'hydration', emoji: '💧', label: 'Hydration', time: '10:00', description: 'Drink water reminders' },
  { key: 'steps', emoji: '👟', label: 'Step Goal', time: '18:00', description: 'Evening steps check-in' },
  { key: 'checkin', emoji: '📋', label: 'Weekly Check-in', time: '20:00', description: 'Submit your weekly check-in' },
];

export default function NotificationSettings() {
  const [permission, setPermission] = useState('default');
  const [enabled, setEnabled] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPermission(Notification?.permission || 'default');
    const stored = JSON.parse(localStorage.getItem('ff_notifications') || '{}');
    setEnabled(stored);
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const toggle = (key) => setEnabled(e => ({ ...e, [key]: !e[key] }));

  const saveSettings = () => {
    localStorage.setItem('ff_notifications', JSON.stringify(enabled));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Schedule a demo notification for any enabled
    if (permission === 'granted') {
      const activeKeys = Object.keys(enabled).filter(k => enabled[k]);
      if (activeKeys.length > 0) {
        new Notification('FitForge Reminders', {
          body: `${activeKeys.length} reminder${activeKeys.length > 1 ? 's' : ''} set up! 💪`,
          icon: '/favicon.ico'
        });
      }
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-semibold text-sm">Reminders</h3>
        </div>
        {permission !== 'granted' && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={requestPermission}>
            Enable Notifications
          </Button>
        )}
      </div>

      {permission === 'denied' && (
        <p className="text-xs text-muted-foreground bg-destructive/10 text-destructive rounded-lg px-3 py-2 mb-3">
          Notifications blocked. Please update your browser settings.
        </p>
      )}

      <div className="space-y-2">
        {REMINDER_TYPES.map(r => (
          <button
            key={r.key}
            onClick={() => toggle(r.key)}
            disabled={permission !== 'granted'}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
              enabled[r.key] ? "border-primary/30 bg-primary/5" : "border-border hover:border-border/80 bg-secondary/10",
              permission !== 'granted' && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-xl">{r.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{r.label}</p>
              <p className="text-[10px] text-muted-foreground">{r.description} · {r.time}</p>
            </div>
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
              enabled[r.key] ? "bg-primary border-primary" : "border-muted-foreground/30"
            )}>
              {enabled[r.key] && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
          </button>
        ))}
      </div>

      {permission === 'granted' && (
        <Button size="sm" className="w-full mt-4 h-8 text-xs" onClick={saveSettings} variant={saved ? "outline" : "default"}>
          {saved ? <><Check className="w-3 h-3 mr-1" /> Saved!</> : 'Save Reminders'}
        </Button>
      )}
    </div>
  );
}