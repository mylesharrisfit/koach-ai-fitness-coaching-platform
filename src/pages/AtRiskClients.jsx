import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle, ChevronDown, ChevronUp, ClipboardList,
  MessageSquare, Settings, ArrowRight, ShieldCheck, Search, X
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { averageAdherenceScore, scoreColor } from '@/lib/adherence';
import { getAtRiskClients, SEVERITY_CONFIG, FLAG_ICONS } from '@/lib/riskEngine';
import PageHeader from '@/components/shared/PageHeader';

/* ── Risk score ring colour ── */
function ringColor(score) {
  if (score >= 60) return 'border-red-300 bg-red-50 text-red-500';
  if (score >= 30) return 'border-amber-300 bg-amber-50 text-amber-600';
  return 'border-[#E7EAF3] bg-[#F6F7FB] text-[#6B7280]';
}

/* ── Individual client risk card ── */
function RiskCard({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { client, flags, riskScore, lastCheckIn, lastCheckInDate, clientCheckIns } = entry;
  const avgScore = averageAdherenceScore(clientCheckIns, 3);

  const highFlags = flags.filter(f => f.severity === 'high');
  const topFlag = flags[0];
  const level = riskScore >= 60 ? 'High Risk' : riskScore >= 30 ? 'Medium Risk' : 'Low Risk';
  const levelColor = riskScore >= 60 ? 'text-red-500 bg-red-50 border-red-100'
    : riskScore >= 30 ? 'text-amber-600 bg-amber-50 border-amber-100'
    : 'text-[#6B7280] bg-[#F6F7FB] border-[#E7EAF3]';

  return (
    <div className={cn(
      'bg-white border rounded-2xl overflow-hidden transition-all shadow-sm',
      highFlags.length > 0 ? 'border-destructive/30' : riskScore >= 30 ? 'border-amber-500/20' : 'border-border'
    )}>
      {/* Summary row */}
      <button
        className="w-full p-4 text-left hover:bg-[#F6F7FB] active:bg-[#F6F7FB] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          {/* Risk score ring */}
          <div className={cn('w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center flex-shrink-0', ringColor(riskScore))}>
            <span className="text-base font-bold font-heading tabular-nums leading-none">{riskScore}</span>
            <span className="text-[8px] opacity-70 leading-none mt-0.5">risk</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-sm">{client.name}</span>
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', levelColor)}>
                {level}
              </span>
            </div>
            {/* Primary reason */}
            <p className="text-xs text-[#6B7280] truncate">
              <span className="mr-1">{FLAG_ICONS[topFlag.icon] || '⚠️'}</span>
              {topFlag.detail || topFlag.label}
            </p>
            {/* Flag count dots */}
            {flags.length > 1 && (
              <div className="flex items-center gap-1 mt-1.5">
                {flags.map(f => (
                  <div key={f.key} className={cn('w-1.5 h-1.5 rounded-full', SEVERITY_CONFIG[f.severity].dot)} />
                ))}
                <span className="text-[10px] text-[#6B7280] ml-1">{flags.length} flags</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {avgScore !== null && (
              <span className={cn('text-sm font-bold tabular-nums', scoreColor(avgScore))}>{avgScore}%</span>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#E7EAF3] p-4 space-y-4">
          {/* All flags */}
          <div>
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Detected Issues</p>
            <div className="space-y-2">
              {flags.map(f => (
                <div key={f.key} className={cn('flex items-start gap-2.5 px-3 py-2.5 rounded-xl border', SEVERITY_CONFIG[f.severity].color)}>
                  <span className="text-base flex-shrink-0 leading-none mt-0.5">{FLAG_ICONS[f.icon] || '⚠️'}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{f.label}</p>
                    {f.detail && <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">{f.detail}</p>}
                  </div>
                  <span className={cn(
                    'ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0',
                    f.severity === 'high' ? 'bg-red-50 text-red-500' :
                    f.severity === 'medium' ? 'bg-amber-50 text-amber-600' :
                    'bg-[#F6F7FB] text-[#6B7280]'
                  )}>
                    {f.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Last check-in info */}
          {lastCheckInDate && (
            <div className="flex items-center justify-between text-xs text-[#6B7280] bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl px-3 py-2">
              <span>Last check-in</span>
              <span className="font-medium text-[#1F2A44]">
                {formatDistanceToNow(parseISO(lastCheckInDate), { addSuffix: true })}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Link to="/messages" className="col-span-1">
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-10">
                <MessageSquare className="w-3.5 h-3.5" />
                Message
              </Button>
            </Link>
            {lastCheckIn && (
              <button
                className="col-span-1"
                onClick={() => navigate(`/checkin-detail?id=${lastCheckIn.id}&clientId=${client.id}`)}
              >
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-10">
                  <ClipboardList className="w-3.5 h-3.5" />
                  Check-in
                </Button>
              </button>
            )}
            <button
              className="col-span-1"
              onClick={() => navigate(`/clients`)}
            >
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-10">
                <Settings className="w-3.5 h-3.5" />
                Adjust
              </Button>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function AtRiskClients() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ['checkins-risk'],
    queryFn: () => base44.entities.CheckIn.list('-date', 400),
  });

  const atRisk = useMemo(() => getAtRiskClients(clients, checkIns), [clients, checkIns]);

  const filtered = useMemo(() => {
    let list = atRisk;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.client.name?.toLowerCase().includes(q));
    }
    if (severityFilter === 'high') list = list.filter(e => e.riskScore >= 60);
    if (severityFilter === 'medium') list = list.filter(e => e.riskScore >= 30 && e.riskScore < 60);
    if (severityFilter === 'low') list = list.filter(e => e.riskScore < 30);
    return list;
  }, [atRisk, search, severityFilter]);

  const counts = useMemo(() => ({
    high: atRisk.filter(e => e.riskScore >= 60).length,
    medium: atRisk.filter(e => e.riskScore >= 30 && e.riskScore < 60).length,
    low: atRisk.filter(e => e.riskScore < 30).length,
  }), [atRisk]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <PageHeader
        title="At-Risk Clients"
        subtitle={`${atRisk.length} client${atRisk.length !== 1 ? 's' : ''} need attention`}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { key: 'high', label: 'High Risk', color: counts.high > 0 ? 'text-destructive' : 'text-muted-foreground' },
          { key: 'medium', label: 'Medium Risk', color: counts.medium > 0 ? 'text-amber-400' : 'text-muted-foreground' },
          { key: 'low', label: 'Low Risk', color: 'text-muted-foreground' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setSeverityFilter(severityFilter === key ? 'all' : key)}
            className={cn(
              'bg-white border rounded-xl p-3 text-center transition-all active:scale-[0.97] shadow-sm',
              severityFilter === key ? 'border-primary ring-1 ring-primary/30' : 'border-[#E7EAF3]'
            )}
          >
            <p className={cn('text-2xl font-bold font-heading', color)}>{counts[key]}</p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {['all', 'high', 'medium', 'low'].map(key => (
          <button
            key={key}
            onClick={() => setSeverityFilter(key)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize',
              severityFilter === key ? 'bg-primary text-primary-foreground' : 'bg-white border border-[#E7EAF3] text-[#6B7280] hover:text-[#1F2A44]'
            )}
          >
            {key === 'all' ? 'All' : `${key} risk`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Flag legend */}
      <div className="flex flex-wrap gap-3 mb-5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-destructive" /> High risk (&ge;60 pts)</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /> Medium risk (&ge;30 pts)</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-muted-foreground" /> Low risk</div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <ShieldCheck className="w-14 h-14 text-emerald-400 opacity-60" />
          <p className="font-semibold text-sm">
            {search || severityFilter !== 'all' ? 'No clients match this filter' : 'All clients are on track! 🎉'}
          </p>
          <p className="text-xs text-muted-foreground">No risk flags detected based on recent check-ins.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <RiskCard key={entry.client.id} entry={entry} />
          ))}
        </div>
      )}

      {/* Link to check-in dashboard */}
      <div className="mt-6 pt-5 border-t border-[#E7EAF3]">
        <Link to="/checkin-review">
          <Button variant="outline" className="w-full gap-2">
            <ClipboardList className="w-4 h-4" />
            View Check-in Dashboard
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        </Link>
      </div>
    </div>
  );
}