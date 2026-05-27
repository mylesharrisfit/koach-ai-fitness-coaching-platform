import React, { useMemo } from 'react';
import { Gauge, ArrowUp, CheckCircle2 } from 'lucide-react';

const PLAN_LIMITS = { starter: 10, pro: 25, elite: 50, enterprise: 150 };

export default function BICapacity({ clients, user }) {
  const activeClients = useMemo(() => clients.filter(c => c.lifecycle_status === 'active' || c.status === 'active'), [clients]);
  const mrr = useMemo(() => activeClients.reduce((s, c) => s + (c.monthly_rate || 0), 0), [activeClients]);

  const planLimit = PLAN_LIMITS[user?.subscription?.plan] || 25;
  const utilizationPct = Math.min(100, Math.round((activeClients.length / planLimit) * 100));
  const revenuePerSlot = planLimit > 0 ? Math.round(mrr / planLimit) : 0;
  const availableSlots = Math.max(0, planLimit - activeClients.length);

  const color = utilizationPct >= 90 ? '#EF4444' : utilizationPct >= 70 ? '#F59E0B' : '#22C55E';

  // Project weeks to capacity (assume ~2 new clients/month)
  const weeksToCapacity = availableSlots > 0 ? Math.round((availableSlots / 2) * 4.33) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Gauge className="w-4 h-4 text-primary" /> Capacity Analysis
      </h3>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-gray-500">Client capacity</p>
            <p className="text-xs font-bold" style={{ color }}>{utilizationPct}%</p>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${utilizationPct}%`, background: color }} />
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-[10px] text-gray-400">{activeClients.length} active</p>
            <p className="text-[10px] text-gray-400">{planLimit} limit</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-2.5 bg-gray-50 rounded-xl text-center">
          <p className="text-[10px] text-gray-400 font-medium mb-0.5">Available Slots</p>
          <p className="text-lg font-bold text-gray-800">{availableSlots}</p>
        </div>
        <div className="p-2.5 bg-gray-50 rounded-xl text-center">
          <p className="text-[10px] text-gray-400 font-medium mb-0.5">Revenue / Slot</p>
          <p className="text-lg font-bold text-gray-800">${revenuePerSlot}</p>
        </div>
      </div>

      {utilizationPct >= 80 && (
        <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
          <ArrowUp className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color }} />
          <p style={{ color }}>
            {utilizationPct >= 90
              ? `You're at ${utilizationPct}% capacity! At current growth you'll hit your limit in ~${weeksToCapacity} weeks — consider upgrading.`
              : `At current growth rate you'll reach capacity in ~${weeksToCapacity} weeks.`}
          </p>
        </div>
      )}

      {utilizationPct < 60 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 text-xs text-green-700">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-500" />
          <p>You have room for <strong>{availableSlots} more clients</strong> — great time to grow your pipeline!</p>
        </div>
      )}
    </div>
  );
}