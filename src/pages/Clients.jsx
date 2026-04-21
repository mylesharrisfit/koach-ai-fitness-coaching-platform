import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, MoreHorizontal, Mail, Phone, Target, Trash2, Edit, Lock, Tag, ArrowUpDown, X, AlertTriangle, ArrowRight, CheckSquare, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAtRiskClients } from '@/lib/riskEngine';
import { compositeAdherenceScore, scoreColor, scoreLabel } from '@/lib/adherence';
import { AdherencePill } from '@/components/adherence/AdherenceScore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '../components/shared/PageHeader';
import ClientForm from '../components/clients/ClientForm';
import LifecycleBadge, { LIFECYCLE_CONFIG } from '../components/clients/LifecycleBadge';
import UsageMeter from '@/components/subscription/UsageMeter';
import LimitBanner from '@/components/subscription/LimitBanner';
import UpgradeModal from '@/components/subscription/UpgradeModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getLimit } from '@/lib/subscription';
import ClientFeedbackHistory from '../components/clients/ClientFeedbackHistory';
import BulkActionBar from '../components/clients/BulkActionBar';

const goalLabels = {
  weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', strength: 'Strength',
  endurance: 'Endurance', flexibility: 'Flexibility', general_fitness: 'General Fitness'
};

const LIFECYCLE_ORDER = ['lead', 'active', 'at_risk', 'completed', 'alumni'];

export default function Clients() {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_date');
  const [currentUser, setCurrentUser] = useState(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const queryClient = useQueryClient();

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const clearSelection = () => setSelectedIds(new Set());

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
  });

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkins-clients'],
    queryFn: () => base44.entities.CheckIn.list('-date', 200),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('validateSubscription', { action: 'validate_create_client' });
      if (!res.data.allowed) { setUpgradeOpen(true); throw new Error(res.data.error); }
      return base44.entities.Client.create(data);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); toast.success('Client added'); },
    onError: (err) => { if (!err.message?.includes('limit')) toast.error(err.message); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); toast.success('Client updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); toast.success('Client deleted'); },
  });

  // Collect all unique tags across clients
  const allTags = useMemo(() => {
    const set = new Set();
    clients.forEach(c => (c.tags || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [clients]);

  // Filtered + sorted clients
  const filteredClients = useMemo(() => {
    let result = clients.filter(c => {
      const matchesSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.lifecycle_status === statusFilter;
      const matchesTag = !tagFilter || (c.tags || []).includes(tagFilter);
      return matchesSearch && matchesStatus && matchesTag;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'lifecycle') return LIFECYCLE_ORDER.indexOf(a.lifecycle_status || 'lead') - LIFECYCLE_ORDER.indexOf(b.lifecycle_status || 'lead');
      if (sortBy === 'monthly_rate') return (b.monthly_rate || 0) - (a.monthly_rate || 0);
      // default: newest first
      return new Date(b.created_date) - new Date(a.created_date);
    });

    return result;
  }, [clients, search, statusFilter, tagFilter, sortBy]);

  // Status counts for tabs
  const counts = useMemo(() => {
    const c = { all: clients.length };
    LIFECYCLE_ORDER.forEach(s => { c[s] = clients.filter(cl => (cl.lifecycle_status || 'lead') === s).length; });
    return c;
  }, [clients]);

  const handleSubmit = (data) => {
    if (editingClient) updateMutation.mutate({ id: editingClient.id, data });
    else createMutation.mutate(data);
    setEditingClient(null);
  };

  const handleStatusChange = (client, newStatus) => {
    updateMutation.mutate({ id: client.id, data: { ...client, lifecycle_status: newStatus } });
  };

  const clientLimit = getLimit(currentUser, 'max_clients');
  const atLimit = clientLimit !== -1 && clients.length >= clientLimit;

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (tagFilter ? 1 : 0);

  const atRiskClients = useMemo(() => getAtRiskClients(clients, allCheckIns), [clients, allCheckIns]);
  const highRiskCount = atRiskClients.filter(e => e.riskScore >= 60).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#1F2A44]">Clients</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {counts.active || 0} active · {counts.at_risk || 0} at risk · {counts.lead || 0} leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="secondary" size="sm" onClick={clearSelection} className="gap-1.5 text-xs">
              <X className="w-3.5 h-3.5" /> {selectedIds.size} selected
            </Button>
          )}
          <Button
            onClick={() => { if (atLimit) { setUpgradeOpen(true); return; } setEditingClient(null); setShowForm(true); }}
            variant={atLimit ? 'outline' : 'default'}
            className={atLimit ? 'border-red-200 text-red-500 hover:bg-red-50' : ''}
          >
            {atLimit ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {atLimit ? 'Limit Reached' : 'Add Client'}
          </Button>
        </div>
      </div>

      <div className="mb-5 space-y-3">
        <UsageMeter user={currentUser} limitKey="max_clients" currentCount={clients.length} label="Clients" onUpgrade={() => setUpgradeOpen(true)} />
        <LimitBanner limitKey="max_clients" currentCount={clients.length} label="clients" featureKey="clients" />

        {atRiskClients.length > 0 && (
          <Link to="/at-risk">
            <div className={cn(
              'flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all hover:shadow-sm',
              highRiskCount > 0
                ? 'bg-red-50 border-red-100'
                : 'bg-amber-50 border-amber-100'
            )}>
              <AlertTriangle className={cn('w-4 h-4 flex-shrink-0', highRiskCount > 0 ? 'text-red-500' : 'text-amber-500')} />
              <p className={cn('text-sm font-semibold flex-1', highRiskCount > 0 ? 'text-red-600' : 'text-amber-600')}>
                {atRiskClients.length} client{atRiskClients.length !== 1 ? 's' : ''} need attention
                {highRiskCount > 0 && <span className="font-normal text-red-400 ml-1">· {highRiskCount} high risk</span>}
              </p>
              <ArrowRight className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
            </div>
          </Link>
        )}
      </div>

      {/* ── Lifecycle tabs ── */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {[{ key: 'all', label: 'All' }, ...LIFECYCLE_ORDER.map(s => ({ key: s, label: LIFECYCLE_CONFIG[s].label }))].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
              statusFilter === key
                ? 'bg-[#EEF4FF] text-primary border-blue-200'
                : 'bg-white text-[#6B7280] border-[#E7EAF3] hover:text-[#1F2A44] hover:border-[#C9CEE0]'
            )}
          >
            {label}
            <span className={cn('text-[10px] rounded-full px-1.5 tabular-nums', statusFilter === key ? 'bg-blue-100 text-primary' : 'bg-[#F6F7FB] text-[#6B7280]')}>
              {counts[key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Search + filters ── */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <Input placeholder="Search clients…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-[#E7EAF3]" />
        </div>

        {allTags.length > 0 && (
          <Select value={tagFilter || 'all'} onValueChange={v => setTagFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-40 bg-white border-[#E7EAF3]">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map(t => <SelectItem key={t} value={t}>#{t}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 bg-white border-[#E7EAF3]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_date">Newest</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="lifecycle">Stage</SelectItem>
            <SelectItem value="monthly_rate">Rate</SelectItem>
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('all'); setTagFilter(''); }} className="text-[#6B7280] hover:text-[#1F2A44] gap-1">
            <X className="w-3.5 h-3.5" /> Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-52 bg-white rounded-2xl border border-[#E7EAF3] animate-pulse shadow-sm" />)}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E7EAF3] shadow-sm">
          <p className="text-[#6B7280] font-medium">No clients found.</p>
          <p className="text-sm text-[#6B7280]/70 mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map(client => {
            const isSelected = selectedIds.has(client.id);
            const clientCIs = allCheckIns
              .filter(ci => ci.client_id === client.id)
              .sort((a, b) => new Date(b.date) - new Date(a.date));
            const score = compositeAdherenceScore(clientCIs);
            const barColor = score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-red-400';

            return (
              <div
                key={client.id}
                className={cn(
                  'bg-white rounded-2xl border shadow-sm transition-all group',
                  isSelected ? 'border-blue-300 ring-2 ring-blue-100' : 'border-[#E7EAF3] hover:border-blue-200 hover:shadow-md'
                )}
              >
                <div className="p-5">
                  {/* ── Card header ── */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSelect(client.id)}
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-heading font-bold text-sm transition-all',
                          isSelected ? 'bg-primary text-white' : 'bg-[#EEF4FF] text-primary'
                        )}
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : client.name?.[0]?.toUpperCase()}
                      </button>
                      <div>
                        <p className="font-semibold text-[#1F2A44] text-sm leading-tight">{client.name}</p>
                        <LifecycleBadge status={client.lifecycle_status || 'lead'} className="mt-1" />
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-[#6B7280] hover:text-[#1F2A44] hover:bg-[#F6F7FB]">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => { setEditingClient(client); setShowForm(true); }}>
                          <Edit className="w-4 h-4 mr-2" /> Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1 text-[10px] text-[#6B7280] font-semibold uppercase tracking-wide">Move to Stage</div>
                        {LIFECYCLE_ORDER.filter(s => s !== (client.lifecycle_status || 'lead')).map(s => (
                          <DropdownMenuItem key={s} onClick={() => handleStatusChange(client, s)}>
                            <span className={cn('w-2 h-2 rounded-full mr-2 flex-shrink-0 inline-block', {
                              'bg-amber-400': s === 'lead',
                              'bg-emerald-400': s === 'active',
                              'bg-red-400': s === 'at_risk',
                              'bg-blue-400': s === 'completed',
                              'bg-purple-400': s === 'alumni',
                            })} />
                            {LIFECYCLE_CONFIG[s].label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500" onClick={() => deleteMutation.mutate(client.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* ── Contact info ── */}
                  <div className="space-y-1.5 text-xs text-[#6B7280]">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{goalLabels[client.goal] || 'General Fitness'}</span>
                    </div>
                  </div>

                  {/* ── Tags ── */}
                  {client.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {client.tags.map(tag => (
                        <button key={tag} onClick={() => setTagFilter(tag === tagFilter ? '' : tag)}>
                          <span className={cn(
                            'text-[10px] font-medium px-2 py-0.5 rounded-lg border transition-colors',
                            tagFilter === tag
                              ? 'bg-[#EEF4FF] text-primary border-blue-200'
                              : 'bg-[#F6F7FB] text-[#6B7280] border-[#E7EAF3] hover:border-blue-200 hover:text-primary'
                          )}>#{tag}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── Adherence ── */}
                  {score !== null && (
                    <div className="mt-4 pt-3.5 border-t border-[#E7EAF3]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[#6B7280]">Adherence</span>
                        <AdherencePill score={score} showLabel />
                      </div>
                      <div className="h-1.5 bg-[#F6F7FB] rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all duration-700', barColor)} style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  )}

                  {/* ── Rate ── */}
                  {client.monthly_rate && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E7EAF3]">
                      <span className="text-xs text-[#6B7280]">Monthly Rate</span>
                      <span className="text-sm font-bold text-[#1F2A44]">${client.monthly_rate}<span className="text-[#6B7280] font-normal">/mo</span></span>
                    </div>
                  )}

                  {/* ── Feedback history ── */}
                  {clientCIs.length > 0 && <ClientFeedbackHistory checkIns={clientCIs} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BulkActionBar
        selectedIds={selectedIds}
        clients={clients}
        allCheckIns={allCheckIns}
        onClear={clearSelection}
      />

      <ClientForm open={showForm} onOpenChange={setShowForm} onSubmit={handleSubmit} client={editingClient} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} featureKey="clients" user={currentUser} />
    </div>
  );
}