import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight, Video, MapPin, ClipboardCheck, Phone, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageHeader from '../components/shared/PageHeader';
import { cn } from '@/lib/utils';

const typeIcons = { video_call: Video, in_person: MapPin, check_in: ClipboardCheck, consultation: Phone };
const statusColors = {
  scheduled: 'bg-[#EEF4FF] text-primary',
  completed: 'bg-emerald-50 text-emerald-600',
  cancelled: 'bg-[#F6F7FB] text-[#6B7280]',
  no_show: 'bg-red-50 text-red-500',
};

export default function Schedule() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ client_id: '', client_name: '', title: '', date: '', time: '', type: 'video_call', duration_minutes: 60, notes: '', meeting_link: '' });
  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-date', 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Session.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sessions'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Session.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sessions'] }); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Session.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const openCreate = (date) => {
    setEditing(null);
    setForm({ client_id: '', client_name: '', title: '', date: date ? format(date, 'yyyy-MM-dd') : '', time: '', type: 'video_call', duration_minutes: 60, notes: '', meeting_link: '' });
    setShowForm(true);
  };

  const openEdit = (session) => {
    setEditing(session);
    setForm({ ...session });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, duration_minutes: Number(form.duration_minutes) };
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setForm({ ...form, client_id: clientId, client_name: client?.name || '' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Schedule" subtitle="Manage your sessions"
        actions={<Button onClick={() => openCreate(null)}><Plus className="w-4 h-4 mr-2" /> Book Session</Button>}
      />

      {/* Week Nav */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-heading font-semibold">
          {format(currentWeekStart, 'MMM d')} – {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
        </span>
        <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
          Today
        </Button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {weekDays.map(day => {
          const isToday = isSameDay(day, new Date());
          const daySessions = sessions.filter(s => s.date === format(day, 'yyyy-MM-dd'));
          return (
            <div key={day.toISOString()} className={cn(
              "bg-white rounded-2xl border p-4 min-h-[200px] transition-all shadow-sm",
              isToday ? "border-primary/40" : "border-[#E7EAF3]"
            )}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-[#6B7280]">{format(day, 'EEE')}</p>
                  <p className={cn("text-lg font-heading font-bold text-[#1F2A44]", isToday && "text-primary")}>{format(day, 'd')}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openCreate(day)}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-2">
                {daySessions.map(session => {
                  const Icon = typeIcons[session.type] || Video;
                  return (
                    <div key={session.id} className="p-2 rounded-lg bg-[#F6F7FB] hover:bg-[#EEF4FF] border border-[#E7EAF3] transition-all cursor-pointer group/session" onClick={() => openEdit(session)}>
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-primary flex-shrink-0" />
                        <p className="text-xs font-medium text-[#1F2A44] truncate">{session.title}</p>
                      </div>
                      {session.time && <p className="text-[10px] text-[#6B7280] mt-0.5 ml-4.5">{session.time}</p>}
                      <p className="text-[10px] text-[#6B7280] truncate ml-4.5">{session.client_name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? 'Edit Session' : 'Book Session'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="e.g., Weekly Check-in" /></div>
            <div>
              <Label>Client</Label>
              <Select value={form.client_id} onValueChange={handleClientSelect}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date *</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required /></div>
              <div><Label>Time</Label><Input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video_call">Video Call</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="check_in">Check-in</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: e.target.value})} /></div>
            </div>
            <div><Label>Meeting Link</Label><Input value={form.meeting_link} onChange={e => setForm({...form, meeting_link: e.target.value})} placeholder="https://zoom.us/..." /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
            <div className="flex justify-end gap-3 pt-2">
              {editing && (
                <Button type="button" variant="destructive" onClick={() => { deleteMutation.mutate(editing.id); setShowForm(false); }}>Delete</Button>
              )}
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Update' : 'Book Session'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}