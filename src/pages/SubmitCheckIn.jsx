import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CheckInSubmitForm from '@/components/checkin/CheckInSubmitForm';

export default function SubmitCheckIn() {
  const [user, setUser] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients-submit'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const activeClients = clients.filter(c => c.status === 'active' || c.lifecycle_status === 'active');
  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold">Weekly Check-In</h1>
            <p className="text-sm text-muted-foreground">How's this week been?</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Client selector (for coach testing or multi-client portals) */}
            {activeClients.length > 1 && !selectedClientId && (
              <div className="mb-8">
                <p className="text-sm font-medium mb-3">Select client:</p>
                <div className="grid grid-cols-1 gap-2">
                  {activeClients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 active:scale-[0.98] transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {c.name?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(selectedClientId || activeClients.length === 1) && (
              <CheckInSubmitForm
                clientId={selectedClientId || activeClients[0]?.id}
                clientName={selectedClient?.name || activeClients[0]?.name}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}