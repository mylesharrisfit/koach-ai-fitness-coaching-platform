import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, RefreshCw } from 'lucide-react';
import { differenceInWeeks, parseISO } from 'date-fns';

export default function AIProgressInsights({ client, checkIns, sessions }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const sorted = [...checkIns].sort((a, b) => new Date(a.date) - new Date(b.date));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const weightChange = first?.weight && last?.weight ? (last.weight - first.weight).toFixed(1) : null;
      const avgTraining = sorted.length ? Math.round(sorted.reduce((s, ci) => s + (ci.compliance_training ?? 0), 0) / sorted.length) : null;
      const avgSleep = sorted.length ? Math.round(sorted.reduce((s, ci) => s + (ci.sleep_hours ?? 0), 0) / sorted.length * 10) / 10 : null;
      const weeksActive = first?.date ? differenceInWeeks(new Date(), parseISO(first.date)) + 1 : 0;
      const recentWeight = sorted.slice(-4).filter(ci => ci.weight).map(ci => ci.weight);
      const recentSlowing = recentWeight.length >= 2
        ? Math.abs(recentWeight[recentWeight.length - 1] - recentWeight[0]) < 1 : false;

      const prompt = `You are an AI fitness coach assistant. Analyze this client's progress and provide 3-4 specific, actionable insights.

Client: ${client.name}
Goal: ${client.goal?.replace('_', ' ')}
Weeks active: ${weeksActive}
Weight change: ${weightChange ? `${weightChange} lbs` : 'N/A'}
Starting weight: ${first?.weight ? `${first.weight} lbs` : 'N/A'}
Current weight: ${last?.weight ? `${last.weight} lbs` : 'N/A'}
Goal weight: ${client.target_weight ? `${client.target_weight} lbs` : 'N/A'}
Average training compliance: ${avgTraining ?? 'N/A'}%
Average sleep hours: ${avgSleep ?? 'N/A'}hrs
Total check-ins: ${checkIns.length}
Total workout sessions: ${sessions.length}
Recent weight plateau: ${recentSlowing ? 'Yes — minimal change in last 4 weeks' : 'No'}

Provide exactly 4 short, specific insights (1-2 sentences each). Format as JSON array: [{"insight": "...", "type": "positive|warning|suggestion|neutral"}]. Be specific with numbers. Be direct and actionable.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  insight: { type: 'string' },
                  type: { type: 'string' }
                }
              }
            }
          }
        }
      });
      setInsights(result?.insights || []);
    } catch {
      setInsights([{ insight: 'Unable to generate insights at this time. Check back once more data is logged.', type: 'neutral' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (checkIns.length >= 2) generateInsights();
  }, []);

  const typeConfig = {
    positive: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
    suggestion: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
    neutral: { bg: 'bg-[#F9FAFB]', border: 'border-[#E5E7EB]', text: 'text-[#374151]', dot: 'bg-[#9CA3AF]' },
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-[#111827]">AI Progress Insights</h3>
        </div>
        <button onClick={generateInsights} disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="p-4 space-y-2">
        {loading ? (
          <div className="flex items-center gap-3 py-6 justify-center">
            <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
            <span className="text-xs text-[#9CA3AF]">Analyzing progress data...</span>
          </div>
        ) : checkIns.length < 2 ? (
          <p className="text-xs text-[#9CA3AF] py-4 text-center">Log at least 2 check-ins to enable AI insights.</p>
        ) : insights ? (
          insights.map((item, i) => {
            const config = typeConfig[item.type] || typeConfig.neutral;
            return (
              <div key={i} className={`flex gap-2.5 items-start px-3 py-2.5 rounded-lg border ${config.bg} ${config.border}`}>
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${config.dot}`} />
                <p className={`text-xs leading-relaxed ${config.text}`}>{item.insight}</p>
              </div>
            );
          })
        ) : null}
      </div>
    </div>
  );
}