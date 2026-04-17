import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import PageHeader from '../components/shared/PageHeader';
import ClientProgressCard from '../components/progress/ClientProgressCard';

const moodEmojis = { great: '😄', good: '🙂', okay: '😐', tired: '😴', stressed: '😰' };

export default function Progress() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    client_id: '', client_name: '', date: format(new Date(), 'yyyy-MM-dd'),
    weight: '', body_fat_pct: '', sleep_hours: '', mood: 'good',
    compliance_training: '', compliance_nutrition: '', notes: '',
  });
  const queryClient = useQueryClient();

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkins'],
    queryFn: () => base44.entities.CheckIn.list('-date', 200),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CheckIn.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['checkins'] }); setShowForm(false); },
  });

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setForm({ ...form, client_id: clientId, client_name: client?.name || '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      weight: Number(form.weight) || undefined,
      body_fat_pct: Number(form.body_fat_pct) || undefined,
      sleep_hours: Number(form.sleep_hours) || undefined,
      compliance_training: Number(form.compliance_training) || undefined,
      compliance_nutrition: Number(form.compliance_nutrition) || undefined,
    });
  };

  // Group check-ins by client
  const activeClients = clients.filter(c => c.status === 'active');
  const filteredClients = activeClients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const getClientCheckIns = (clientId) =>
    checkIns.filter(ci => ci.client_id === clientId);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Progress Insights"
        subtitle="AI-powered client analytics & trend tracking"
        actions={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> Log Check-in</Button>}
      />

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Client Cards */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No active clients found.</div>
        ) : filteredClients.map(client => (
          <ClientProgressCard
            key={client.id}
            client={client}
            checkIns={getClientCheckIns(client.id)}
          />
        ))}
      </div>

      {/* Log Check-in Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Log Check-in</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Client *</Label>
              <Select value={form.client_id} onValueChange={handleClientSelect}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Date *</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Weight (lbs)</Label><Input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} /></div>
              <div><Label>Body Fat %</Label><Input type="number" value={form.body_fat_pct} onChange={e => setForm({ ...form, body_fat_pct: e.target.value })} /></div>
              <div><Label>Sleep (hours)</Label><Input type="number" value={form.sleep_hours} onChange={e => setForm({ ...form, sleep_hours: e.target.value })} /></div>
              <div>
                <Label>Mood</Label>
                <Select value={form.mood} onValueChange={v => setForm({ ...form, mood: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(moodEmojis).map(([k, v]) => <SelectItem key={k} value={k}>{v} {k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Training Compliance %</Label><Input type="number" max={100} value={form.compliance_training} onChange={e => setForm({ ...form, compliance_training: e.target.value })} /></div>
              <div><Label>Nutrition Compliance %</Label><Input type="number" max={100} value={form.compliance_nutrition} onChange={e => setForm({ ...form, compliance_nutrition: e.target.value })} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Log Check-in</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}