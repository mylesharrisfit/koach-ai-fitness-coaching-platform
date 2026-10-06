import React from 'react';
import ClientConnectedApps from '@/components/integrations/ClientConnectedApps';

export default function ProfileConnectedAppsTab({ client }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="text-xs font-semibold text-muted-foreground mb-4">Connected Apps & Integrations</h3>
      <ClientConnectedApps clientId={client.id} />
    </div>
  );
}