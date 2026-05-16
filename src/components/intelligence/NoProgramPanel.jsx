import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Dumbbell, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function ClientProgramRow({ client, programs, onAssigned }) {
  const [selected, setSelected] = useState('');
  const queryClient = useQueryClient();

  const assignMutation = useMutation({
    mutationFn: () => base44.entities.Client.update(client.id, { assigned_program_id: selected }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`Program assigned to ${client.name}`);
      onAssigned(client.id);
    },
  });

  const initials = client.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#F0F2F8] last:border-0">
      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1F2A44] truncate">{client.name}</p>
        <p className="text-xs text-[#9CA3AF] truncate">{client.email}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-36 h-7 text-xs bg-[#F6F7FB] border-[#E7EAF3]">
            <SelectValue placeholder="Pick program…" />
          </SelectTrigger>
          <SelectContent>
            {programs.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-7 px-2.5 text-xs"
          disabled={!selected || assignMutation.isPending}
          onClick={() => assignMutation.mutate()}
        >
          <Check className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function NoProgramPanel({ clients, onClose }) {
  const [assignedIds, setAssignedIds] = useState(new Set());

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.WorkoutProgram.list('-created_date', 30),
  });

  const visible = clients.filter(c => !assignedIds.has(c.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F2F8]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-[#1F2A44] text-sm">Clients Without a Program</p>
              <p className="text-xs text-[#6B7280]">{visible.length} remaining</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Client list */}
        <div className="flex-1 overflow-y-auto px-5">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-[#374151]">All clients have a program!</p>
            </div>
          ) : (
            <div>
              {visible.map(client => (
                <ClientProgramRow
                  key={client.id}
                  client={client}
                  programs={programs}
                  onAssigned={(id) => setAssignedIds(prev => new Set([...prev, id]))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}