import React from 'react';
import ClientConnectedApps from '@/components/integrations/ClientConnectedApps';

export default function ProfileConnectedAppsTab({ client }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] p-4">
      <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-4">Connected Apps & Integrations</h3>
      <ClientConnectedApps clientId={client.id} />
    </div>
  );
}