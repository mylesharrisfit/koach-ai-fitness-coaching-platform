import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const METRIC_CATEGORIES = [
  {
    id: 'biometrics',
    label: 'BIOMETRICS',
    items: [
      { key: 'weight', label: 'Body weight', unit: 'lbs', field: 'weight', chart: 'area' },
      { key: 'body_fat_pct', label: 'Body fat %', unit: '%', field: 'body_fat_pct', chart: 'area' },
      { key: 'lean_mass', label: 'Lean mass', unit: 'lbs', field: null, derived: true, chart: 'area' },
      { key: 'fat_mass', label: 'Fat mass', unit: 'lbs', field: null, derived: true, chart: 'area' },
      { key: 'bmi', label: 'BMI', unit: '', field: null, derived: true, chart: 'line' },
    ],
  },
  {
    id: 'measurements',
    label: 'BODY MEASUREMENTS',
    items: [
      { key: 'chest', label: 'Chest', unit: 'in', field: 'measurements.chest', chart: 'area' },
      { key: 'waist', label: 'Waist', unit: 'in', field: 'measurements.waist', chart: 'area' },
      { key: 'hips', label: 'Hips', unit: 'in', field: 'measurements.hips', chart: 'area' },
      { key: 'arms', label: 'Left arm / right arm', unit: 'in', field: 'measurements.arms', chart: 'area' },
      { key: 'thighs', label: 'Left thigh / right thigh', unit: 'in', field: 'measurements.thighs', chart: 'area' },
    ],
  },
  {
    id: 'performance',
    label: 'PERFORMANCE',
    items: [
      { key: 'sleep_hours', label: 'Sleep hours', unit: 'hrs', field: 'sleep_hours', chart: 'bar' },
      { key: 'energy_level', label: 'Energy level', unit: '/10', field: 'energy_level', chart: 'line' },
      { key: 'stress_level', label: 'Stress level', unit: '/10', field: 'stress_level', chart: 'line' },
    ],
  },
  {
    id: 'compliance',
    label: 'COMPLIANCE',
    items: [
      { key: 'compliance_training', label: 'Training compliance', unit: '%', field: 'compliance_training', chart: 'bar' },
      { key: 'compliance_nutrition', label: 'Nutrition compliance', unit: '%', field: 'compliance_nutrition', chart: 'bar' },
      { key: 'overall_adherence', label: 'Overall adherence', unit: '%', field: null, derived: true, chart: 'bar' },
    ],
  },
];

export default function ProgressSidebar({ activeKey, onSelect }) {
  const [collapsed, setCollapsed] = useState({});

  const toggle = (id) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="w-[260px] flex-shrink-0 bg-card border-r border-border overflow-y-auto">
      {METRIC_CATEGORIES.map(cat => (
        <div key={cat.id}>
          <button
            className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-bold text-muted-foreground hover:text-muted-foreground transition-colors"
            onClick={() => toggle(cat.id)}
          >
            {cat.label}
            {collapsed[cat.id]
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {!collapsed[cat.id] && (
            <div className="mb-1">
              {cat.items.map(item => (
                <button
                  key={item.key}
                  onClick={() => onSelect(item)}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm transition-all',
                    activeKey === item.key
                      ? 'bg-accent/10 text-primary border-l-2 border-primary font-medium'
                      : 'text-foreground hover:bg-background border-l-2 border-transparent'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}