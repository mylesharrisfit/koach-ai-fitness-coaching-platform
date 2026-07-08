import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Demo data
const EARNINGS_DATA = [
  { date: 'May 1', earnings: 200 },
  { date: 'May 5', earnings: 450 },
  { date: 'May 10', earnings: 380 },
  { date: 'May 15', earnings: 620 },
  { date: 'May 20', earnings: 750 },
  { date: 'May 25', earnings: 920 },
];

const FUNNEL_DATA = [
  { stage: 'Clicks', value: 2450, color: '#3B82F6' },
  { stage: 'Signups', value: 1820, color: '#8B5CF6' },
  { stage: 'Trials', value: 945, color: '#F59E0B' },
  { stage: 'Paid', value: 672, color: '#10B981' },
  { stage: 'Active (30d)', value: 518, color: '#06B6D4' },
];

export default function AffiliatePerformanceChart({ profile }) {
  const [timeRange, setTimeRange] = useState('30d');

  return (
    <div className="space-y-6">
      {/* Earnings chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900">Earnings Over Time</h3>
          <div className="flex gap-2">
            {['7d', '30d', '90d', '1y', 'all'].map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeRange === r
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {r === '7d' ? '7D' : r === '30d' ? '30D' : r === '90d' ? '90D' : r === '1y' ? '1Y' : 'All'}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={EARNINGS_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 8 }} />
            <Line type="monotone" dataKey="earnings" stroke="#2563EB" strokeWidth={3} dot={{ fill: '#2563EB', r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-6">Conversion Funnel</h3>
        <div className="space-y-4">
          {FUNNEL_DATA.map((item, i) => {
            const pct = (item.value / FUNNEL_DATA[0].value) * 100;
            const nextPct = i < FUNNEL_DATA.length - 1 ? (FUNNEL_DATA[i + 1].value / item.value) * 100 : 100;
            return (
              <div key={item.stage}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-slate-900">{item.stage}</p>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{item.value.toLocaleString()}</p>
                    {i < FUNNEL_DATA.length - 1 && (
                      <p className="text-xs text-slate-500">{nextPct.toFixed(0)}% conversion</p>
                    )}
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: item.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}