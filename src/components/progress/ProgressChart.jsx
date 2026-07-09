import React from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { BarChart2 } from 'lucide-react';

const TOOLTIP_STYLE = {
  contentStyle: { background: 'rgb(var(--card))', border: '1px solid rgb(var(--border))', borderRadius: '8px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  labelStyle: { color: 'rgb(var(--foreground))', fontWeight: 600 },
};

const TIME_RANGES = ['1M', '3M', '6M', '1Y', 'All'];

export default function ProgressChart({ data, metric, timeRange, onTimeRangeChange }) {
  if (!data || data.length < 2) {
    return (
      <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-16 gap-3">
        <BarChart2 className="w-10 h-10 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Not enough data for this metric.</p>
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
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--muted))" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}${metric.unit}`, metric.label]} />
          <Bar dataKey="value" fill="rgb(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      );
    }

    if (metric.chart === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--muted))" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}${metric.unit}`, metric.label]} />
          <Line type="monotone" dataKey="value" stroke="rgb(var(--primary))" strokeWidth={2.5}
            dot={{ r: 4, fill: 'rgb(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
        </LineChart>
      );
    }

    // area (default)
    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.15} />
            <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--muted))" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}${metric.unit}`, metric.label]} />
        <Area type="monotone" dataKey="value" stroke="rgb(var(--primary))" strokeWidth={2.5}
          fill="url(#areaGrad)" dot={{ r: 4, fill: 'rgb(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
      </AreaChart>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-end gap-1 mb-4">
        {TIME_RANGES.map(r => (
          <button
            key={r}
            onClick={() => onTimeRangeChange(r)}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              timeRange === r
                ? 'bg-primary text-white'
                : 'bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary'
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