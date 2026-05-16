import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight } from 'lucide-react';

const EQUIPMENT_OPTIONS = [
  'No Equipment', 'Dumbbells', 'Barbell', 'Cables', 'Machines',
  'Full Gym', 'Resistance Bands', 'Kettlebells'
];

const ChipSelect = ({ value, onChange, options }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => (
      <button
        key={opt}
        onClick={() => {
          const arr = Array.isArray(value) ? value : [];
          onChange(arr.includes(opt) ? arr.filter(o => o !== opt) : [...arr, opt]);
        }}
        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
          Array.isArray(value) && value.includes(opt)
            ? 'bg-primary text-primary-foreground'
            : 'border border-border hover:border-primary'
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

export default function AIProfileStep({ onSubmit }) {
  const [mode, setMode] = useState('manual');
  const [selectedClient, setSelectedClient] = useState('');
  const [form, setForm] = useState({
    goal: '', fitness_level: '', age: '', gender: '', days_per_week: '',
    session_length: '', equipment: [], injuries: '', focus_areas: ''
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setForm({
        goal: client.goal || '', fitness_level: '', age: '', gender: '',
        days_per_week: '', session_length: '', equipment: [], injuries: '', focus_areas: ''
      });
      setSelectedClient(clientId);
      setMode('manual');
    }
  };

  const handleSubmit = () => {
    if (!form.goal || !form.fitness_level || !form.days_per_week || !form.session_length) {
      return;
    }
    onSubmit({ ...form, client_id: selectedClient });
  };

  const isComplete = form.goal && form.fitness_level && form.days_per_week && form.session_length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 max-h-96 overflow-y-auto pr-4"
    >
      <div>
        <Label className="text-base font-semibold mb-3 block">Select Client or Fill Manually</Label>
        <Select value={selectedClient} onValueChange={handleClientSelect}>
          <SelectTrigger><SelectValue placeholder="Select existing client (optional)" /></SelectTrigger>
          <SelectContent>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Goal *</Label>
          <Select value={form.goal} onValueChange={v => setForm(f => ({ ...f, goal: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fat_loss">Fat Loss</SelectItem>
              <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
              <SelectItem value="strength">Strength</SelectItem>
              <SelectItem value="endurance">Endurance</SelectItem>
              <SelectItem value="athletic">Athletic Performance</SelectItem>
              <SelectItem value="general">General Fitness</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Fitness Level *</Label>
          <Select value={form.fitness_level} onValueChange={v => setForm(f => ({ ...f, fitness_level: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="complete_beginner">Complete Beginner</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Age</Label>
          <Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
        </div>
        <div>
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Days Per Week Available *</Label>
        <div className="flex gap-2 flex-wrap mt-2">
          {[1, 2, 3, 4, 5, 6, 7].map(d => (
            <button
              key={d}
              onClick={() => setForm(f => ({ ...f, days_per_week: d }))}
              className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                form.days_per_week === d
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:border-primary'
              }`}
            >
              {d}x
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Session Length Available *</Label>
        <Select value={form.session_length} onValueChange={v => setForm(f => ({ ...f, session_length: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 minutes</SelectItem>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="45">45 minutes</SelectItem>
            <SelectItem value="60">60 minutes</SelectItem>
            <SelectItem value="90">90+ minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Equipment Available</Label>
        <ChipSelect value={form.equipment} onChange={v => setForm(f => ({ ...f, equipment: v }))} options={EQUIPMENT_OPTIONS} />
      </div>

      <div>
        <Label>Injuries or Limitations</Label>
        <Textarea value={form.injuries} onChange={e => setForm(f => ({ ...f, injuries: e.target.value }))} rows={2} />
      </div>

      <div>
        <Label>Specific Focus Areas</Label>
        <Textarea value={form.focus_areas} onChange={e => setForm(f => ({ ...f, focus_areas: e.target.value }))} rows={2} placeholder="e.g., bigger shoulders, leaner core" />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!isComplete} className="gap-2">
          Next Step <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}