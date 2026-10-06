import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Initials } from '@/components/kit';

export default function ClientSelector({ clients, selectedClient, onSelect }) {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-border">
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
              <span className="text-muted-foreground">General, no client</span>
            </SelectItem>
            {clients.filter(c => c.status === 'active').map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedClient && (
        <Initials name={selectedClient.name || ''} size={28} />
      )}
    </div>
  );
}