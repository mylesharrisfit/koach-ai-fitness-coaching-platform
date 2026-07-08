import React, { useState, useMemo } from 'react';
import { differenceInDays, parseISO, subWeeks } from 'date-fns';
import { ArrowUp, ArrowDown, Minus, MessageSquare, User, Flag, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { averageAdherenceScore, calculateStreak } from '@/lib/adherence';
import { useNavigate } from 'react-router-dom';

const FILTER_CHIPS = ['All', 'On Track', 'Needs Attention', 'At Risk', 'Inactive'];

function scoreBadge(score) {
  if (score === null) return 'bg-[#F3F4F6] text-[#9CA3AF]';
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
  if (score >= 50) return 'bg-amber-50 text-amber-700 border border-amber-100';
  return 'bg-red-50 text-red-600 border border-red-100';
}

function rowBg(score) {
  if (score === null) return '';
  if (score >= 80) return 'bg-emerald-50/30';
  if (score >= 50) return 'bg-amber-50/20';
  return 'bg-red-50/20';
}

function MiniBar({ value, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden min-w-[48px]">
        <div className="h-full rounded-full transition-all" style={{ width: `${value ?? 0}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums w-7 text-right text-[#374151]">{value ?? '—'}{value != null ? '%' : ''}</span>
    </div>
  );
}

function calcClientStats(client, checkIns, rangeWeeks) {
  const sorted = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
  const cutoff = subWeeks(new Date(), rangeWeeks);
  const inRange = sorted.filter(ci => parseISO(ci.date) >= cutoff);
  const prevCutoff = subWeeks(new Date(), rangeWeeks * 2);
  const prevRange = sorted.filter(ci => parseISO(ci.date) >= prevCutoff && parseISO(ci.date) < cutoff);

  const avg = (arr, key) => {
    const vals = arr.map(ci => ci[key]).filter(v => v != null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };

  const workout = avg(inRange, 'compliance_training');
  const nutrition = avg(inRange, 'compliance_nutrition');
  const overall = inRange.length ? averageAdherenceScore(inRange) : null;
  const prevOverall = prevRange.length ? averageAdherenceScore(prevRange) : null;
  const trend = overall !== null && prevOverall !== null
    ? overall - prevOverall > 5 ? 'up' : overall - prevOverall < -5 ? 'down' : 'stable'
    : 'stable';

  const streak = calculateStreak(sorted);
  const lastCheckIn = sorted[0]?.date;
  const daysSinceLast = lastCheckIn ? differenceInDays(new Date(), parseISO(lastCheckIn)) : null;

  // Check-in adherence: how many weeks had a check-in
  const ciAdherence = rangeWeeks > 0 ? Math.min(100, Math.round((inRange.length / rangeWeeks) * 100)) : 0;

  return { workout, nutrition, overall, trend, streak, daysSinceLast, ciAdherence, inRange, prevOverall };
}

export default function AdherenceTable({ clients, checkIns, rangeWeeks, onSelectClient }) {
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState('All');
  const [sortKey, setSortKey] = useState('overall');
  const [sortDir, setSortDir] = useState('desc');
  const navigate = useNavigate();

  const cisByClient = useMemo(() => {
    const map = {};
    for (const ci of checkIns) (map[ci.client_id] = map[ci.client_id] || []).push(ci);
    return map;
  }, [checkIns]);

  const rows = useMemo(() => clients.map(client => {
    const cis = cisByClient[client.id] || [];
    return { client, ...calcClientStats(client, cis, rangeWeeks) };
  }), [clients, cisByClient, rangeWeeks]);

  const filtered = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.client.name?.toLowerCase().includes(q));
    }
    if (chip === 'On Track') list = list.filter(r => r.overall !== null && r.overall >= 80);
    if (chip === 'Needs Attention') list = list.filter(r => r.overall !== null && r.overall >= 50 && r.overall < 80);
    if (chip === 'At Risk') list = list.filter(r => r.overall !== null && r.overall < 50);
    if (chip === 'Inactive') list = list.filter(r => r.daysSinceLast === null || r.daysSinceLast > 14);

    return [...list].sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [rows, search, chip, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
    : <ChevronDown className="w-3 h-3 opacity-30" />;

  const exportCSV = () => {
    const headers = ['Client', 'Overall', 'Workout', 'Nutrition', 'Check-in', 'Streak', 'Trend', 'Last Active'];
    const rows2 = filtered.map(r => [
      r.client.name, r.overall ?? '', r.workout ?? '', r.nutrition ?? '', r.ciAdherence ?? '',
      r.streak, r.trend, r.daysSinceLast !== null ? `${r.daysSinceLast}d ago` : 'Never',
    ]);
    const csv = [headers, ...rows2].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'adherence.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-[#E5E7EB]">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {FILTER_CHIPS.map(c => (
            <button key={c} onClick={() => setChip(c)}
              className={cn('flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all',
                chip === c ? 'bg-primary text-white' : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]')}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
            className="border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-primary" />
          <button onClick={exportCSV}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] whitespace-nowrap">
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Client</th>
              {[
                { label: 'Overall', key: 'overall' },
                { label: 'Workout %', key: 'workout' },
                { label: 'Nutrition %', key: 'nutrition' },
                { label: 'Check-in %', key: 'ciAdherence' },
                { label: 'Streak', key: 'streak' },
                { label: 'Trend', key: null },
                { label: 'Last Active', key: 'daysSinceLast' },
                { label: 'Actions', key: null },
              ].map(col => (
                <th key={col.label}
                  onClick={col.key ? () => toggleSort(col.key) : undefined}
                  className={cn('px-4 py-2.5 text-left text-xs font-semibold text-[#6B7280]',
                    col.key && 'cursor-pointer hover:text-[#374151] select-none')}>
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.key && <SortIcon k={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-xs text-[#9CA3AF]">No clients match the current filter</td></tr>
            ) : filtered.map(({ client, overall, workout, nutrition, ciAdherence, streak, trend, daysSinceLast }) => (
              <tr key={client.id}
                onClick={() => onSelectClient(client)}
                className={cn('border-t border-[#F3F4F6] cursor-pointer hover:bg-[#F9FAFB] transition-colors', rowBg(overall))}>
                {/* Client */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                      style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                      {client.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-semibold text-[#111827] text-xs">{client.name}</span>
                  </div>
                </td>
                {/* Overall */}
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', scoreBadge(overall))}>
                    {overall !== null ? `${overall}%` : '—'}
                  </span>
                </td>
                {/* Workout */}
                <td className="px-4 py-3 min-w-[120px]">
                  <MiniBar value={workout} color="#2563EB" />
                </td>
                {/* Nutrition */}
                <td className="px-4 py-3 min-w-[120px]">
                  <MiniBar value={nutrition} color="#F59E0B" />
                </td>
                {/* Check-in */}
                <td className="px-4 py-3 min-w-[120px]">
                  <MiniBar value={ciAdherence} color="#7C3AED" />
                </td>
                {/* Streak */}
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#374151]">
                    {streak >= 7 ? '🔥' : ''}
                    {streak}w
                  </span>
                </td>
                {/* Trend */}
                <td className="px-4 py-3">
                  {trend === 'up' ? <ArrowUp className="w-4 h-4 text-emerald-500" />
                   : trend === 'down' ? <ArrowDown className="w-4 h-4 text-red-400" />
                   : <Minus className="w-4 h-4 text-[#9CA3AF]" />}
                </td>
                {/* Last Active */}
                <td className="px-4 py-3">
                  <span className={cn('text-xs', daysSinceLast === null ? 'text-[#9CA3AF]' : daysSinceLast > 14 ? 'text-red-500' : daysSinceLast > 7 ? 'text-amber-600' : 'text-emerald-600')}>
                    {daysSinceLast === null ? 'Never' : daysSinceLast === 0 ? 'Today' : `${daysSinceLast}d ago`}
                  </span>
                </td>
                {/* Actions */}
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button onClick={() => navigate(`/messages?clientId=${client.id}`)}
                      className="p-1.5 rounded-lg hover:bg-[#E5E7EB] transition-colors" title="Message">
                      <MessageSquare className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                    <button onClick={() => navigate(`/client-profile?clientId=${client.id}`)}
                      className="p-1.5 rounded-lg hover:bg-[#E5E7EB] transition-colors" title="Profile">
                      <User className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                    <button onClick={() => onSelectClient(client)}
                      className="p-1.5 rounded-lg hover:bg-[#E5E7EB] transition-colors" title="View Detail">
                      <Flag className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}