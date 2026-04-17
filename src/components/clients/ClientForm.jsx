import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const goals = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'strength', label: 'Strength' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'general_fitness', label: 'General Fitness' },
];

export default function ClientForm({ open, onOpenChange, onSubmit, client }) {
  const [form, setForm] = useState(client || {
    name: '', email: '', phone: '', goal: 'general_fitness',
    current_weight: '', target_weight: '', height: '', monthly_rate: '', notes: '', status: 'active'
  });

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
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <Label>Goal</Label>
              <Select value={form.goal} onValueChange={v => setForm({...form, goal: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {goals.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monthly Rate ($)</Label>
              <Input type="number" value={form.monthly_rate} onChange={e => setForm({...form, monthly_rate: e.target.value})} />
            </div>
            <div>
              <Label>Current Weight (lbs)</Label>
              <Input type="number" value={form.current_weight} onChange={e => setForm({...form, current_weight: e.target.value})} />
            </div>
            <div>
              <Label>Target Weight (lbs)</Label>
              <Input type="number" value={form.target_weight} onChange={e => setForm({...form, target_weight: e.target.value})} />
            </div>
            <div>
              <Label>Height</Label>
              <Input value={form.height} onChange={e => setForm({...form, height: e.target.value})} placeholder="5'10&quot;" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} />
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