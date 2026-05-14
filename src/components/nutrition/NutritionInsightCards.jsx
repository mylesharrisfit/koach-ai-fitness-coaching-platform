import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, AlertTriangle, TrendingUp, Bell, Brain } from 'lucide-react';

const INSIGHTS = [
  { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 border-red-100', label: 'Under protein target', value: '12 clients', sub: 'Missing daily protein goals' },
  { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100', label: 'Low adherence', value: '5 clients', sub: 'Below 70% meal compliance' },
  { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100', label: 'Ready for calorie increase', value: '3 clients', sub: 'Consistent surplus weeks' },
  { icon: Bell, color: 'text-primary', bg: 'bg-blue-50 border-blue-100', label: 'Missed meal check-ins', value: '2 clients', sub: 'No log in 48+ hours' },
];

export default function NutritionInsightCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {INSIGHTS.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer hover:shadow-md transition-all ${item.bg}`}
          >
            <div className={`p-2 rounded-xl bg-white/70 flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground leading-none">{item.value}</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">{item.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{item.sub}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}