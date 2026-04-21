import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AcquisitionTrends({ data, totalActive }) {
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const totalNew = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-white border border-[#E7EAF3] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">Client Acquisition</h3>
        <span className="text-xs text-[#6B7280]">{totalNew} new in 6 months</span>
      </div>
      <p className="stat-number text-3xl font-bold text-[#1F2A44] mb-5">{totalActive} active</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7EAF3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#FFFFFF', border: '1px solid #E7EAF3', borderRadius: '10px', fontSize: 12 }}
            formatter={(value) => [value, 'New clients']}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={index === data.length - 1 ? '#3B82F6' : '#BFDBFE'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}