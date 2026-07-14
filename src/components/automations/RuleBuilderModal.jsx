import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { BADGE_CONFIG } from '@/lib/badges';

const TRIGGER_TYPES = [
  { value: 'no_checkin', label: 'No check-in for X days', unit: 'days', default: 7 },
  { value: 'low_compliance', label: 'Compliance drops below X%', unit: '%', default: 60 },
  { value: 'high_compliance', label: 'Compliance above X%', unit: '%', default: 90 },
  { value: 'streak', label: 'Streak reaches X days', unit: 'days', default: 7 },
  { value: 'weight_plateau', label: 'Weight unchanged for X check-ins', unit: 'check-ins', default: 3 },
  { value: 'weight_loss_fast', label: 'Weight loss exceeds X lbs/week', unit: 'lbs', default: 2 },
  { value: 'status_change', label: 'Client status changes to...', unit: null, default: null },
  { value: 'program_ends', label: 'Program duration ends', unit: null, default: null },
  { value: 'new_client', label: 'New client added', unit: null, default: null },
];

const ACTION_TYPES = [
  { value: 'send_message', label: '💬 Send message to client', needsMessage: true },
  { value: 'notify_coach', label: '🔔 Send notification to coach', needsMessage: true },
  { value: 'award_badge', label: '🏆 Award badge', needsBadge: true },
  { value: 'update_status', label: '👤 Update client status', needsStatus: true },
  { value: 'adjust_calories', label: '🔥 Adjust nutrition plan calories', needsCalories: true },
  { value: 'flag_at_risk', label: '⚠️ Flag as at-risk', needsMessage: false },
];

const CLIENT_STATUSES = ['lead', 'active', 'at_risk', 'completed', 'alumni'];

const DEFAULT_ACTION = { type: 'send_message', value: '', message: '' };
const DEFAULT_FORM = {
  name: '',
  trigger_type: 'no_checkin',
  trigger_value: 7,
  actions: [{ ...DEFAULT_ACTION }],
  is_active: true,
  run_once: false,
  apply_to: 'all',
};

export default function RuleBuilderModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (open) {
      if (initial) {
        // Map legacy format
        const actions = initial.actions?.length
          ? initial.actions
          : initial.action_type
            ? [{ type: initial.action_type === 'flag_client' ? 'flag_at_risk' : initial.action_type, value: initial.action_calorie_delta?.toString() || '', message: initial.action_message || '' }]
            : [{ ...DEFAULT_ACTION }];
        setForm({
          ...DEFAULT_FORM,
          ...initial,
          trigger_type: initial.trigger_type || (initial.condition_type === 'missed_checkin' ? 'no_checkin' : initial.condition_type === 'low_adherence' ? 'low_compliance' : initial.condition_type || 'no_checkin'),
          trigger_value: initial.trigger_value ?? initial.condition_threshold ?? 7,
          actions,
        });
      } else {
        setForm(DEFAULT_FORM);
      }
      setStep(1);
    }
  }, [open, initial]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const updateAction = (i, key, val) => {
    setForm(f => {
      const actions = [...f.actions];
      actions[i] = { ...actions[i], [key]: val };
      return { ...f, actions };
    });
  };
  const addAction = () => setForm(f => ({ ...f, actions: [...f.actions, { ...DEFAULT_ACTION }] }));
  const removeAction = (i) => setForm(f => ({ ...f, actions: f.actions.filter((_, idx) => idx !== i) }));

  const triggerMeta = TRIGGER_TYPES.find(t => t.value === form.trigger_type);

  const handleSave = async () => {
    if (!form.name || !form.trigger_type || form.actions.length === 0) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  const badgeOptions = Object.entries(BADGE_CONFIG).slice(0, 30);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Edit Rule' : 'New Automation Rule'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Step indicator */}
          <div className="flex gap-1">
            {['Trigger', 'Actions', 'Settings'].map((s, i) => (
              <button key={s} onClick={() => setStep(i + 1)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${step === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-border'}`}>
                {i + 1}. {s}
              </button>
            ))}
          </div>

          {/* STEP 1 — Trigger */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-warning/10 border border-warning rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-warning uppercase tracking-wider">IF Trigger</p>
                <div>
                  <Label>When this happens...</Label>
                  <Select value={form.trigger_type} onValueChange={v => {
                    const meta = TRIGGER_TYPES.find(t => t.value === v);
                    set('trigger_type', v);
                    if (meta?.default) set('trigger_value', meta.default);
                  }}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {triggerMeta?.unit && (
                  <div>
                    <Label>Threshold ({triggerMeta.unit})</Label>
                    <Input type="number" value={form.trigger_value || ''} onChange={e => set('trigger_value', Number(e.target.value))} className="mt-1 w-28" min={1} />
                  </div>
                )}
                {form.trigger_type === 'status_change' && (
                  <div>
                    <Label>Changes to status</Label>
                    <Select value={form.trigger_value?.toString() || 'active'} onValueChange={v => set('trigger_value', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CLIENT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={() => setStep(2)}>Next: Set Actions →</Button>
            </div>
          )}

          {/* STEP 2 — Actions */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-3">
                {form.actions.map((action, i) => {
                  const meta = ACTION_TYPES.find(a => a.value === action.type);
                  return (
                    <div key={i} className="bg-accent border border-primary rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">THEN Action {form.actions.length > 1 ? i + 1 : ''}</p>
                        {form.actions.length > 1 && (
                          <button onClick={() => removeAction(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div>
                        <Label>Action type</Label>
                        <Select value={action.type} onValueChange={v => updateAction(i, 'type', v)}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      {meta?.needsMessage && (
                        <div>
                          <Label>Message <span className="text-muted-foreground font-normal text-xs">({'{client_name}'}, {'{streak}'}, {'{compliance}'}% supported)</span></Label>
                          <Textarea value={action.message} onChange={e => updateAction(i, 'message', e.target.value)}
                            placeholder="Message content..." rows={3} className="mt-1 text-sm resize-none" />
                        </div>
                      )}
                      {meta?.needsBadge && (
                        <div>
                          <Label>Badge to award</Label>
                          <Select value={action.value} onValueChange={v => updateAction(i, 'value', v)}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Select badge..." /></SelectTrigger>
                            <SelectContent>
                              {badgeOptions.map(([k, v]) => <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {meta?.needsStatus && (
                        <div>
                          <Label>New status</Label>
                          <Select value={action.value} onValueChange={v => updateAction(i, 'value', v)}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Select status..." /></SelectTrigger>
                            <SelectContent>
                              {CLIENT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {meta?.needsCalories && (
                        <div>
                          <Label>Calorie adjustment (e.g. -100 or +150)</Label>
                          <Input type="number" value={action.value} onChange={e => updateAction(i, 'value', e.target.value)}
                            className="mt-1 w-32" placeholder="-100" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button onClick={addAction} className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add another action
              </button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>← Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Next: Settings →</Button>
              </div>
            </div>
          )}

          {/* STEP 3 — Settings */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Rule Name</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Missed Check-In Alert" className="mt-1" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Rule will run automatically</p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="text-sm font-medium">Run once per client</p>
                  <p className="text-xs text-muted-foreground">Don't repeat if already triggered</p>
                </div>
                <Switch checked={form.run_once} onCheckedChange={v => set('run_once', v)} />
              </div>
              <div>
                <Label>Apply to</Label>
                <Select value={form.apply_to} onValueChange={v => set('apply_to', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All active clients</SelectItem>
                    <SelectItem value="active">Active clients only</SelectItem>
                    <SelectItem value="at_risk">At-risk clients only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Summary */}
              <div className="bg-secondary rounded-xl p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Summary</p>
                <p>IF: <span className="text-foreground">{TRIGGER_TYPES.find(t => t.value === form.trigger_type)?.label} {form.trigger_value ? `(${form.trigger_value})` : ''}</span></p>
                <p>THEN: <span className="text-foreground">{form.actions.map(a => ACTION_TYPES.find(x => x.value === a.type)?.label?.replace(/^.+? /, '')).join(' + ')}</span></p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>← Back</Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving || !form.name}>
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  {initial?.id ? 'Save Changes' : 'Create Rule'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}