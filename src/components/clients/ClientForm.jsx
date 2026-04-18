import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TagInput from './TagInput';

const goals = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'strength', label: 'Strength' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'general_fitness', label: 'General Fitness' },
];

const lifecycleStatuses = [
  { value: 'lead',      label: 'Lead' },
  { value: 'active',    label: 'Active' },
  { value: 'at_risk',   label: 'At Risk' },
  { value: 'completed', label: 'Completed' },
  { value: 'alumni',    label: 'Alumni' },
];

const defaultForm = {
  name: '', email: '', phone: '', goal: 'general_fitness',
  lifecycle_status: 'lead', tags: [],
  current_weight: '', target_weight: '', height: '', monthly_rate: '',
  notes: '', lifecycle_notes: '', start_date: '',
};

export default function ClientForm({ open, onOpenChange, onSubmit, client }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    setForm(client ? { ...defaultForm, ...client, tags: client.tags || [] } : defaultForm);
  }, [client, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      current_weight: form.current_weight ? Number(form.current_weight) : undefined,
      target_weight: form.target_weight ? Number(form.target_weight) : undefined,
      monthly_rate: form.monthly_rate ? Number(form.monthly_rate) : undefined,
    });
    onOpenChange(false);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>

            {/* Lifecycle Status */}
            <div>
              <Label>Lifecycle Status</Label>
              <Select value={form.lifecycle_status} onValueChange={v => set('lifecycle_status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {lifecycleStatuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Goal</Label>
              <Select value={form.goal} onValueChange={v => set('goal', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {goals.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div>
              <Label>Monthly Rate ($)</Label>
              <Input type="number" value={form.monthly_rate} onChange={e => set('monthly_rate', e.target.value)} />
            </div>
            <div>
              <Label>Current Weight (lbs)</Label>
              <Input type="number" value={form.current_weight} onChange={e => set('current_weight', e.target.value)} />
            </div>
            <div>
              <Label>Target Weight (lbs)</Label>
              <Input type="number" value={form.target_weight} onChange={e => set('target_weight', e.target.value)} />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="mb-1.5 block">Tags</Label>
            <TagInput tags={form.tags} onChange={v => set('tags', v)} />
            <p className="text-[11px] text-muted-foreground mt-1">Press Enter or comma to add a tag</p>
          </div>

          <div>
            <Label>Coach Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Journey Notes</Label>
            <Textarea value={form.lifecycle_notes || ''} onChange={e => set('lifecycle_notes', e.target.value)} rows={2} placeholder="Notes about this client's progress and status changes..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{client ? 'Update' : 'Add Client'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}