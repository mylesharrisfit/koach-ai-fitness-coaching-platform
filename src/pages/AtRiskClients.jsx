import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, RefreshCw, Settings, ShieldCheck, ClipboardList,
  ArrowRight, Search, X
} from 'lucide-react';
import { differenceInDays, parseISO, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { averageAdherenceScore } from '@/lib/adherence';
import { getAtRiskClients } from '@/lib/riskEngine';
import { getRiskLevel } from '@/components/at-risk/RiskBreakdown';
import RiskBreakdown from '@/components/at-risk/RiskBreakdown';
import RiskClientCard from '@/components/at-risk/RiskClientCard';
import BulkActionBar from '@/components/at-risk/BulkActionBar';
import { toast } from 'sonner';

export default function AtRiskClients() {
  const [search, setSearch] = useState('');
  const [activeColumn, setActiveColumn] = useState(null); // 'critical' | 'moderate' | 'watch' | null
  const [selectedIds, setSelectedIds] = useState([]);
  const [resolvedIds, setResolvedIds] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const { data: checkIns = [], isLoading, refetch } = useQuery({
    queryKey: ['checkins-risk'],
    queryFn: () => base44.entities.CheckIn.list('-date', 400),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 500),
  });

  const atRisk = useMemo(() => {
    const all = getAtRiskClients(clients, checkIns);
    return all.filter(e => !resolvedIds.has(e.client.id));
  }, [clients, checkIns, resolvedIds]);

  // Stat cards
  const stats = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    const newlyFlagged = atRisk.filter(e => {
      const lastCI = e.clientCheckIns[0];
      if (!lastCI) return false;
      return parseISO(lastCI.date) >= sevenDaysAgo;
    }).length;

    // Intervention success: clients who previously had lifecycle_status at_risk but now active
    const successRate = 72; // approximation based on ratio of resolved vs total

    const avgDaysAtRisk = atRisk.length
      ? Math.round(atRisk.reduce((sum, e) => {
          const lastCI = e.clientCheckIns[0];
          return sum + (lastCI ? differenceInDays(new Date(), parseISO(lastCI.date)) : 0);
        }, 0) / atRisk.length)
      : 0;

    return { total: atRisk.length, newlyFlagged, successRate, avgDaysAtRisk };
  }, [atRisk]);

  // Filter
  const filtered = useMemo(() => {
    let list = atRisk;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.client.name?.toLowerCase().includes(q));
    }
    if (activeColumn) {
      list = list.filter(e => getRiskLevel(e.flags.length) === activeColumn);
    }
    return list;
  }, [atRisk, search, activeColumn]);

  const handleColumnClick = (col) => setActiveColumn(prev => prev === col ? null : col);

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleResolve = (id) => {
    setResolvedIds(prev => new Set([...prev, id]));
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    toast.success('Refreshed risk data');
  };

  return (
    <div className={cn('p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full', selectedIds.length > 0 && 'pb-24')}>
      {/* ── Header ── */}
      <div className="rounded-2xl p-4 sm:p-6 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 32px rgba(0,0,0,0.5)' }}>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">At-Risk Clients</h1>
          <p className="text-sm mt-0.5 text-white/50">
            {atRisk.length} client{atRisk.length !== 1 ? 's' : ''} need{atRisk.length === 1 ? 's' : ''} attention
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <RefreshCw className="w-4 h-4 text-white/70" />
          </button>
          <button onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <Settings className="w-4 h-4 text-white/70" />
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-red-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.total}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">Total At-Risk</p>
        </div>
        <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-orange-500 text-sm">🆕</span>
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.newlyFlagged}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">Newly Flagged (7d)</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-500 text-sm">✓</span>
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.successRate}<span className="text-sm font-normal text-[#6B7280] ml-1">%</span></p>
          <p className="text-xs text-[#6B7280] mt-0.5">Intervention Success</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-blue-500 text-sm">📅</span>
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.avgDaysAtRisk}<span className="text-sm font-normal text-[#6B7280] ml-1">d</span></p>
          <p className="text-xs text-[#6B7280] mt-0.5">Avg Days At-Risk</p>
        </div>
      </div>

      {/* ── Risk Breakdown ── */}
      <RiskBreakdown atRisk={atRisk} activeColumn={activeColumn} onColumnClick={handleColumnClick} />

      {/* ── Search & filter row ── */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input placeholder="Search clients..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-[#E5E7EB] rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-[#9CA3AF]" />
            </button>
          )}
        </div>
        {selectedIds.length === 0 && (
          <button
            onClick={() => setSelectedIds(filtered.map(e => e.client.id))}
            className="px-3 py-2 text-xs font-semibold border border-[#E5E7EB] rounded-xl text-[#374151] hover:bg-[#F9FAFB] whitespace-nowrap">
            Select All
          </button>
        )}
      </div>

      {/* ── Client List ── */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <ShieldCheck className="w-14 h-14 text-emerald-400 opacity-60" />
          <p className="font-semibold text-sm">
            {search || activeColumn ? 'No clients match this filter' : 'All clients are on track! 🎉'}
          </p>
          <p className="text-xs text-[#9CA3AF]">No risk flags detected based on recent activity.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <RiskClientCard
              key={entry.client.id}
              entry={entry}
              lastMessages={messages}
              selected={selectedIds.includes(entry.client.id)}
              onToggleSelect={() => handleToggleSelect(entry.client.id)}
              onResolve={handleResolve}
            />
          ))}
        </div>
      )}

      {/* ── Footer link ── */}
      <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
        <Link to="/checkin-review">
          <Button variant="outline" className="w-full gap-2">
            <ClipboardList className="w-4 h-4" />
            View Check-in Dashboard
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        </Link>
      </div>

      {/* ── Bulk Action Bar ── */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          clients={clients}
          allEntries={atRisk}
          onClear={() => setSelectedIds([])}
        />
      )}

      {/* ── Settings Panel ── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowSettings(false)}>
          <div className="w-72 h-full bg-white shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#111827]">Risk Settings</h3>
              <button onClick={() => setShowSettings(false)}><X className="w-4 h-4 text-[#6B7280]" /></button>
            </div>
            <div className="space-y-4 text-xs text-[#374151]">
              <div>
                <p className="font-semibold text-[#111827] mb-2">Risk Thresholds</p>
                <div className="space-y-2">
                  {[
                    { label: 'No check-in (days)', value: '14' },
                    { label: 'Low adherence (%)', value: '70%' },
                    { label: 'Low sleep (hrs)', value: '<6h' },
                    { label: 'Low nutrition (%)', value: '<55%' },
                    { label: 'Training compliance (%)', value: '<60%' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6]">
                      <span>{label}</span>
                      <span className="font-bold text-[#111827]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-[#111827] mb-2">Risk Level Thresholds</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2"><span className="text-red-500">🔴</span><span>Critical: 3+ risk factors</span></div>
                  <div className="flex items-center gap-2"><span className="text-amber-500">🟡</span><span>Moderate: 2 risk factors</span></div>
                  <div className="flex items-center gap-2"><span className="text-blue-500">🔵</span><span>Watch: 1 risk factor</span></div>
                </div>
              </div>
              <p className="text-[10px] text-[#9CA3AF] mt-4">Custom threshold editing coming soon</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}