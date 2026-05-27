import React from 'react';
import { Calendar, Plus, X } from 'lucide-react';
import { BSSection, BSRow, BSToggle, BSSelect, BSInput, BSTextarea, BSDivider } from './BSSection';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const RESPONSE_TIMES = [
  { value: '1h', label: 'Within 1 hour' }, { value: '4h', label: 'Within 4 hours' },
  { value: '24h', label: 'Within 24 hours' }, { value: '48h', label: 'Within 48 hours' },
  { value: 'best_effort', label: 'Best effort' },
];
const BUFFER_OPTIONS = [0, 5, 10, 15, 30].map(m => ({ value: m, label: m === 0 ? 'No buffer' : `${m} min` }));
const DEFAULT_HOURS = { start: '09:00', end: '18:00', enabled: true };
const DEFAULT_WORKING_HOURS = Object.fromEntries(DAYS.map((d, i) => [d, i < 5 ? { ...DEFAULT_HOURS } : { ...DEFAULT_HOURS, enabled: false }]));
const DEFAULT_SESSION_TYPES = [
  { id: '1', name: 'Check-in Call', duration: 30 },
  { id: '2', name: 'Program Review', duration: 45 },
  { id: '3', name: 'Onboarding Call', duration: 60 },
];

const DEFAULTS = {
  working_hours: DEFAULT_WORKING_HOURS, response_time: '24h',
  auto_reply_enabled: false, auto_reply_message: '',
  allow_session_requests: true, session_types: DEFAULT_SESSION_TYPES,
  booking_notice_hours: 24, max_sessions_per_month: 0, session_buffer_minutes: 0,
};

export default function BSScheduling({ s, set }) {
  const hours = s.working_hours || DEFAULT_WORKING_HOURS;
  const sessionTypes = s.session_types || DEFAULT_SESSION_TYPES;

  const updateDay = (day, field, val) => set('working_hours', { ...hours, [day]: { ...(hours[day] || DEFAULT_HOURS), [field]: val } });
  const copyMonToWeekdays = () => {
    const mon = hours['Monday'] || DEFAULT_HOURS;
    const next = { ...hours };
    ['Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(d => { next[d] = { ...mon }; });
    set('working_hours', next);
  };

  const addSessionType = () => set('session_types', [...sessionTypes, { id: Date.now().toString(), name: 'Custom Session', duration: 60 }]);
  const updateSession = (id, field, val) => set('session_types', sessionTypes.map(st => st.id === id ? { ...st, [field]: val } : st));
  const removeSession = (id) => set('session_types', sessionTypes.filter(st => st.id !== id));

  return (
    <BSSection icon={Calendar} title="Scheduling & Availability" onReset={() => Object.entries(DEFAULTS).forEach(([k, v]) => set(k, v))}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Working Hours</p>
      <BSRow label="Day availability" hint="Set hours for each day">
        <div className="space-y-2">
          {DAYS.map(day => {
            const d = hours[day] || DEFAULT_HOURS;
            return (
              <div key={day} className="flex items-center gap-3">
                <BSToggle value={d.enabled} onChange={v => updateDay(day, 'enabled', v)} />
                <span className="text-sm font-medium text-slate-600 w-24 flex-shrink-0">{day.slice(0, 3)}</span>
                {d.enabled && (
                  <>
                    <input type="time" value={d.start || '09:00'} onChange={e => updateDay(day, 'start', e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400" />
                    <span className="text-slate-400 text-sm">to</span>
                    <input type="time" value={d.end || '18:00'} onChange={e => updateDay(day, 'end', e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400" />
                  </>
                )}
                {!d.enabled && <span className="text-slate-400 text-sm italic">Off</span>}
              </div>
            );
          })}
          <button onClick={copyMonToWeekdays} className="text-xs text-blue-600 font-semibold hover:underline mt-1">
            Copy Monday to all weekdays
          </button>
        </div>
      </BSRow>

      <BSDivider />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Response Time</p>
      <BSRow label="Expected response time" hint="Shown to clients in their app">
        <BSSelect value={s.response_time} onChange={v => set('response_time', v)} options={RESPONSE_TIMES} />
      </BSRow>
      <BSRow label="Auto-reply outside hours" hint="Sent when client messages outside working hours">
        <div className="space-y-2">
          <BSToggle value={s.auto_reply_enabled} onChange={v => set('auto_reply_enabled', v)} />
          {s.auto_reply_enabled && (
            <BSTextarea value={s.auto_reply_message} onChange={v => set('auto_reply_message', v)}
              placeholder="Thanks for your message! I'll get back to you within [response time]. — Coach [Name]" rows={2} />
          )}
        </div>
      </BSRow>

      <BSDivider />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Booking</p>
      <BSRow label="Allow session requests">
        <BSToggle value={s.allow_session_requests} onChange={v => set('allow_session_requests', v)} />
      </BSRow>
      {s.allow_session_requests && <>
        <BSRow label="Session types">
          <div className="space-y-2">
            {sessionTypes.map(st => (
              <div key={st.id} className="flex items-center gap-2">
                <input value={st.name} onChange={e => updateSession(st.id, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400" />
                <BSInput type="number" value={st.duration} onChange={v => updateSession(st.id, 'duration', v)} min={15} className="w-20" />
                <span className="text-sm text-slate-500 flex-shrink-0">min</span>
                <button onClick={() => removeSession(st.id)} className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button onClick={addSessionType} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
              <Plus className="w-4 h-4" /> Add Session Type
            </button>
          </div>
        </BSRow>
        <BSRow label="Booking notice required">
          <div className="flex items-center gap-2">
            <BSInput type="number" value={s.booking_notice_hours} onChange={v => set('booking_notice_hours', v)} min={0} className="w-24" />
            <span className="text-sm text-slate-500">hours in advance</span>
          </div>
        </BSRow>
        <BSRow label="Max sessions per client/month" hint="0 = unlimited">
          <BSInput type="number" value={s.max_sessions_per_month} onChange={v => set('max_sessions_per_month', v)} min={0} className="w-24" />
        </BSRow>
        <BSRow label="Buffer between sessions">
          <BSSelect value={String(s.session_buffer_minutes)} onChange={v => set('session_buffer_minutes', Number(v))}
            options={BUFFER_OPTIONS.map(o => ({ value: String(o.value), label: o.label }))} />
        </BSRow>
      </>}
    </BSSection>
  );
}