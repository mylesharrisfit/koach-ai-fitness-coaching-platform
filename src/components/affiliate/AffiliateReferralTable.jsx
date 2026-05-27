import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download } from 'lucide-react';

const STATUS_COLORS = {
  trial: '#F59E0B',
  active: '#10B981',
  churned: '#EF4444',
  paused: '#64748B',
};

export default function AffiliateReferralTable({ profile }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const { data: referrals = [] } = useQuery({
    queryKey: ['affiliate-commissions', profile.coach_id],
    queryFn: () => base44.entities.AffiliateCommission.filter({ affiliate_id: profile.coach_id }, '-signup_date'),
  });

  const filtered = filterStatus === 'all' ? referrals : referrals.filter(r => r.status === filterStatus);
  
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.signup_date) - new Date(a.signup_date);
    if (sortBy === 'highest_value') return b.monthly_value - a.monthly_value;
    if (sortBy === 'longest_active') return new Date(b.status_changed_at) - new Date(a.status_changed_at);
    return 0;
  });

  const handleExport = () => {
    const csv = [
      ['Coach', 'Sign Up Date', 'Plan', 'Monthly Value', 'Commission %', 'This Month', 'Status'],
      ...sorted.map(r => [
        r.coach_name,
        r.signup_date,
        r.current_plan,
        `$${r.monthly_value.toFixed(2)}`,
        `${r.commission_rate}%`,
        `$${r.monthly_commission.toFixed(2)}`,
        r.status,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'referrals.csv';
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'active', 'churned', 'trial'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                filterStatus === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-900 font-bold hover:bg-slate-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="text-left py-3 px-4 font-bold text-slate-900">Coach</th>
                <th className="text-left py-3 px-4 font-bold text-slate-900">Sign Up</th>
                <th className="text-center py-3 px-4 font-bold text-slate-900">Plan</th>
                <th className="text-right py-3 px-4 font-bold text-slate-900">Monthly Value</th>
                <th className="text-right py-3 px-4 font-bold text-slate-900">Commission</th>
                <th className="text-center py-3 px-4 font-bold text-slate-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((ref) => (
                <tr key={ref.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-900">{ref.coach_name.split('@')[0]}</td>
                  <td className="py-3 px-4 text-slate-600">{new Date(ref.signup_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-900">{ref.current_plan}</td>
                  <td className="py-3 px-4 text-right text-slate-900">${ref.monthly_value.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">${ref.monthly_commission.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: STATUS_COLORS[ref.status] }}>
                      {ref.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No referrals yet. Share your affiliate link to start earning!
          </div>
        )}
      </div>
    </div>
  );
}