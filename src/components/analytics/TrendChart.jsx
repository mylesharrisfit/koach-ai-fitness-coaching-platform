import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label, unit, formatter }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-white border border-[#E7EAF3] rounded-xl px-3 py-2 shadow-sm text-xs">
      <p className="text-[#6B7280] mb-1">{label}</p>
      <p className="font-bold text-[#1F2A44]">{formatter ? formatter(val) : `${val}${unit || ''}`}</p>
    </div>
  );
};

export default function TrendChart({ data, unit, color = '#6366f1', referenceValue, formatter, className }) {
  return (
    <div className={cn('w-full h-40', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7EAF3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          {referenceValue != null && (
            <ReferenceLine y={referenceValue} stroke="hsl(var(--border))" strokeDasharray="4 2" />
          )}
          <Tooltip content={<CustomTooltip unit={unit} formatter={formatter} />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={{ fill: color, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}