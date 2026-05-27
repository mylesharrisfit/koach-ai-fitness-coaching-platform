import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, Check, Clock, Mail, Smartphone, Monitor, ChevronDown, ChevronUp, History } from 'lucide-react';
import { toast } from 'sonner';
import { NToggle } from '@/components/notifications/NotifsHelpers';
import NotifsClientActivity from '@/components/notifications/NotifsClientActivity';
import NotifsMessages from '@/components/notifications/NotifsMessages';
import NotifsPayments from '@/components/notifications/NotifsPayments';
import NotifsLeads from '@/components/notifications/NotifsLeads';
import NotifsAI from '@/components/notifications/NotifsAI';
import NotifsScheduling from '@/components/notifications/NotifsScheduling';
import NotifsCommunity from '@/components/notifications/NotifsCommunity';
import NotifsSystem from '@/components/notifications/NotifsSystem';
import NotifsDigest from '@/components/notifications/NotifsDigest';
import NotifsHistory from '@/components/notifications/NotifsHistory';

const EMPTY = {
  all_notifications_enabled: true,
  push_enabled: true,
  email_enabled: true,
  inapp_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  client_activity: {},
  messages: {},
  payments: {},
  leads: {},
  ai_insights: {},
  scheduling: {},
  community: {},
  system: {},
  daily_digest_enabled: true,
  daily_digest_time: '07:00',
  daily_digest_includes: ['checkins', 'messages', 'sessions', 'at_risk', 'invoices'],
  weekly_digest_enabled: true,
  weekly_digest_day: 1,
  weekly_digest_time: '08:00',
  weekly_digest_includes: ['metrics', 'progress', 'insights', 'pipeline', 'revenue'],
};

export default function NotificationSettings() {
  const queryClient = useQueryClient();
  const [s, setS] = useState(EMPTY);
  const [settingsId, setSettingsId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const saveTimer = useRef(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: existing = [] } = useQuery({
    queryKey: ['notif-settings', user?.email],
    queryFn: () => base44.entities.NotificationSettings.filter({ coach_id: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (existing.length > 0) {
      const rec = existing[0];
      setS({ ...EMPTY, ...rec });
      setSettingsId(rec.id);
    }
  }, [existing]);

  const save = useCallback(async (data) => {
    const payload = { ...data, coach_id: user?.email };
    if (settingsId) {
      await base44.entities.NotificationSettings.update(settingsId, payload);
    } else {
      const created = await base44.entities.NotificationSettings.create(payload);
      setSettingsId(created.id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    queryClient.invalidateQueries({ queryKey: ['notif-settings'] });
  }, [settingsId, user, queryClient]);

  // Auto-save with debounce
  const set = useCallback((key, val) => {
    setS(prev => {
      const next = { ...prev, [key]: val };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(next), 800);
      return next;
    });
  }, [save]);

  const allOff = !s.all_notifications_enabled;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/settings" className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Notification Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5">Control every alert you receive from KOACH AI</p>
          </div>
        </div>
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
              <Check className="w-4 h-4" /> Saved ✓
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-5">

        {/* ── MASTER TOGGLE ── */}
        <div className="bg-white rounded-2xl border-2 p-5 flex items-center justify-between"
          style={{
            borderColor: allOff ? '#FECACA' : '#E2E8F0',
            background: allOff ? '#FFF5F5' : 'white',
            boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
          }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: allOff ? '#FEE2E2' : 'linear-gradient(135deg, #EFF6FF, #F5F3FF)' }}>
              {allOff ? <BellOff className="w-5 h-5 text-red-400" /> : <Bell className="w-5 h-5 text-blue-600" />}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">All Notifications</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {allOff ? '⚠️ All notifications are muted' : 'Receiving notifications normally'}
              </p>
            </div>
          </div>
          <NToggle value={s.all_notifications_enabled} onChange={v => set('all_notifications_enabled', v)} />
        </div>

        {/* ── GLOBAL DELIVERY ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <span className="text-base">📬</span>
            <h2 className="font-bold text-slate-800 text-sm">Global Delivery Preferences</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Default delivery for all notifications</p>
            <div className="space-y-3">
              {[
                { key: 'push_enabled', icon: Smartphone, label: 'Push Notifications', desc: 'Sent to your mobile device', color: '#7C3AED' },
                { key: 'email_enabled', icon: Mail, label: 'Email Notifications', desc: `Sent to ${user?.email || 'your business email'}`, color: '#2563EB' },
                { key: 'inapp_enabled', icon: Monitor, label: 'In-App Notifications', desc: 'Always on — cannot be disabled', color: '#059669', locked: true },
              ].map(({ key, icon: Icon, label, desc, color, locked }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{label}</p>
                        {locked && <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">Always on</span>}
                      </div>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </div>
                  <NToggle value={s[key] !== false} onChange={v => set(key, v)} disabled={locked} />
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <p className="text-sm font-bold text-slate-800">Quiet Hours</p>
                </div>
                <NToggle value={s.quiet_hours_enabled} onChange={v => set('quiet_hours_enabled', v)} />
              </div>
              {s.quiet_hours_enabled && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">From</span>
                        <input type="time" value={s.quiet_hours_start || '22:00'} onChange={e => set('quiet_hours_start', e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">To</span>
                        <input type="time" value={s.quiet_hours_end || '07:00'} onChange={e => set('quiet_hours_end', e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-400" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      🔕 Push notifications silenced during quiet hours. Emails still send.
                    </p>
                    <p className="text-xs text-blue-600 font-medium">🌍 Your timezone: America/New_York</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* ── PUSH PERMISSION BANNER ── */}
        {typeof Notification !== 'undefined' && Notification.permission !== 'granted' && s.push_enabled && (
          <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-amber-200 bg-amber-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">📱</span>
              <div>
                <p className="text-sm font-bold text-amber-800">Enable Push Notifications</p>
                <p className="text-xs text-amber-600 mt-0.5">Allow browser notifications to receive push alerts</p>
              </div>
            </div>
            <button onClick={() => Notification.requestPermission().then(p => { if (p === 'granted') toast.success('Push notifications enabled!'); })}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #D97706, #B45309)' }}>
              Enable
            </button>
          </div>
        )}

        {/* ── SECTIONS (dimmed when all off) ── */}
        <div className={`space-y-5 transition-opacity ${allOff ? 'opacity-40 pointer-events-none select-none' : ''}`}>
          <NotifsClientActivity s={s} set={set} />
          <NotifsMessages s={s} set={set} />
          <NotifsPayments s={s} set={set} />
          <NotifsLeads s={s} set={set} />
          <NotifsAI s={s} set={set} />
          <NotifsScheduling s={s} set={set} />
          <NotifsCommunity s={s} set={set} />
          <NotifsSystem s={s} set={set} />
          <NotifsDigest s={s} setField={set} />
        </div>

        {/* ── HISTORY BUTTON ── */}
        <button onClick={() => setShowHistory(true)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-semibold text-sm hover:border-blue-300 hover:text-blue-600 transition-colors">
          <History className="w-4 h-4" /> View Notification History (Last 30 Days)
        </button>

        <div className="pb-8" />
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && <NotifsHistory onClose={() => setShowHistory(false)} />}
      </AnimatePresence>
    </div>
  );
}