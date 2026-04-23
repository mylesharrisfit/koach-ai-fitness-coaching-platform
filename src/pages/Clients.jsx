import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, X, AlertTriangle, ArrowRight, Lock, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAtRiskClients } from '@/lib/riskEngine';
import { compositeAdherenceScore } from '@/lib/adherence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ClientForm from '../components/clients/ClientForm';
import ClientRow from '../components/clients/ClientRow';
import ClientProfileDrawer from '../components/clients/ClientProfileDrawer';
import LifecycleBadge, { LIFECYCLE_CONFIG } from '../components/clients/LifecycleBadge';
import LimitBanner from '@/components/subscription/LimitBanner';
import UpgradeModal from '@/components/subscription/UpgradeModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getLimit } from '@/lib/subscription';

const LIFECYCLE_ORDER = ['lead', 'active', 'at_risk', 'completed', 'alumni'];

export default function Clients() {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_date');
  const [currentUser, setCurrentUser] = useState(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const queryClient = useQueryClient();

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

  // Pre-compute per-client check-in map
  const checkInMap = useMemo(() => {
    const map = {};
    allCheckIns.forEach(ci => {
      if (!map[ci.client_id]) map[ci.client_id] = [];
      map[ci.client_id].push(ci);
    });
    // sort each by date desc
    Object.keys(map).forEach(k => map[k].sort((a, b) => new Date(b.date) - new Date(a.date)));
    return map;
  }, [allCheckIns]);

  const createMutation = useMutation({
    mutationFn: async ({ data, sendInvite }) => {
      const res = await base44.functions.invoke('validateSubscription', { action: 'validate_create_client' });
      if (!res.data.allowed) { setUpgradeOpen(true); throw new Error(res.data.error); }
      const client = await base44.entities.Client.create(data);
      if (sendInvite && data.email) {
        await base44.functions.invoke('sendClientInvite', { clientName: data.name, clientEmail: data.email });
      }
      return client;
    },
    onSuccess: (_, { sendInvite }) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(sendInvite ? 'Client added & invite sent!' : 'Client added');
    },
    onError: (err) => { if (!err.message?.includes('limit')) toast.error(err.message); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); toast.success('Client updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSelectedClient(null);
      toast.success('Client deleted');
    },
  });

  const allTags = useMemo(() => {
    const set = new Set();
    clients.forEach(c => (c.tags || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [clients]);

  const filteredClients = useMemo(() => {
    let result = clients.filter(c => {
      const q = search.toLowerCase();
      const matchesSearch = !search || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || c.lifecycle_status === statusFilter;
      const matchesTag = !tagFilter || (c.tags || []).includes(tagFilter);
      return matchesSearch && matchesStatus && matchesTag;
    });
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'lifecycle') return LIFECYCLE_ORDER.indexOf(a.lifecycle_status || 'lead') - LIFECYCLE_ORDER.indexOf(b.lifecycle_status || 'lead');
      if (sortBy === 'adherence') {
        const sa = compositeAdherenceScore(checkInMap[a.id] || []) ?? -1;
        const sb = compositeAdherenceScore(checkInMap[b.id] || []) ?? -1;
        return sb - sa;
      }
      return new Date(b.created_date) - new Date(a.created_date);
    });
    return result;
  }, [clients, search, statusFilter, tagFilter, sortBy, checkInMap]);

  const counts = useMemo(() => {
    const c = { all: clients.length };
    LIFECYCLE_ORDER.forEach(s => { c[s] = clients.filter(cl => (cl.lifecycle_status || 'lead') === s).length; });
    return c;
  }, [clients]);

  const handleSubmit = (data, sendInvite) => {
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
      // refresh selected client if it's the one being edited
      if (selectedClient?.id === editingClient.id) setSelectedClient({ ...selectedClient, ...data });
    } else {
      createMutation.mutate({ data, sendInvite });
    }
    setEditingClient(null);
  };

  const openEdit = (client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const clientLimit = getLimit(currentUser, 'max_clients');
  const atLimit = clientLimit !== -1 && clients.length >= clientLimit;

  const atRiskClients = useMemo(() => getAtRiskClients(clients, allCheckIns), [clients, allCheckIns]);
  const highRiskCount = atRiskClients.filter(e => e.riskScore >= 60).length;

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (tagFilter ? 1 : 0);

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ── */}
      <div className="px-5 py-4 bg-white border-b border-[#F0F2F8] flex items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-heading font-bold text-[#1F2A44] leading-tight">Clients</h1>
          <p className="text-xs text-[#6B7280]">{counts.active || 0} active · {counts.at_risk || 0} at-risk · {counts.lead || 0} leads</p>
        </div>
        <Button
          size="sm"
          onClick={() => { if (atLimit) { setUpgradeOpen(true); return; } setEditingClient(null); setShowForm(true); }}
          variant={atLimit ? 'outline' : 'default'}
          className={atLimit ? 'border-red-200 text-red-500 hover:bg-red-50' : ''}
        >
          {atLimit ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {atLimit ? 'Limit Reached' : 'Add Client'}
        </Button>
      </div>

      {/* ── Alerts ── */}
      <div className="px-5 pt-3 flex-shrink-0 space-y-2">
        <LimitBanner limitKey="max_clients" currentCount={clients.length} label="clients" featureKey="clients" />
        {atRiskClients.length > 0 && (
          <Link to="/at-risk">
            <div className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all hover:shadow-sm',
              highRiskCount > 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-amber-50 border-amber-100 text-amber-600'
            )}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{atRiskClients.length} clients need attention{highRiskCount > 0 && <span className="font-normal opacity-70 ml-1">· {highRiskCount} high risk</span>}</span>
              <ArrowRight className="w-4 h-4 opacity-60" />
            </div>
          </Link>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="px-5 pt-3 pb-3 flex-shrink-0 space-y-2">
        {/* Lifecycle tabs */}
        <div className="flex flex-wrap gap-1">
          {[{ key: 'all', label: 'All' }, ...LIFECYCLE_ORDER.map(s => ({ key: s, label: LIFECYCLE_CONFIG[s].label }))].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                statusFilter === key
                  ? 'bg-[#EEF4FF] text-primary border-blue-200'
                  : 'bg-white text-[#6B7280] border-[#E7EAF3] hover:text-[#1F2A44]'
              )}
            >
              {label}
              <span className={cn('text-[10px] rounded-md px-1 tabular-nums', statusFilter === key ? 'bg-blue-100 text-primary' : 'bg-[#F6F7FB] text-[#9CA3AF]')}>
                {counts[key] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search + tag + sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm bg-[#F6F7FB] border-[#E7EAF3]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-[#9CA3AF]" />
              </button>
            )}
          </div>

          {allTags.length > 0 && (
            <Select value={tagFilter || 'all'} onValueChange={v => setTagFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-32 h-8 text-xs bg-[#F6F7FB] border-[#E7EAF3]">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map(t => <SelectItem key={t} value={t}>#{t}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32 h-8 text-xs bg-[#F6F7FB] border-[#E7EAF3]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_date">Newest</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="lifecycle">Stage</SelectItem>
              <SelectItem value="adherence">Adherence</SelectItem>
            </SelectContent>
          </Select>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-[#374151]"
              onClick={() => { setStatusFilter('all'); setTagFilter(''); }}>
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* ── Column headers ── */}
      <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-[#F6F7FB] border-b border-[#F0F2F8] text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] flex-shrink-0">
        <div className="w-9 flex-shrink-0" />
        <div className="flex-1">Client</div>
        <div className="hidden sm:block w-24">Status</div>
        <div className="hidden md:block w-20 text-right">Adherence</div>
        <div className="hidden lg:block w-24 text-right">Last Check-in</div>
        <div className="w-20" />
      </div>

      {/* ── Client list ── */}
      <div className="flex-1 overflow-y-auto bg-white">
        {isLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-14 bg-[#F6F7FB] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-[#F6F7FB] flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-[#9CA3AF]" />
            </div>
            <p className="text-sm font-semibold text-[#374151]">No clients found</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredClients.map(client => {
            const cis = checkInMap[client.id] || [];
            const score = compositeAdherenceScore(cis);
            return (
              <ClientRow
                key={client.id}
                client={client}
                score={score}
                lastCheckIn={cis[0]}
                onView={() => setSelectedClient(client)}
                onEdit={() => openEdit(client)}
                onDelete={() => deleteMutation.mutate(client.id)}
                onStatusChange={(s) => updateMutation.mutate({ id: client.id, data: { ...client, lifecycle_status: s } })}
              />
            );
          })
        )}
      </div>

      {/* ── Profile Drawer ── */}
      {selectedClient && (
        <ClientProfileDrawer
          client={selectedClient}
          checkIns={checkInMap[selectedClient.id] || []}
          onClose={() => setSelectedClient(null)}
          onEdit={() => openEdit(selectedClient)}
        />
      )}

      <ClientForm open={showForm} onOpenChange={setShowForm} onSubmit={handleSubmit} client={editingClient} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} featureKey="clients" user={currentUser} />
    </div>
  );
}