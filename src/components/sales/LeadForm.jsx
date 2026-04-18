import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const defaultForm = {
  name: '', email: '', phone: '', source: 'other', stage: 'lead',
  offer_tier: '', call_date: '', call_time: '', call_link: '', deal_value: '', notes: '', lost_reason: ''
};

export default function LeadForm({ open, onOpenChange, onSubmit, lead }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    setForm(lead ? { ...defaultForm, ...lead, deal_value: lead.deal_value || '' } : defaultForm);
  }, [lead, open]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, deal_value: Number(form.deal_value) || 0 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Name *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={v => set('stage', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="active_client">Active Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source</Label>
              <Select value={form.source} onValueChange={v => set('source', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Offer Tier</Label>
              <Select value={form.offer_tier || ''} onValueChange={v => set('offer_tier', v)}>
                <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_on_one">1:1 Coaching</SelectItem>
                  <SelectItem value="group">Group Coaching</SelectItem>
                  <SelectItem value="low_ticket">Low Ticket</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Deal Value ($)</Label>
              <Input type="number" value={form.deal_value} onChange={e => set('deal_value', e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Call Date</Label><Input type="date" value={form.call_date} onChange={e => set('call_date', e.target.value)} /></div>
            <div><Label>Call Time</Label><Input type="time" value={form.call_time} onChange={e => set('call_time', e.target.value)} /></div>
          </div>
          <div><Label>Call / Booking Link</Label><Input value={form.call_link} onChange={e => set('call_link', e.target.value)} placeholder="https://calendly.com/..." /></div>

          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} /></div>

          {form.stage === 'lead' && (
            <div><Label>Lost Reason (if applicable)</Label><Input value={form.lost_reason} onChange={e => set('lost_reason', e.target.value)} placeholder="e.g. price, timing..." /></div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{lead ? 'Update' : 'Add Lead'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}