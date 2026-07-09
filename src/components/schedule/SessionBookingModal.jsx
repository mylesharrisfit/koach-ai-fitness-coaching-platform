import React, { useState, useMemo } from 'react';
import { format, parse } from 'date-fns';
import { X, Check, AlertCircle, Phone, Zap, Target, TrendingUp, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const SESSION_TYPES = [
  { id: 'checkin', label: 'Check-in Call', icon: Phone, color: 'rgb(var(--primary))', bgColor: 'bg-accent' },
  { id: 'program', label: 'Program Review', icon: Zap, color: 'rgb(var(--ai))', bgColor: 'bg-ai/10' },
  { id: 'onboarding', label: 'Onboarding Call', icon: Target, color: 'rgb(var(--success))', bgColor: 'bg-success/10' },
  { id: 'progress', label: 'Progress Review', icon: TrendingUp, color: 'rgb(var(--warning))', bgColor: 'bg-warning/10' },
  { id: 'consultation', label: 'Free Consultation', icon: HelpCircle, color: 'rgb(var(--muted-foreground))', bgColor: 'bg-muted' },
];

const TIME_SLOTS = Array.from({ length: (22 - 6) * 4 }, (_, i) => {
  const totalMins = 6 * 60 + i * 15;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const display = h === 12 ? '12' : h === 0 ? '12' : h > 12 ? h - 12 : h;
  return `${String(display).padStart(2, ' ')}:${String(m).padStart(2, '0')} ${ampm}`;
});

const DURATIONS = [
  { mins: 15, label: '15 min' },
  { mins: 30, label: '30 min' },
  { mins: 45, label: '45 min' },
  { mins: 60, label: '60 min' },
  { mins: 90, label: '90 min' },
];

function calculateEndTime(startTime, durationMins) {
  if (!startTime) return '';
  try {
    const [time, ampm] = startTime.trim().split(' ');
    const [h, m] = time.split(':').map(Number);
    const hour24 = ampm === 'PM' && h !== 12 ? h + 12 : ampm === 'AM' && h === 12 ? 0 : h;
    const startMins = hour24 * 60 + m;
    const endMins = startMins + durationMins;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;
    const endAmpm = endH < 12 ? 'AM' : 'PM';
    const display = endH === 12 ? '12' : endH === 0 ? '12' : endH > 12 ? endH - 12 : endH;
    return `${String(display).padStart(2, ' ')}:${String(endM).padStart(2, '0')} ${endAmpm}`;
  } catch {
    return '';
  }
}

export default function SessionBookingModal({ open, onClose, clients = [], selectedDate, onSave, existingSessions = [] }) {
  const [step, setStep] = useState(1);
  const [isGroup, setIsGroup] = useState(false);
  const [selectedClients, setSelectedClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [type, setType] = useState('checkin');
  const [date, setDate] = useState(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00 AM');
  const [duration, setDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [reminder, setReminder] = useState('1hour');
  const [repeat, setRepeat] = useState('none');
  const [errors, setErrors] = useState({});
  const [searchOpen, setSearchOpen] = useState(false);

  const selectedType = SESSION_TYPES.find(t => t.id === type);
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(q));
  }, [clients, searchQuery]);

  const endTime = calculateEndTime(startTime, duration);

  const checkOverlap = () => {
    if (!startTime || !date) return false;
    const clientIds = isGroup ? selectedClients : [selectedClients[0]];
    const [time, ampm] = startTime.trim().split(' ');
    const [h, m] = time.split(':').map(Number);
    const hour24 = ampm === 'PM' && h !== 12 ? h + 12 : ampm === 'AM' && h === 12 ? 0 : h;
    const startMins = hour24 * 60 + m;
    const endMins = startMins + duration;

    return existingSessions.some(s => {
      if (s.date !== date) return false;
      if (!clientIds.includes(s.client_id)) return false;
      const [stime, sampm] = (s.time || '09:00 AM').split(' ');
      const [sh, sm] = stime.split(':').map(Number);
      const shour24 = sampm === 'PM' && sh !== 12 ? sh + 12 : sampm === 'AM' && sh === 12 ? 0 : sh;
      const sstartMins = shour24 * 60 + sm;
      const sendMins = sstartMins + (s.duration_minutes || 60);
      return !(endMins <= sstartMins || startMins >= sendMins);
    });
  };

  const validate = () => {
    const newErrors = {};
    if ((!isGroup && selectedClients.length === 0) || (isGroup && selectedClients.length === 0)) {
      newErrors.clients = 'Select at least one client';
    }
    if (!date) newErrors.date = 'Select a date';
    if (!startTime) newErrors.startTime = 'Select a start time';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleToggleClient = (clientId) => {
    if (isGroup) {
      setSelectedClients(prev => 
        prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
      );
    } else {
      setSelectedClients([clientId]);
      setSearchOpen(false);
    }
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (checkOverlap()) {
      if (!window.confirm('You already have a session at this time — are you sure?')) return;
    }

    const clients_to_book = isGroup ? selectedClients : [selectedClients[0]];
    const clientNames = clients_to_book.map(id => clients.find(c => c.id === id)?.name).join(', ');

    clients_to_book.forEach(clientId => {
      onSave({
        client_id: clientId,
        client_name: clients.find(c => c.id === clientId)?.name,
        title: selectedType.label,
        date,
        time: startTime,
        type,
        duration_minutes: duration,
        notes,
        status: 'scheduled',
      });
    });

    toast.success(`Session scheduled with ${clientNames} on ${format(parse(date, 'yyyy-MM-dd', new Date()), 'MMM d')} at ${startTime} ✓`);
    if (sendConfirmation) {
      toast.success(`Confirmation sent to ${clientNames} 📩`);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={e => e.stopPropagation()}
          className="bg-card rounded-2xl shadow-2xl max-w-[500px] w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-ai px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-heading">Schedule a Session</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Group toggle */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGroup}
                  onChange={e => { setIsGroup(e.target.checked); setSelectedClients([]); }}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm font-medium text-foreground">Group Session</span>
              </label>
            </div>

            {/* Client Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {isGroup ? 'Select Clients' : 'Client'} *
              </label>
              <div className="relative">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors text-sm text-foreground"
                >
                  {selectedClients.length === 0 ? 'Select client' : selectedClients.length === 1 ? clients.find(c => c.id === selectedClients[0])?.name : `${selectedClients.length} clients`}
                </button>
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto"
                    >
                      <div className="p-2 sticky top-0 bg-card border-b border-border">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search clients..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-border rounded outline-none focus:border-primary/50"
                        />
                      </div>
                      <div className="p-1">
                        {filteredClients.map(c => (
                          <button
                            key={c.id}
                            onClick={() => handleToggleClient(c.id)}
                            className={cn(
                              'w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors',
                              selectedClients.includes(c.id) ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                            )}
                          >
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                              {c.name[0]}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{c.name}</p>
                            </div>
                            {selectedClients.includes(c.id) && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {errors.clients && <p className="text-xs text-destructive">{errors.clients}</p>}
            </div>

            <div className="h-px bg-border" />

            {/* Session Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Session Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {SESSION_TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={cn(
                        'p-2.5 rounded-lg border-2 text-left transition-all',
                        type === t.id
                          ? `border-[${t.color}] bg-[${t.bgColor}]`
                          : 'border-border hover:border-primary/30'
                      )}
                    >
                      <Icon className="w-4 h-4 mb-1" style={{ color: type === t.id ? t.color : 'rgb(var(--muted-foreground))' }} />
                      <p className="text-xs font-medium">{t.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-foreground">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:border-primary/50 outline-none"
                  />
                  {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-foreground">Start Time *</label>
                  <select
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:border-primary/50 outline-none"
                  >
                    {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  {errors.startTime && <p className="text-xs text-destructive">{errors.startTime}</p>}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Duration *</label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d.mins}
                      onClick={() => { setDuration(d.mins); setCustomDuration(''); }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        duration === d.mins && duration !== null
                          ? 'bg-primary text-white'
                          : 'bg-muted text-foreground hover:bg-border'
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setDuration(null)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      duration === null
                        ? 'bg-primary text-white'
                        : 'bg-muted text-foreground hover:bg-border'
                    )}
                  >
                    Custom
                  </button>
                </div>
                {duration === null && (
                  <input
                    type="number"
                    placeholder="Minutes"
                    value={customDuration}
                    onChange={e => { setCustomDuration(e.target.value); setDuration(Number(e.target.value) || 60); }}
                    min="5"
                    max="240"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:border-primary/50 outline-none"
                  />
                )}
              </div>

              {/* End time display */}
              {endTime && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">End time:</span> {endTime}
                </p>
              )}

              {/* Overlap warning */}
              {checkOverlap() && (
                <div className="flex gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning">
                  <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-warning">You already have a session at this time</p>
                </div>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Additional Options */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add any prep notes or agenda items..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:border-primary/50 outline-none resize-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendConfirmation}
                  onChange={e => setSendConfirmation(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm font-medium text-foreground">Send confirmation to client</span>
              </label>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Reminder</label>
                <select
                  value={reminder}
                  onChange={e => setReminder(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:border-primary/50 outline-none"
                >
                  <option value="none">No reminder</option>
                  <option value="15min">15 minutes before</option>
                  <option value="30min">30 minutes before</option>
                  <option value="1hour">1 hour before</option>
                  <option value="24hours">24 hours before</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Repeat</label>
                <select
                  value={repeat}
                  onChange={e => setRepeat(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:border-primary/50 outline-none"
                >
                  <option value="none">Does not repeat</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Summary */}
            <div className="bg-background rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Session Summary</p>
              <div className="space-y-1">
                {selectedClients.map(id => {
                  const c = clients.find(cl => cl.id === id);
                  return (
                    <p key={id} className="text-sm font-medium text-foreground">{c?.name}</p>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">{selectedType.label}</p>
              <p className="text-sm text-muted-foreground">
                {format(parse(date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')} • {startTime} - {endTime}
              </p>
              {sendConfirmation && (
                <p className="text-xs text-muted-foreground">✓ Confirmation will be sent</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 rounded-lg text-white font-semibold bg-gradient-to-r from-primary to-ai hover:opacity-90 transition-opacity"
              >
                Schedule Session
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}