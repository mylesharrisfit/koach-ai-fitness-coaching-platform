import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, TrendingUp, DollarSign, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '../components/shared/PageHeader';
import FunnelView from '../components/sales/FunnelView';
import LeadCard from '../components/sales/LeadCard';
import LeadForm from '../components/sales/LeadForm';
import PaymentTracker from '../components/sales/PaymentTracker';
import OfferTiers from '../components/sales/OfferTiers';
import UpsellPrompts from '../components/sales/UpsellPrompts';
import { toast } from 'sonner';

export default function Sales() {
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'payments'
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.WorkoutProgram.list(),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.Lead.create(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const handleSubmit = (data) => {
    if (editingLead) updateMutation.mutate({ id: editingLead.id, data });
    else createMutation.mutate(data);
    setEditingLead(null);
  };

  const handleAdvance = (lead, nextStage) => {
    updateMutation.mutate({ id: lead.id, data: { ...lead, stage: nextStage } });
    const labels = { booked: 'Booked!', closed: 'Closed!', active_client: 'Converted to Active Client!' };
    toast.success(`${lead.name} → ${labels[nextStage]}`);
  };

  const openEdit = (lead) => { setEditingLead(lead); setShowForm(true); };

  const filteredLeads = leads.filter(l => {
    const matchStage = !selectedStage || l.stage === selectedStage;
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase());
    return matchStage && matchSearch;
  });

  // Stats
  const pipelineValue = leads.filter(l => l.stage !== 'active_client').reduce((s, l) => s + (l.deal_value || 0), 0);
  const closedValue = leads.filter(l => l.stage === 'active_client').reduce((s, l) => s + (l.deal_value || 0), 0);
  const conversionRate = leads.length ? Math.round((leads.filter(l => l.stage === 'active_client').length / leads.length) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Sales & Revenue"
        subtitle="Track leads, calls, payments and upsell opportunities"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex bg-secondary rounded-lg p-1">
              {['pipeline', 'payments'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                    activeTab === tab ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <Button onClick={() => { setEditingLead(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Lead
            </Button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Leads', value: leads.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Pipeline Value', value: `$${pipelineValue.toLocaleString()}`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Closed Revenue', value: `$${closedValue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Close Rate', value: `${conversionRate}%`, icon: Target, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-heading font-bold leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'pipeline' ? (
        <>
          <FunnelView leads={leads} onStageClick={setSelectedStage} selectedStage={selectedStage} />

          {/* Upsell Prompts */}
          <div className="mb-6">
            <UpsellPrompts clients={clients} programs={programs} />
          </div>

          {/* Lead Cards */}
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
            {selectedStage && (
              <button onClick={() => setSelectedStage(null)} className="text-xs text-muted-foreground hover:text-foreground underline">
                Clear filter
              </button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{filteredLeads.length} leads shown</span>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No leads yet. Add your first lead to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredLeads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onEdit={openEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onAdvance={handleAdvance}
                />
              ))}
            </div>
          )}

          <div className="mt-8">
            <OfferTiers leads={leads} />
          </div>
        </>
      ) : (
        <PaymentTracker clients={clients} />
      )}

      <LeadForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleSubmit}
        lead={editingLead}
      />
    </div>
  );
}