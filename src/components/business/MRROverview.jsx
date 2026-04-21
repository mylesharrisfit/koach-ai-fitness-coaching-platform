import React, { useMemo } from 'react';
import { subMonths, format, startOfMonth, parseISO } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';

export default function MRROverview({ clients, payments }) {
  const mrrData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const monthStart = startOfMonth(d);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      // Active clients as of that month (started before month end)
      const activeAtMonth = clients.filter(c => {
        const sd = c.start_date ? parseISO(c.start_date) : c.created_date ? new Date(c.created_date) : null;
        return sd && sd <= monthEnd && (c.status === 'active' || c.lifecycle_status === 'active');
      });

      const mrr = activeAtMonth.reduce((sum, c) => sum + (c.monthly_rate || 0), 0);

      // Paid payments this month
      const monthPayments = payments.filter(p => {
        if (p.status !== 'paid') return false;
        const pd = p.paid_date ? parseISO(p.paid_date) : p.created_date ? new Date(p.created_date) : null;
        return pd && pd >= monthStart && pd <= monthEnd;
      });
      const revenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      return { month: format(d, 'MMM'), mrr, revenue: revenue || mrr };
    });
  }, [clients, payments]);

  const currentMRR = mrrData[mrrData.length - 1]?.mrr || 0;
  const prevMRR = mrrData[mrrData.length - 2]?.mrr || 0;
  const growth = prevMRR > 0 ? (((currentMRR - prevMRR) / prevMRR) * 100).toFixed(1) : null;

  return (
    <div className="bg-white border border-[#E7EAF3] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">MRR Trend</h3>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {growth !== null && (
            <span className={Number(growth) >= 0 ? 'text-emerald-600' : 'text-red-500'}>
              {Number(growth) >= 0 ? '▲' : '▼'} {Math.abs(growth)}% MoM
            </span>
          )}
        </div>
      </div>
      <p className="stat-number text-3xl font-bold text-[#1F2A44] mb-5">${currentMRR.toLocaleString()}</p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={mrrData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7EAF3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
          <Tooltip
            contentStyle={{ background: '#FFFFFF', border: '1px solid #E7EAF3', borderRadius: '10px', fontSize: 12 }}
            formatter={(value) => [`$${value.toLocaleString()}`, 'MRR']}
          />
          <Area type="monotone" dataKey="mrr" stroke="#22C55E" strokeWidth={2} fill="url(#mrrGrad)" dot={{ fill: '#22C55E', r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}