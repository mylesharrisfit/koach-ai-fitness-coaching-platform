import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, TrendingUp, Scale, Moon, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import PageHeader from '../components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';

const moodEmojis = { great: '😄', good: '🙂', okay: '😐', tired: '😴', stressed: '😰' };

export default function Progress() {
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState('all');
  const [form, setForm] = useState({ client_id: '', client_name: '', date: format(new Date(), 'yyyy-MM-dd'), weight: '', body_fat_pct: '', sleep_hours: '', mood: 'good', compliance_training: '', compliance_nutrition: '', notes: '' });
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

  const filtered = selectedClient === 'all' ? checkIns : checkIns.filter(c => c.client_id === selectedClient);
  const chartData = [...filtered].reverse().map(c => ({
    date: format(new Date(c.date), 'MMM d'),
    weight: c.weight,
    bodyFat: c.body_fat_pct,
  }));

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

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Progress Tracking" subtitle="Client check-ins & measurements"
        actions={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> Log Check-in</Button>}
      />

      <div className="flex gap-4 mb-6">
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Clients" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Weight Chart */}
      {chartData.length > 1 && (
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h3 className="font-heading font-semibold mb-4">Weight Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              {chartData.some(d => d.bodyFat) && (
                <Line type="monotone" dataKey="bodyFat" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Check-in List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No check-ins yet.</div>
        ) : filtered.map(ci => (
          <div key={ci.id} className="bg-card rounded-2xl border border-border p-5 hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {ci.client_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-sm">{ci.client_name}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(ci.date), 'MMMM d, yyyy')}</p>
                </div>
              </div>
              {ci.mood && <span className="text-xl">{moodEmojis[ci.mood]}</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {ci.weight && (
                <div className="flex items-center gap-2 text-sm"><Scale className="w-4 h-4 text-primary" /><span>{ci.weight} lbs</span></div>
              )}
              {ci.body_fat_pct && (
                <div className="flex items-center gap-2 text-sm"><TrendingUp className="w-4 h-4 text-accent" /><span>{ci.body_fat_pct}% BF</span></div>
              )}
              {ci.sleep_hours && (
                <div className="flex items-center gap-2 text-sm"><Moon className="w-4 h-4 text-chart-3" /><span>{ci.sleep_hours}h sleep</span></div>
              )}
              {ci.compliance_training && (
                <div className="text-sm"><Badge variant="outline">{ci.compliance_training}% training</Badge></div>
              )}
              {ci.compliance_nutrition && (
                <div className="text-sm"><Badge variant="outline">{ci.compliance_nutrition}% nutrition</Badge></div>
              )}
            </div>
            {ci.notes && <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">{ci.notes}</p>}
          </div>
        ))}
      </div>

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
            <div><Label>Date *</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Weight (lbs)</Label><Input type="number" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} /></div>
              <div><Label>Body Fat %</Label><Input type="number" value={form.body_fat_pct} onChange={e => setForm({...form, body_fat_pct: e.target.value})} /></div>
              <div><Label>Sleep (hours)</Label><Input type="number" value={form.sleep_hours} onChange={e => setForm({...form, sleep_hours: e.target.value})} /></div>
              <div>
                <Label>Mood</Label>
                <Select value={form.mood} onValueChange={v => setForm({...form, mood: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(moodEmojis).map(([k, v]) => <SelectItem key={k} value={k}>{v} {k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Training Compliance %</Label><Input type="number" max={100} value={form.compliance_training} onChange={e => setForm({...form, compliance_training: e.target.value})} /></div>
              <div><Label>Nutrition Compliance %</Label><Input type="number" max={100} value={form.compliance_nutrition} onChange={e => setForm({...form, compliance_nutrition: e.target.value})} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} /></div>
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