import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, RefreshCw } from 'lucide-react';
import { differenceInWeeks } from 'date-fns';

function buildPrompt(client, checkIns, workoutSessions, foodLogs) {
  const sorted = [...checkIns].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const weightChange = first?.weight && last?.weight ? (last.weight - first.weight).toFixed(1) : null;
  const weeks = first ? Math.max(1, differenceInWeeks(new Date(), new Date(first.date)) + 1) : 1;
  const avgCompliance = checkIns.length
    ? Math.round(checkIns.reduce((s, ci) => s + ((ci.compliance_training || 70) + (ci.compliance_nutrition || 70)) / 2, 0) / checkIns.length)
    : null;

  return `You are a motivational fitness coach AI. Generate exactly 3 short, personal, data-driven insights for this client. Make them specific, encouraging, and actionable. Keep each insight to 1-2 sentences max.

Client data:
- Name: ${client?.name || 'Client'}
- Goal: ${client?.goal?.replace('_', ' ') || 'general fitness'}
- Weeks active: ${weeks}
- Total check-ins: ${checkIns.length}
- Weight change: ${weightChange ? `${weightChange} lbs` : 'not tracked'}
- Workouts completed: ${workoutSessions.length}
- Avg adherence: ${avgCompliance ? `${avgCompliance}%` : 'not tracked'}

Reply with a JSON object: {"insights": ["insight1", "insight2", "insight3"]}`;
}

export default function AIInsightsCard({ client, checkIns, workoutSessions, foodLogs }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(client, checkIns, workoutSessions, foodLogs),
      response_json_schema: {
        type: 'object',
        properties: { insights: { type: 'array', items: { type: 'string' } } },
      },
    });
    setInsights(res?.insights || []);
    setGenerated(true);
    setLoading(false);
  }, [client, checkIns, workoutSessions, foodLogs]);

  return (
    <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(124,58,237,0.2)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <p className="text-white font-bold text-sm">Coach AI Says</p>
        </div>
        {generated && (
          <button onClick={generate} disabled={loading}
            className="flex items-center gap-1 text-white/30 hover:text-white/60 transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {!generated && !loading && (
        <div className="text-center py-4">
          <p className="text-white/30 text-xs mb-3">Get personalized AI insights based on your progress data</p>
          <button onClick={generate}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)' }}>
            ✨ Get My Insights
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-4 justify-center">
          <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
          <p className="text-white/40 text-xs">Analyzing your data...</p>
        </div>
      )}

      {insights && !loading && (
        <div className="space-y-2.5">
          {insights.map((insight, i) => (
            <div key={i} className="flex gap-2.5">
              <span className="text-sm flex-shrink-0 mt-0.5">{'💡🎯🏋️'[i]}</span>
              <p className="text-white/70 text-sm leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}