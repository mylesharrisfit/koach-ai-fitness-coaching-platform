import React, { useState } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const INSIGHT_TYPES = [
  { type: 'performance', label: 'Performance Insights', desc: 'Weight pace, strength gains, workout consistency', emoji: '📈' },
  { type: 'risk', label: 'Risk Alerts', desc: 'Burnout signals, plateaus, churn risk, weekend drops', emoji: '⚠️' },
  { type: 'opportunity', label: 'Opportunities', desc: 'Program switches, upsell moments, lead follow-ups', emoji: '💡' },
  { type: 'celebration', label: 'Celebration Insights', desc: 'Milestones, PRs, streak achievements', emoji: '🎉' },
];

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      className="relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0"
      style={{
        background: value ? '#2563eb' : '#e5e7eb',
        height: 22,
        width: 40,
      }}>
      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ left: value ? 22 : 2 }} />
    </button>
  );
}

export default function InsightPreferences({ onClose }) {
  const getDisabled = () => {
    try { return new Set(JSON.parse(localStorage.getItem('koach_not_relevant_types') || '[]')); }
    catch { return new Set(); }
  };

  const [disabled, setDisabled] = useState(getDisabled);

  const toggle = (type) => {
    setDisabled(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      localStorage.setItem('koach_not_relevant_types', JSON.stringify([...next]));
      return next;
    });
  };

  const handleReset = () => {
    localStorage.removeItem('koach_not_relevant_types');
    localStorage.removeItem('koach_dismissed_insights');
    setDisabled(new Set());
    toast.success('Insight preferences reset');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Insight Preferences</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <p className="text-xs text-gray-500">Choose which types of insights you want to see. Hidden types won't appear in your feed.</p>
      <div className="space-y-2">
        {INSIGHT_TYPES.map(({ type, label, desc, emoji }) => (
          <div key={type} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
            <span className="text-xl">{emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-[11px] text-gray-400">{desc}</p>
            </div>
            <Toggle value={!disabled.has(type)} onChange={() => toggle(type)} />
          </div>
        ))}
      </div>
      <button onClick={handleReset}
        className="w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
        Reset All Preferences & Dismissed Cards
      </button>
    </div>
  );
}