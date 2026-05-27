import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, TrendingUp, AlertTriangle, Zap, Trophy, ChevronDown, ChevronUp } from 'lucide-react';

const TYPE_CONFIG = {
  performance: {
    icon: TrendingUp,
    gradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    border: '#bfdbfe',
    iconBg: '#2563eb',
    tag: 'Performance',
    dot: '#2563eb',
  },
  risk: {
    icon: AlertTriangle,
    gradient: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
    border: '#fed7aa',
    iconBg: '#ea580c',
    tag: 'Risk Alert',
    dot: '#ea580c',
  },
  opportunity: {
    icon: Zap,
    gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
    border: '#bbf7d0',
    iconBg: '#16a34a',
    tag: 'Opportunity',
    dot: '#16a34a',
  },
  celebration: {
    icon: Trophy,
    gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    border: '#fde68a',
    iconBg: '#d97706',
    tag: 'Celebrate',
    dot: '#d97706',
  },
};

const CONFIDENCE_COLORS = {
  High: { bg: 'rgba(22,163,74,0.12)', text: '#16a34a' },
  Medium: { bg: 'rgba(202,138,4,0.12)', text: '#ca8a04' },
  Low: { bg: 'rgba(107,114,128,0.12)', text: '#6b7280' },
};

export default function InsightCard({ insight, index = 0, onDismiss, onNotRelevant }) {
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const cfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG.opportunity;
  const Icon = cfg.icon;
  const conf = CONFIDENCE_COLORS[insight.confidence] || CONFIDENCE_COLORS.Medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      layout
      className="rounded-2xl p-5 flex flex-col gap-3.5 transition-shadow hover:shadow-md"
      style={{ background: cfg.gradient, border: `1px solid ${cfg.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: cfg.iconBg }}>
            <Icon style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.iconBg }}>
              {cfg.tag}
            </span>
            {insight.clientName && (
              <p className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">{insight.clientName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {insight.confidence && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: conf.bg, color: conf.text }}>
              {insight.confidence}
            </span>
          )}
          <button onClick={() => onDismiss(insight.id)}
            className="p-1 rounded-md opacity-30 hover:opacity-70 transition-opacity">
            <X className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        <p className="text-sm font-bold text-gray-900 leading-snug">{insight.headline}</p>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{insight.body}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-auto pt-1 flex-wrap gap-2">
        <button
          onClick={() => navigate(insight.actionPath)}
          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
          style={{ background: cfg.iconBg, color: '#fff' }}>
          {insight.actionLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        {insight.actionAlt && (
          <button
            onClick={() => navigate(insight.actionAltPath)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 bg-white/60 text-gray-600 hover:bg-white transition-all">
            {insight.actionAlt}
          </button>
        )}
        <button onClick={() => onNotRelevant(insight.id, insight.type)}
          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors ml-auto">
          Not relevant
        </button>
      </div>
    </motion.div>
  );
}