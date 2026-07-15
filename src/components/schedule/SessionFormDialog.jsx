import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Video, MapPin, Link, Phone } from 'lucide-react';
import { format, addMinutes, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const SESSION_TYPES = [
  { value: 'check_in', label: 'Check-in Call', color: 'bg-primary' },
  { value: 'strategy', label: 'Strategy Session', color: 'bg-sidebar' },
  { value: 'assessment', label: 'Assessment', color: 'bg-warning' },
  { value: 'video_call', label: 'Video Call', color: 'bg-ai' },
  { value: 'in_person', label: 'In Person', color: 'bg-success' },
  { value: 'custom', label: 'Custom', color: 'bg-muted-foreground' },
];

const LOCATION_TYPES = [
  { value: 'zoom', label: 'Zoom', icon: Video, placeholder: 'https://zoom.us/j/...' },
  { value: 'google_meet', label: 'Google Meet', icon: Video, placeholder: 'https://meet.google.com/...' },
  { value: 'phone', label: 'Phone Call', icon: Phone, placeholder: 'Phone number or dial-in...' },
  { value: 'in_person', label: 'In Person', icon: MapPin, placeholder: 'Address or gym name...' },
  { value: 'other', label: 'Other / Link', icon: Link, placeholder: 'Meeting link or location...' },
];

const EMPTY = {
  client_id: '', client_name: '', title: '', date: '',
  time: '', end_time: '', type: 'check_in', duration_minutes: 60,
  notes: '', meeting_link: '', location_type: 'zoom', status: 'scheduled',
  send_invite: false, google_event_id: '',
  add_zoom: false,
};

export default function SessionFormDialog({
  open, onOpenChange, editing, clients,
  onSave, onDelete, googleConnected, zoomConnected, saving
}) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (editing) {
      setForm({ ...EMPTY, ...editing });
    } else {
      setForm(EMPTY);
    }
  }, [editing, open]);

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    const typLabel = SESSION_TYPES.find(t => t.value === form.type)?.label || 'Session';
    setForm(f => ({
      ...f,
      client_id: clientId,
      client_name: client?.name || '',
      title: client ? `${typLabel} — ${client.name}` : f.title,
    }));
  };

  const handleTypeChange = (type) => {
    const label = SESSION_TYPES.find(t => t.value === type)?.label || 'Session';
    setForm(f => ({
      ...f,
      type,
      title: f.client_name ? `${label} — ${f.client_name}` : f.title,
    }));
  };

  const handleTimeChange = (time) => {
    setForm(f => {
      // Auto-set end time = start + duration
      let end_time = f.end_time;
      if (time && f.date) {
        try {
          const start = parseISO(`${f.date}T${time}`);
          const end = addMinutes(start, Number(f.duration_minutes) || 60);
          end_time = format(end, 'HH:mm');
        } catch {}
      }
      return { ...f, time, end_time };
    });
  };

  const handleDurationChange = (duration_minutes) => {
    setForm(f => {
      let end_time = f.end_time;
      if (f.time && f.date) {
        try {
          const start = parseISO(`${f.date}T${f.time}`);
          const end = addMinutes(start, Number(duration_minutes) || 60);
          end_time = format(end, 'HH:mm');
        } catch {}
      }
      return { ...f, duration_minutes, end_time };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const selectedClient = clients.find(c => c.id === form.client_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            {editing ? 'Edit Session' : 'Book Session'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Client */}
          <div>
            <Label>Client</Label>
            <Select value={form.client_id} onValueChange={handleClientSelect}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Session Type */}
          <div>
            <Label>Session Type</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {SESSION_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleTypeChange(t.value)}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all',
                    form.type === t.value
                      ? 'border-foreground bg-sidebar text-white'
                      : 'border-border text-foreground hover:border-foreground/30'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', t.color)} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              placeholder="e.g. Weekly Check-in"
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={form.time}
                onChange={e => handleTimeChange(e.target.value)}
              />
            </div>
          </div>

          {/* Duration + End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Duration</Label>
              <Select value={String(form.duration_minutes)} onValueChange={handleDurationChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="time"
                value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="flex gap-1.5 flex-wrap">
              {LOCATION_TYPES.map(lt => {
                const Icon = lt.icon;
                return (
                  <button
                    key={lt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, location_type: lt.value }))}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all',
                      form.location_type === lt.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-foreground hover:border-primary/40'
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {lt.label}
                  </button>
                );
              })}
            </div>
            <Input
              value={form.meeting_link}
              onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))}
              placeholder={LOCATION_TYPES.find(lt => lt.value === form.location_type)?.placeholder || 'Location details...'}
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes / Agenda</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Prep notes, agenda items..."
            />
          </div>

          {/* Status (edit only) */}
          {editing && (
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Zoom toggle */}
          {zoomConnected && !editing && (
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-background transition-colors">
              <input
                type="checkbox"
                checked={form.add_zoom}
                onChange={e => setForm(f => ({ ...f, add_zoom: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <div>
                <p className="text-sm font-medium text-foreground">Create Zoom Meeting</p>
                <p className="text-xs text-muted-foreground">Auto-generate link & message client</p>
              </div>
              <div className="ml-auto w-6 h-6 rounded bg-[var(--kc-2d8cff)]/10 flex items-center justify-center">
                <Video className="w-3.5 h-3.5 text-[var(--kc-2d8cff)]" />
              </div>
            </label>
          )}

          {/* Google Calendar toggle */}
          {googleConnected && (
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-background transition-colors">
              <input
                type="checkbox"
                checked={form.send_invite}
                onChange={e => setForm(f => ({ ...f, send_invite: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <div>
                <p className="text-sm font-medium text-foreground">Add to Google Calendar</p>
                {selectedClient?.email && (
                  <p className="text-xs text-muted-foreground">Send invite to {selectedClient.email}</p>
                )}
              </div>
              {/* Google G */}
              <div className="ml-auto w-6 h-6 rounded bg-card border border-border flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="var(--kc-4285f4)"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="var(--kc-34a853)"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="var(--kc-fbbc05)"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="var(--kc-ea4335)"/>
                </svg>
              </div>
            </label>
          )}

          <div className="flex justify-end gap-3 pt-2">
            {editing && (
              <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(editing.id)}>
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Book Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}