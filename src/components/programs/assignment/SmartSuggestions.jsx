import React, { useMemo } from 'react';
import { AlertCircle, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SmartSuggestions({ selectedClients, program, allClients }) {
  const suggestions = useMemo(() => {
    const tips = [];

    if (selectedClients.length === 0) return tips;

    const clientData = allClients.filter((c) => selectedClients.includes(c.id));

    // Check for Lead clients
    if (clientData.some((c) => c.lifecycle_status === 'lead')) {
      tips.push({
        id: 'lead-kickoff',
        type: 'tip',
        icon: Lightbulb,
        title: 'Schedule an onboarding call',
        message: '💡 Consider scheduling an onboarding call before the program starts to set expectations and answer questions.',
      });
    }

    // Check for difficulty mismatch
    if (program.difficulty === 'advanced') {
      const beginnerClients = clientData.filter((c) => c.goal === 'general_fitness' || !c.assigned_program_id);
      if (beginnerClients.length > 0) {
        tips.push({
          id: 'difficulty-mismatch',
          type: 'warning',
          icon: AlertCircle,
          title: 'Difficulty level mismatch',
          message: `⚠️ This program is rated Advanced — ${beginnerClients.length === 1 ? `${beginnerClients[0].name}` : 'these clients'} may not be the right fit.`,
        });
      }
    }

    // Check for injury notes
    clientData.forEach((client) => {
      if (client.notes && client.notes.toLowerCase().includes('injury')) {
        tips.push({
          id: `injury-${client.id}`,
          type: 'warning',
          icon: AlertCircle,
          title: 'Client has injury notes',
          message: `⚠️ ${client.name} has noted an injury — make sure this program accounts for that.`,
        });
      }
    });

    return tips;
  }, [selectedClients, program, allClients]);

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-2 mt-6 pt-6 border-t border-border">
      {suggestions.map((suggestion) => (
        <motion.div
          key={suggestion.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex gap-3 p-3 rounded-lg border ${
            suggestion.type === 'warning'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <suggestion.icon
            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
              suggestion.type === 'warning' ? 'text-amber-700' : 'text-blue-700'
            }`}
          />
          <div>
            <p className={`text-sm font-semibold ${
              suggestion.type === 'warning' ? 'text-amber-900' : 'text-blue-900'
            }`}>
              {suggestion.title}
            </p>
            <p className={`text-xs mt-0.5 ${
              suggestion.type === 'warning' ? 'text-amber-700' : 'text-blue-700'
            }`}>
              {suggestion.message}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}