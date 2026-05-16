import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  format, startOfWeek, addDays, addWeeks, addMonths,
  subWeeks, subMonths, subDays, isSameDay, startOfMonth
} from 'date-fns';
import { Video, MapPin, ClipboardCheck, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

import CalendarHeader from '../components/schedule/CalendarHeader';
import TimeGrid from '../components/schedule/TimeGrid';
import MonthView from '../components/schedule/MonthView';

const EMPTY_FORM = {
  client_id: '', client_name: '', title: '', date: '',
  time: '', type: 'video_call', duration_minutes: 60, notes: '', meeting_link: '', status: 'scheduled'
};

export default function Schedule() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [view, setView] = useState(isMobile ? 'day' : 'week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-date', 200),
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sessions'] }); setShowForm(false); },
  });

  // Navigation
  const handlePrev = () => {
    if (view === 'week') setCurrentDate(d => subWeeks(d, 1));
    else if (view === 'month') setCurrentDate(d => subMonths(d, 1));
    else setCurrentDate(d => subDays(d, 1));
  };
  const handleNext = () => {
    if (view === 'week') setCurrentDate(d => addWeeks(d, 1));
    else if (view === 'month') setCurrentDate(d => addMonths(d, 1));
    else setCurrentDate(d => addDays(d, 1));
  };
  const handleToday = () => setCurrentDate(new Date());

  // Header title
  const headerTitle = (() => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    if (view === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy');
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const sameMonth = format(weekStart, 'MM') === format(weekEnd, 'MM');
    const base = format(weekStart, 'MMM d');
    const end = sameMonth ? format(weekEnd, 'd') : format(weekEnd, 'MMM d');
    return `${base} – ${end}, ${format(weekEnd, 'yyyy')}`;
  })();

  // Days array for grid views
  const weekDays = (() => {
    if (view === 'day') return [currentDate];
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  })();

  const openCreate = (date) => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, date: date ? format(date, 'yyyy-MM-dd') : '' });
    setShowForm(true);
  };

  const openEdit = (session) => {
    setEditing(session);
    setForm({ ...EMPTY_FORM, ...session });
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
    setForm(f => ({ ...f, client_id: clientId, client_name: client?.name || '' }));
  };

  const handleMonthDayClick = (day) => {
    setCurrentDate(day);
    setView('day');
  };

  return (
    <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto">
      <CalendarHeader
        title={headerTitle}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        view={view}
        onViewChange={setView}
        onNewSession={() => openCreate(view === 'day' ? currentDate : null)}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {view === 'month' ? (
            <MonthView
              currentDate={currentDate}
              sessions={sessions}
              onDayClick={handleMonthDayClick}
              onEditSession={openEdit}
              clients={clients}
            />
          ) : (
            <TimeGrid
              days={weekDays}
              sessions={sessions}
              onEdit={openEdit}
              onNewSession={openCreate}
              clients={clients}
              onUpdate={({ id, data, isReschedule }) => {
                if (isReschedule) {
                  updateMutation.mutate({ id, data });
                } else {
                  updateMutation.mutate({ id, data });
                }
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Session Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? 'Edit Session' : 'New Session'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g., Weekly Check-in" />
            </div>
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
              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video_call">Video Call</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="check_in">Check-in</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} />
              </div>
            </div>
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
            <div>
              <Label>Meeting Link</Label>
              <Input value={form.meeting_link} onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))} placeholder="https://zoom.us/..." />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              {editing && (
                <Button type="button" variant="destructive" onClick={() => deleteMutation.mutate(editing.id)}>
                  Delete
                </Button>
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