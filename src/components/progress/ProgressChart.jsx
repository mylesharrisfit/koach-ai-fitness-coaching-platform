import React from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { BarChart2 } from 'lucide-react';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  labelStyle: { color: '#111827', fontWeight: 600 },
};

const TIME_RANGES = ['1M', '3M', '6M', '1Y', 'All'];

export default function ProgressChart({ data, metric, timeRange, onTimeRangeChange }) {
  if (!data || data.length < 2) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl flex flex-col items-center justify-center py-16 gap-3">
        <BarChart2 className="w-10 h-10 text-[#D1D5DB]" />
        <p className="text-[#9CA3AF] text-sm">Not enough data for this metric.</p>
        <p className="text-[#C4C9D4] text-xs">Log at least 2 check-ins to see a chart.</p>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 8, right: 16, left: 0, bottom: 0 },
    };

    if (metric.chart === 'bar') {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}${metric.unit}`, metric.label]} />
          <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      );
    }

    if (metric.chart === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}${metric.unit}`, metric.label]} />
          <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2.5}
            dot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
        </LineChart>
      );
    }

    // area (default)
    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}${metric.unit}`, metric.label]} />
        <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2.5}
          fill="url(#areaGrad)" dot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
      </AreaChart>
    );
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
      <div className="flex items-center justify-end gap-1 mb-4">
        {TIME_RANGES.map(r => (
          <button
            key={r}
            onClick={() => onTimeRangeChange(r)}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              timeRange === r
                ? 'bg-[#2563EB] text-white'
                : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#2563EB] hover:text-[#2563EB]'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}