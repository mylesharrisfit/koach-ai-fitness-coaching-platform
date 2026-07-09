import React, { useState, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
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
          <Sparkles className="w-4 h-4 text-ai" />
          <h2 className="text-sm font-bold text-foreground tracking-tight">AI Client Insights</h2>
          {totalCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgb(var(--ai))', color: 'rgb(var(--ai))', border: '1px solid rgb(var(--ai))' }}>
              {totalCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={isRefreshing}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-muted-foreground disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          {totalCount > 4 && (
            <button onClick={() => navigate('/ai-insights')}
              className="flex items-center gap-1 text-xs font-semibold text-ai hover:text-ai transition-colors">
              View all {totalCount} <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {isRefreshing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl px-6 py-8 text-center"
          style={{ background: 'linear-gradient(135deg, rgb(var(--success)), rgb(var(--success)))', border: '1px solid rgb(var(--success))' }}>
          <div className="text-2xl mb-2">🎉</div>
          <p className="text-sm font-semibold text-foreground">No new insights right now — your clients are all on track!</p>
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