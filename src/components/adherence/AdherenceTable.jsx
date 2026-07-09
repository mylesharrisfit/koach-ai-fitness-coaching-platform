import React, { useState, useMemo } from 'react';
import { differenceInDays, parseISO, subWeeks } from 'date-fns';
import { ArrowUp, ArrowDown, Minus, MessageSquare, User, Flag, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { averageAdherenceScore, calculateStreak } from '@/lib/adherence';
import { useNavigate } from 'react-router-dom';

const FILTER_CHIPS = ['All', 'On Track', 'Needs Attention', 'At Risk', 'Inactive'];

function scoreBadge(score) {
  if (score === null) return 'bg-muted text-muted-foreground';
  if (score >= 80) return 'bg-success/10 text-success border border-success';
  if (score >= 50) return 'bg-warning/10 text-warning border border-warning';
  return 'bg-destructive/10 text-destructive border border-destructive';
}

function rowBg(score) {
  if (score === null) return '';
  if (score >= 80) return 'bg-success/30';
  if (score >= 50) return 'bg-warning/20';
  return 'bg-destructive/20';
}

function MiniBar({ value, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[48px]">
        <div className="h-full rounded-full transition-all" style={{ width: `${value ?? 0}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums w-7 text-right text-foreground">{value ?? '—'}{value != null ? '%' : ''}</span>
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
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-border">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {FILTER_CHIPS.map(c => (
            <button key={c} onClick={() => setChip(c)}
              className={cn('flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all',
                chip === c ? 'bg-primary text-white' : 'bg-muted text-foreground hover:bg-border')}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-primary" />
          <button onClick={exportCSV}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-background whitespace-nowrap">
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Client</th>
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
                  className={cn('px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground',
                    col.key && 'cursor-pointer hover:text-foreground select-none')}>
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
              <tr><td colSpan={9} className="px-4 py-12 text-center text-xs text-muted-foreground">No clients match the current filter</td></tr>
            ) : filtered.map(({ client, overall, workout, nutrition, ciAdherence, streak, trend, daysSinceLast }) => (
              <tr key={client.id}
                onClick={() => onSelectClient(client)}
                className={cn('border-t border-muted cursor-pointer hover:bg-background transition-colors', rowBg(overall))}>
                {/* Client */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                      style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))' }}>
                      {client.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-semibold text-foreground text-xs">{client.name}</span>
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
                  <MiniBar value={workout} color="rgb(var(--primary))" />
                </td>
                {/* Nutrition */}
                <td className="px-4 py-3 min-w-[120px]">
                  <MiniBar value={nutrition} color="rgb(var(--warning))" />
                </td>
                {/* Check-in */}
                <td className="px-4 py-3 min-w-[120px]">
                  <MiniBar value={ciAdherence} color="rgb(var(--ai))" />
                </td>
                {/* Streak */}
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
                    {streak >= 7 ? '🔥' : ''}
                    {streak}w
                  </span>
                </td>
                {/* Trend */}
                <td className="px-4 py-3">
                  {trend === 'up' ? <ArrowUp className="w-4 h-4 text-success" />
                   : trend === 'down' ? <ArrowDown className="w-4 h-4 text-destructive" />
                   : <Minus className="w-4 h-4 text-muted-foreground" />}
                </td>
                {/* Last Active */}
                <td className="px-4 py-3">
                  <span className={cn('text-xs', daysSinceLast === null ? 'text-muted-foreground' : daysSinceLast > 14 ? 'text-destructive' : daysSinceLast > 7 ? 'text-warning' : 'text-success')}>
                    {daysSinceLast === null ? 'Never' : daysSinceLast === 0 ? 'Today' : `${daysSinceLast}d ago`}
                  </span>
                </td>
                {/* Actions */}
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button onClick={() => navigate(`/messages?clientId=${client.id}`)}
                      className="p-1.5 rounded-lg hover:bg-border transition-colors" title="Message">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => navigate(`/client-profile?clientId=${client.id}`)}
                      className="p-1.5 rounded-lg hover:bg-border transition-colors" title="Profile">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => onSelectClient(client)}
                      className="p-1.5 rounded-lg hover:bg-border transition-colors" title="View Detail">
                      <Flag className="w-3.5 h-3.5 text-muted-foreground" />
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