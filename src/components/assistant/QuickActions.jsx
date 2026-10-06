import React from 'react';

const ACTIONS = [
  {
    id: 'calorie_adjust',
    label: 'Adjust calories',
    prompt: (client) => `Analyze ${client ? client.name + "'s" : "the selected client's"} recent weight trend from their check-ins and suggest a specific calorie adjustment. Include: current estimated intake, recommended change (+/- calories), and reasoning based on their goal of ${client?.goal || 'general fitness'}.`,
  },
  {
    id: 'workout_progression',
    label: 'Plan the next progression',
    prompt: (client) => `Review ${client ? client.name + "'s" : "the selected client's"} assigned workout program and recent compliance data. Suggest specific progressive overload adjustments — which exercises to increase weight or reps, and by how much. Apply the changes to their program.`,
  },
  {
    id: 'checkin_response',
    label: 'Draft a check-in reply',
    prompt: (client) => `Write a warm, personalized weekly check-in response message from the coach to ${client ? client.name : "the client"} based on their most recent check-in data. Acknowledge their progress, address any concerns, and give 2 specific action items for next week. Then send it as a message.`,
  },
  {
    id: 'compliance_analysis',
    label: 'Find compliance issues',
    prompt: (client) => `Detect any compliance issues for ${client ? client.name : "the selected client"} — low training adherence, poor nutrition compliance, sleep issues, or missed check-ins. For each issue found, suggest a concrete, actionable solution the coach can implement today.`,
  },
  {
    id: 'weekly_summary',
    label: 'Weekly summary',
    prompt: (client) => `Generate a comprehensive weekly summary for ${client ? client.name : "all active clients"}: weight trend direction, compliance scores, mood patterns, biggest win this week, and top priority action item. Format clearly with sections.`,
  },
  {
    id: 'full_analysis',
    label: 'Full client analysis',
    prompt: (client) => `Do a complete analysis of ${client ? client.name : "the selected client"}: review all recent check-ins, compliance data, weight trends, sleep patterns, and program adherence. Identify what's working, what's not, and provide a prioritized action plan with 3 specific changes to make this week.`,
  },
];

export default function QuickActions({ onAction, selectedClient }) {
  return (
    <div className="p-4 border-b border-border">
      <p className="text-sm font-semibold text-foreground mb-1">Quick actions</p>
      <ul className="divide-y divide-border">
        {ACTIONS.map(action => (
          <li key={action.id}>
            <button
              onClick={() => onAction(action.prompt(selectedClient))}
              className="w-full text-left py-2.5 text-sm text-foreground hover:underline underline-offset-4 decoration-1"
            >
              {action.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
