import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateInsights, dismissInsight } from '@/lib/insightEngine';
import InsightCard from '@/components/intelligence/InsightCard';
import { markNotRelevant } from '@/lib/insightEngine';

export default function AIInsightsFeed({ clients = [], checkIns = [], messages = [] }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [dismissed, setDismissed] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const allInsights = useMemo(
    () => generateInsights(clients, checkIns, messages),
    [clients, checkIns, messages, refreshKey] // eslint-disable-line
  );

  const visible = useMemo(
    () => allInsights.filter(i => !dismissed.has(i.id)).slice(0, 4),
    [allInsights, dismissed]
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setDismissed(new Set());
    setTimeout(() => { setRefreshKey(k => k + 1); setIsRefreshing(false); }, 700);
  }, []);

  const handleDismiss = useCallback((id) => {
    dismissInsight(id);
    setDismissed(prev => new Set([...prev, id]));
  }, []);

  const handleNotRelevant = useCallback((id, type) => {
    markNotRelevant(id, type);
    setDismissed(prev => new Set([...prev, id]));
  }, []);

  const totalCount = allInsights.filter(i => !dismissed.has(i.id)).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">AI Client Insights</h2>
          {totalCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff' }}>
              {totalCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={isRefreshing}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          {totalCount > 4 && (
            <button onClick={() => navigate('/ai-insights')}
              className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors">
              View all {totalCount} <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {isRefreshing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl px-6 py-8 text-center"
          style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0' }}>
          <div className="text-2xl mb-2">🎉</div>
          <p className="text-sm font-semibold text-gray-700">No new insights right now — your clients are all on track!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {visible.map((insight, i) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                index={i}
                onDismiss={handleDismiss}
                onNotRelevant={handleNotRelevant}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}