import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles } from 'lucide-react';
import ClientSelector from '../components/assistant/ClientSelector';
import QuickActions from '../components/assistant/QuickActions';
import AssistantChat from '../components/assistant/AssistantChat';

export default function Assistant() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [pendingPrompt, setPendingPrompt] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const handleQuickAction = (prompt) => {
    setPendingPrompt(prompt);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[900px] p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-heading font-bold tracking-tight">AI Coach Assistant</h1>
          <p className="text-xs text-[#6B7280]">Powered by intelligent fitness analysis</p>
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 min-h-0 bg-white border border-[#E7EAF3] rounded-2xl overflow-hidden flex flex-col shadow-sm">
        {/* Client context selector */}
        <ClientSelector
          clients={clients}
          selectedClient={selectedClient}
          onSelect={setSelectedClient}
        />

        {/* Quick action buttons */}
        <QuickActions
          onAction={handleQuickAction}
          selectedClient={selectedClient}
        />

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <AssistantChat
            initialPrompt={pendingPrompt}
            onPromptConsumed={() => setPendingPrompt(null)}
          />
        </div>
      </div>
    </div>
  );
}