import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, MoreHorizontal, Mail, Phone, Target, Trash2, Edit, Lock, Tag, ArrowUpDown, X, AlertTriangle, ArrowRight } from 'lucide-react';
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
      <PageHeader
        title="Clients"
        subtitle={`${counts.active || 0} active · ${counts.at_risk || 0} at risk · ${counts.lead || 0} leads`}
        actions={
          <Button
            onClick={() => { if (atLimit) { setUpgradeOpen(true); return; } setEditingClient(null); setShowForm(true); }}
            variant={atLimit ? 'outline' : 'default'}
            className={atLimit ? 'border-destructive/40 text-destructive hover:bg-destructive/10' : ''}
          >
            {atLimit ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {atLimit ? `Limit Reached (${clients.length}/${clientLimit})` : 'Add Client'}
          </Button>
        }
      />

      <div className="mb-6 space-y-3">
        <UsageMeter user={currentUser} limitKey="max_clients" currentCount={clients.length} label="Clients" onUpgrade={() => setUpgradeOpen(true)} />
        <LimitBanner limitKey="max_clients" currentCount={clients.length} label="clients" featureKey="clients" />

        {/* Needs Attention Banner */}
        {atRiskClients.length > 0 && (
          <Link to="/at-risk">
            <div className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-md',
              highRiskCount > 0 ? 'bg-destructive/8 border-destructive/30' : 'bg-amber-500/8 border-amber-500/25'
            )}>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', highRiskCount > 0 ? 'bg-destructive/15' : 'bg-amber-500/15')}>
                <AlertTriangle className={cn('w-4 h-4', highRiskCount > 0 ? 'text-destructive' : 'text-amber-400')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-bold', highRiskCount > 0 ? 'text-destructive' : 'text-amber-400')}>
                  {atRiskClients.length} client{atRiskClients.length !== 1 ? 's' : ''} need{atRiskClients.length === 1 ? 's' : ''} attention
                </p>
                <p className="text-xs text-muted-foreground">
                  {highRiskCount > 0 ? `${highRiskCount} high risk · ` : ''}{atRiskClients.length - highRiskCount} medium/low risk
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          </Link>
        )}
      </div>

      {/* Lifecycle status tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[{ key: 'all', label: 'All' }, ...LIFECYCLE_ORDER.map(s => ({ key: s, label: LIFECYCLE_CONFIG[s].label }))].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all active:scale-95',
              statusFilter === key
                ? key === 'all' ? 'bg-primary/15 text-primary border-primary/30' : `${LIFECYCLE_CONFIG[key]?.color} border-opacity-50`
                : 'bg-secondary/50 text-muted-foreground border-transparent hover:border-border hover:text-foreground'
            )}
          >
            {label}
            <span className={cn('text-[10px] rounded-full px-1.5 py-0', statusFilter === key ? 'bg-black/10' : 'bg-secondary')}>
              {counts[key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {allTags.length > 0 && (
          <Select value={tagFilter || 'all'} onValueChange={v => setTagFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-44">
              <Tag className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map(t => <SelectItem key={t} value={t}>#{t}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_date">Newest First</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="lifecycle">Lifecycle Stage</SelectItem>
            <SelectItem value="monthly_rate">Highest Rate</SelectItem>
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('all'); setTagFilter(''); }} className="text-muted-foreground hover:text-foreground gap-1.5">
            <X className="w-3.5 h-3.5" /> Clear ({activeFiltersCount})
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-52 bg-card rounded-2xl border border-border animate-pulse" />)}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No clients found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => (
            <div key={client.id} className="bg-card rounded-2xl border border-border p-5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-base">
                    {client.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{client.name}</p>
                    <LifecycleBadge status={client.lifecycle_status || 'lead'} className="mt-0.5" />
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => { setEditingClient(client); setShowForm(true); }}>
                      <Edit className="w-4 h-4 mr-2" /> Edit Client
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Move to Stage</div>
                    {LIFECYCLE_ORDER.filter(s => s !== (client.lifecycle_status || 'lead')).map(s => (
                      <DropdownMenuItem key={s} onClick={() => handleStatusChange(client, s)}>
                        <span className={cn('w-2 h-2 rounded-full mr-2 flex-shrink-0 inline-block', {
                          'bg-chart-4': s === 'lead',
                          'bg-accent': s === 'active',
                          'bg-destructive': s === 'at_risk',
                          'bg-chart-3': s === 'completed',
                          'bg-primary': s === 'alumni',
                        })} />
                        {LIFECYCLE_CONFIG[s].label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(client.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{goalLabels[client.goal] || 'General Fitness'}</span>
                </div>
              </div>

              {/* Tags */}
              {client.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {client.tags.map(tag => (
                    <button key={tag} onClick={() => setTagFilter(tag === tagFilter ? '' : tag)} className="group/tag">
                      <Badge variant="secondary" className={cn('text-[10px] px-1.5 h-5 cursor-pointer hover:bg-primary/15 hover:text-primary transition-colors', tagFilter === tag && 'bg-primary/15 text-primary')}>
                        #{tag}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              {/* Adherence score */}
              {(() => {
                const clientCIs = allCheckIns
                  .filter(ci => ci.client_id === client.id)
                  .sort((a, b) => new Date(b.date) - new Date(a.date));
                const score = compositeAdherenceScore(clientCIs);
                if (score === null) return null;
                const barColor = score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-destructive';
                return (
                  <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Adherence Score</span>
                      <AdherencePill score={score} showLabel />
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-700', barColor)} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })()}

              {client.monthly_rate && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Monthly Rate</span>
                  <span className="font-heading font-bold text-primary text-sm">${client.monthly_rate}/mo</span>
                </div>
              )}

              {/* Feedback history */}
              {(() => {
                const clientCIs = allCheckIns
                  .filter(ci => ci.client_id === client.id)
                  .sort((a, b) => new Date(b.date) - new Date(a.date));
                return clientCIs.length > 0 ? <ClientFeedbackHistory checkIns={clientCIs} /> : null;
              })()}
            </div>
          ))}
        </div>
      )}

      <ClientForm open={showForm} onOpenChange={setShowForm} onSubmit={handleSubmit} client={editingClient} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} featureKey="clients" user={currentUser} />
    </div>
  );
}