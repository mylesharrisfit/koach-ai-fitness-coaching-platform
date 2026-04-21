import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

export default function ClientSelector({ clients, selectedClient, onSelect }) {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-[#E7EAF3]">
      <Users className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
      <div className="flex-1">
        <Select
          value={selectedClient?.id || 'all'}
          onValueChange={(val) => {
            if (val === 'all') onSelect(null);
            else onSelect(clients.find(c => c.id === val) || null);
          }}
        >
          <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none focus:ring-0 text-sm font-medium">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="text-muted-foreground">All clients (general)</span>
            </SelectItem>
            {clients.filter(c => c.status === 'active').map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedClient && (
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
          {selectedClient.name?.[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );
}