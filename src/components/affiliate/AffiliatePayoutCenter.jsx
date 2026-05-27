import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download } from 'lucide-react';

export default function AffiliatePayoutCenter({ profile }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: payouts = [] } = useQuery({
    queryKey: ['affiliate-payouts', profile.coach_id],
    queryFn: () => base44.entities.AffiliatePayout.filter({ affiliate_id: profile.coach_id }, '-payout_month'),
  });

  const selectedPayout = payouts.find(p => p.payout_month === selectedMonth);

  const totalYearToDate = payouts
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.net_amount, 0);

  return (
    <div className="space-y-6">
      {/* Payout settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Payout Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">Payment Method</label>
            <p className="px-4 py-2 rounded-lg bg-slate-50 text-slate-900 font-semibold">Stripe Connect (Bank Transfer)</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">Payout Schedule</label>
            <p className="px-4 py-2 rounded-lg bg-slate-50 text-slate-900 font-semibold">Monthly (1st of each month)</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">Minimum Payout</label>
            <p className="px-4 py-2 rounded-lg bg-slate-50 text-slate-900 font-semibold">$100</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">Tax Form Status</label>
            <p className={`px-4 py-2 rounded-lg font-semibold ${
              profile.tax_form_status === 'verified'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {profile.tax_form_status === 'verified' ? '✓ Verified (W-9/W-8BEN on file)' : 'Pending — Submit tax form to receive payouts'}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly statement */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Earnings Breakdown</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-900 mb-2">Select Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {selectedPayout ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50">
              <p className="text-sm text-slate-600">Gross Earnings</p>
              <p className="text-3xl font-black text-slate-900">${selectedPayout.gross_earnings.toFixed(2)}</p>
            </div>

            {selectedPayout.commission_breakdown && selectedPayout.commission_breakdown.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-700">Commissions by Coach:</p>
                {selectedPayout.commission_breakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-3 rounded-lg bg-slate-50">
                    <span className="text-slate-900">{item.coach_id?.substring(0, 8)}... @ {item.rate}%</span>
                    <span className="font-bold text-slate-900">${item.commission.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-600">Net Payout</p>
              <p className="text-3xl font-black text-blue-700">${selectedPayout.net_amount.toFixed(2)}</p>
              <p className="text-xs text-blue-600 mt-1">Status: {selectedPayout.status}</p>
            </div>

            {selectedPayout.statement_url && (
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 text-slate-900 font-bold hover:bg-slate-50">
                <Download className="w-4 h-4" /> Download Statement
              </button>
            )}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">No payout data for this month</p>
        )}
      </div>

      {/* Year to date */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Year to Date</h3>
        <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200">
          <p className="text-sm text-emerald-600">Total Paid Out (2026)</p>
          <p className="text-4xl font-black text-emerald-700">${totalYearToDate.toFixed(2)}</p>
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Payout History</h3>
        {payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-3 font-bold text-slate-900">Month</th>
                  <th className="text-right py-3 px-3 font-bold text-slate-900">Gross</th>
                  <th className="text-right py-3 px-3 font-bold text-slate-900">Net</th>
                  <th className="text-center py-3 px-3 font-bold text-slate-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-900">{p.payout_month}</td>
                    <td className="py-3 px-3 text-right text-slate-600">${p.gross_earnings.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">${p.net_amount.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                        p.status === 'paid' ? 'bg-emerald-500' : p.status === 'pending' ? 'bg-amber-500' : 'bg-slate-500'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">No payout history yet</p>
        )}
      </div>
    </div>
  );
}