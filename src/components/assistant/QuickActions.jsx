import React from 'react';
import { Scale, Dumbbell, MessageSquare, AlertTriangle, TrendingUp, Zap } from 'lucide-react';

const ACTIONS = [
  {
    id: 'calorie_adjust',
    label: 'Calorie Adjustment',
    icon: Scale,
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20 hover:bg-primary/20',
    prompt: (client) => `Analyze ${client ? client.name + "'s" : "the selected client's"} recent weight trend from their check-ins and suggest a specific calorie adjustment. Include: current estimated intake, recommended change (+/- calories), and reasoning based on their goal of ${client?.goal || 'general fitness'}.`,
  },
  {
    id: 'workout_progression',
    label: 'Workout Progression',
    icon: Dumbbell,
    color: 'text-success',
    bg: 'bg-success/10 border-success/20 hover:bg-success/20',
    prompt: (client) => `Review ${client ? client.name + "'s" : "the selected client's"} assigned workout program and recent compliance data. Suggest specific progressive overload adjustments — which exercises to increase weight or reps, and by how much. Apply the changes to their program.`,
  },
  {
    id: 'checkin_response',
    label: 'Generate Check-in Response',
    icon: MessageSquare,
    color: 'text-ai',
    bg: 'bg-ai/10 border-ai/20 hover:bg-ai/20',
    prompt: (client) => `Write a warm, personalized weekly check-in response message from the coach to ${client ? client.name : "the client"} based on their most recent check-in data. Acknowledge their progress, address any concerns, and give 2 specific action items for next week. Then send it as a message.`,
  },
  {
    id: 'compliance_analysis',
    label: 'Compliance Issues',
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/10 border-warning/20 hover:bg-warning/20',
    prompt: (client) => `Detect any compliance issues for ${client ? client.name : "the selected client"} — low training adherence, poor nutrition compliance, sleep issues, or missed check-ins. For each issue found, suggest a concrete, actionable solution the coach can implement today.`,
  },
  {
    id: 'weekly_summary',
    label: 'Weekly Summary',
    icon: TrendingUp,
    color: 'text-chart-1',
    bg: 'bg-primary/10 border-primary/20 hover:bg-primary/20',
    prompt: (client) => `Generate a comprehensive weekly summary for ${client ? client.name : "all active clients"}: weight trend direction, compliance scores, mood patterns, biggest win this week, and top priority action item. Format clearly with sections.`,
  },
  {
    id: 'full_analysis',
    label: 'Full Client Analysis',
    icon: Zap,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/20',
    prompt: (client) => `Do a complete analysis of ${client ? client.name : "the selected client"}: review all recent check-ins, compliance data, weight trends, sleep patterns, and program adherence. Identify what's working, what's not, and provide a prioritized action plan with 3 specific changes to make this week.`,
  },
];

export default function QuickActions({ onAction, selectedClient }) {
  return (
    <div className="p-4 border-b border-border">
      <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Quick Actions</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onAction(action.prompt(selectedClient))}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${action.bg}`}
            >
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${action.color}`} />
              <span className="text-xs font-medium leading-tight">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}