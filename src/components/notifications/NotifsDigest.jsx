import React from 'react';
import { NToggle } from './NotifsHelpers';

const DAILY_OPTIONS = [
  { value: 'checkins', label: 'Pending check-in reviews' },
  { value: 'messages', label: 'Unread messages' },
  { value: 'sessions', label: "Today's sessions" },
  { value: 'at_risk', label: 'New at-risk clients' },
  { value: 'invoices', label: 'Outstanding invoices' },
];

const WEEKLY_OPTIONS = [
  { value: 'metrics', label: 'Business metrics' },
  { value: 'progress', label: 'Client progress highlights' },
  { value: 'insights', label: 'AI insights' },
  { value: 'pipeline', label: 'Lead pipeline status' },
  { value: 'revenue', label: 'Revenue snapshot' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_DAILY_INCLUDES = ['checkins', 'messages', 'sessions', 'at_risk', 'invoices'];
const DEFAULT_WEEKLY_INCLUDES = ['metrics', 'progress', 'insights', 'pipeline', 'revenue'];

function MultiCheckGrid({ values = [], onChange, options }) {
  const toggle = (v) => {
    const next = values.includes(v) ? values.filter(x => x !== v) : [...values, v];
    onChange(next);
  };
  return (
    <div className="space-y-2 mt-3">
      {options.map(o => (
        <label key={o.value} className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => toggle(o.value)}
            className="w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all cursor-pointer"
            style={{
              background: values.includes(o.value) ? 'linear-gradient(135deg, #2563EB, #7C3AED)' : 'white',
              borderColor: values.includes(o.value) ? '#2563EB' : '#CBD5E1',
            }}>
            {values.includes(o.value) && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  );
}

export default function NotifsDigest({ s, setField }) {
  const dailyIncludes = s.daily_digest_includes?.length ? s.daily_digest_includes : DEFAULT_DAILY_INCLUDES;
  const weeklyIncludes = s.weekly_digest_includes?.length ? s.weekly_digest_includes : DEFAULT_WEEKLY_INCLUDES;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <span className="text-base">📧</span>
        <h2 className="font-bold text-slate-800 text-sm">Email Digest Settings</h2>
      </div>
      <div className="p-6 space-y-6">
        {/* Daily Digest */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-slate-800">Daily Digest</p>
              <p className="text-xs text-slate-500 mt-0.5">Morning summary delivered to your email</p>
            </div>
            <NToggle value={s.daily_digest_enabled !== false} onChange={v => setField('daily_digest_enabled', v)} />
          </div>
          {s.daily_digest_enabled !== false && (
            <div className="ml-0 space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 font-medium w-20 flex-shrink-0">Delivery time</span>
                <input type="time" value={s.daily_digest_time || '07:00'}
                  onChange={e => setField('daily_digest_time', e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 font-semibold text-slate-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Include in digest</p>
                <MultiCheckGrid values={dailyIncludes} onChange={v => setField('daily_digest_includes', v)} options={DAILY_OPTIONS} />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100" />

        {/* Weekly Digest */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-slate-800">Weekly Digest</p>
              <p className="text-xs text-slate-500 mt-0.5">Your weekly business & client overview</p>
            </div>
            <NToggle value={s.weekly_digest_enabled !== false} onChange={v => setField('weekly_digest_enabled', v)} />
          </div>
          {s.weekly_digest_enabled !== false && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-slate-600 font-medium flex-shrink-0">Send on</span>
                <div className="relative">
                  <select value={String(s.weekly_digest_day ?? 1)} onChange={e => setField('weekly_digest_day', Number(e.target.value))}
                    className="pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-400 appearance-none bg-white">
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                  <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                <span className="text-sm text-slate-600 font-medium flex-shrink-0">at</span>
                <input type="time" value={s.weekly_digest_time || '08:00'}
                  onChange={e => setField('weekly_digest_time', e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 font-semibold text-slate-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Include in digest</p>
                <MultiCheckGrid values={weeklyIncludes} onChange={v => setField('weekly_digest_includes', v)} options={WEEKLY_OPTIONS} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}