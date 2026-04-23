import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ProfileProgressTab({ client, checkIns }) {
  const withWeight = checkIns.filter(ci => ci.weight).sort((a, b) => new Date(a.date) - new Date(b.date));
  const weightData = withWeight.map(ci => ({ date: format(new Date(ci.date), 'MMM d'), weight: ci.weight }));

  const adherenceData = checkIns
    .filter(ci => ci.compliance_training != null || ci.compliance_nutrition != null)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(ci => ({
      date: format(new Date(ci.date), 'MMM d'),
      training: ci.compliance_training,
      nutrition: ci.compliance_nutrition,
    }));

  const weightChange = withWeight.length >= 2
    ? (withWeight[withWeight.length - 1].weight - withWeight[0].weight).toFixed(1)
    : null;

  const TrendIcon = weightChange === null ? null : weightChange > 0 ? TrendingUp : weightChange < 0 ? TrendingDown : Minus;
  const trendColor = weightChange === null ? '' : weightChange < 0 ? 'text-emerald-600' : weightChange > 0 ? 'text-red-500' : 'text-[#9CA3AF]';

  if (checkIns.length === 0) return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] flex flex-col items-center justify-center py-12 text-center px-6">
      <div className="w-12 h-12 rounded-full bg-[#F6F7FB] flex items-center justify-center mb-3">
        <TrendingUp className="w-5 h-5 text-[#9CA3AF]" />
      </div>
      <p className="text-sm font-semibold text-[#374151]">No progress data yet</p>
      <p className="text-xs text-[#9CA3AF] mt-1">Progress charts will appear once check-in data is collected</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4 text-center">
          <p className="text-xs text-[#9CA3AF] mb-1">Starting Weight</p>
          <p className="text-lg font-bold text-[#1F2A44]">{withWeight[0]?.weight ?? '—'} {withWeight[0] ? 'lbs' : ''}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4 text-center">
          <p className="text-xs text-[#9CA3AF] mb-1">Current Weight</p>
          <p className="text-lg font-bold text-[#1F2A44]">{withWeight[withWeight.length - 1]?.weight ?? '—'} {withWeight.length ? 'lbs' : ''}</p>
        </div>
        {weightChange !== null && (
          <div className="col-span-2 bg-white rounded-2xl border border-[#E7EAF3] p-4 flex items-center justify-center gap-2">
            {TrendIcon && <TrendIcon className={`w-5 h-5 ${trendColor}`} />}
            <span className={`text-lg font-bold ${trendColor}`}>{weightChange > 0 ? '+' : ''}{weightChange} lbs</span>
            <span className="text-xs text-[#9CA3AF]">total change</span>
          </div>
        )}
      </div>

      {/* Weight chart */}
      {weightData.length >= 2 && (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
          <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-4">Weight Over Time</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F8" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ border: '1px solid #E7EAF3', borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Adherence chart */}
      {adherenceData.length >= 2 && (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
          <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-4">Compliance Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={adherenceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F8" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ border: '1px solid #E7EAF3', borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="training" name="Training" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="nutrition" name="Nutrition" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1 text-xs text-[#6B7280]"><span className="w-3 h-0.5 bg-primary inline-block rounded" />Training</span>
            <span className="flex items-center gap-1 text-xs text-[#6B7280]"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />Nutrition</span>
          </div>
        </div>
      )}

      {/* Photo uploads */}
      {checkIns.some(ci => ci.photo_urls?.length) && (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
          <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Progress Photos</h3>
          <div className="grid grid-cols-3 gap-2">
            {checkIns.filter(ci => ci.photo_urls?.length).slice(0, 6).map(ci =>
              ci.photo_urls.map((url, i) => (
                <img key={`${ci.id}-${i}`} src={url} alt="progress" className="w-full aspect-square object-cover rounded-xl" />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}