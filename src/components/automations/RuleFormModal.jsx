import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CONDITION_META, ACTION_META } from '@/lib/automationEngine';
import { ArrowRight, Loader2 } from 'lucide-react';

const defaultRule = {
  name: '',
  condition_type: 'missed_checkin',
  condition_threshold: 10,
  action_type: 'send_message',
  action_message: '',
  action_calorie_delta: -100,
  description: '',
  is_active: true,
};

export default function RuleFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(defaultRule);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({ ...defaultRule, ...initial });
    } else {
      setForm(defaultRule);
    }
  }, [initial, open]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const conditionMeta = CONDITION_META[form.condition_type];
  const actionMeta = ACTION_META[form.action_type];

  const handleSave = async () => {
    if (!form.name || !form.condition_type || !form.action_type) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{initial ? 'Edit Automation Rule' : 'New Automation Rule'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Name */}
          <div>
            <Label>Rule Name</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g., Missed check-in alert" className="mt-1" />
          </div>

          {/* IF Block */}
          <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">IF Condition</p>
            <div>
              <Label>Trigger</Label>
              <Select value={form.condition_type} onValueChange={v => {
                set('condition_type', v);
                set('condition_threshold', CONDITION_META[v]?.defaultThreshold ?? 10);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONDITION_META).map(([k, m]) => (
                    <SelectItem key={k} value={k}>
                      {m.icon} {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {conditionMeta && (
                <p className="text-xs text-muted-foreground mt-1">{conditionMeta.description}</p>
              )}
            </div>
            <div>
              <Label>Threshold <span className="text-muted-foreground font-normal">({conditionMeta?.thresholdLabel})</span></Label>
              <Input
                type="number"
                value={form.condition_threshold}
                onChange={e => set('condition_threshold', Number(e.target.value))}
                className="mt-1 w-28"
                min={1}
              />
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <ArrowRight className="w-4 h-4" />
              <span>triggers</span>
            </div>
          </div>

          {/* THEN Block */}
          <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">THEN Action</p>
            <div>
              <Label>Action</Label>
              <Select value={form.action_type} onValueChange={v => set('action_type', v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTION_META).map(([k, m]) => (
                    <SelectItem key={k} value={k}>
                      {m.icon} {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {actionMeta && (
                <p className="text-xs text-muted-foreground mt-1">{actionMeta.description}</p>
              )}
            </div>

            {actionMeta?.needsMessage && (
              <div>
                <Label>Message</Label>
                <Textarea
                  value={form.action_message}
                  onChange={e => set('action_message', e.target.value)}
                  placeholder="Message to send to the client..."
                  rows={3}
                  className="mt-1 text-sm resize-none"
                />
              </div>
            )}

            {actionMeta?.needsCalorieDelta && (
              <div>
                <Label>Calorie Adjustment <span className="text-muted-foreground font-normal">(negative = reduce)</span></Label>
                <Input
                  type="number"
                  value={form.action_calorie_delta}
                  onChange={e => set('action_calorie_delta', Number(e.target.value))}
                  className="mt-1 w-32"
                  placeholder="-100"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Why this rule exists..." className="mt-1" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              {initial ? 'Save Changes' : 'Create Rule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}