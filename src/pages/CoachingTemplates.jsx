import React, { useState } from 'react';
import { COACHING_TEMPLATES } from '@/lib/coachingTemplates';
import ApplyTemplateModal from '@/components/templates/ApplyTemplateModal';
import { Dumbbell, Salad, Zap, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const FEATURE_ICONS = {
  workouts: Dumbbell,
  nutrition: Salad,
  automations: Zap,
  checkins: CheckSquare,
};

const FEATURE_LABELS = {
  workouts: 'Workout program',
  nutrition: 'Nutrition plan',
  automations: 'Auto rules',
  checkins: 'Check-in setup',
};

// Map template tags to filter categories
const FILTERS = [
  { key: 'all',         label: 'All' },
  { key: 'fat_loss',    label: 'Fat Loss' },
  { key: 'muscle_gain', label: 'Muscle Gain' },
  { key: 'performance', label: 'Performance' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'custom',      label: 'Custom' },
];

function matchesFilter(template, filter) {
  if (filter === 'all') return true;
  if (filter === 'performance') return (template.tags || []).some(t => ['hybrid', 'athletic', 'performance'].includes(t));
  return (template.tags || []).includes(filter);
}

function TemplateCard({ template, onApply }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{template.emoji}</span>
          <div>
            <h3 className="font-bold text-base text-foreground leading-tight">{template.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4 flex-1 flex flex-col">
        {/* What's included */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">What's Included</p>
          <div className="grid grid-cols-2 gap-2">
            {(['workouts', 'nutrition', 'automations', 'checkins']).map(f => {
              const Icon = FEATURE_ICONS[f];
              return (
                <div key={f} className="flex items-center gap-2 text-xs text-foreground">
                  <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3 h-3 text-muted-foreground" />
                  </div>
                  {FEATURE_LABELS[f]}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats chips */}
        <div className="flex flex-wrap gap-1.5">
          {template.stats.map(s => (
            <span key={s} className="text-xs bg-muted text-foreground px-2.5 py-1 rounded-full">
              {s}
            </span>
          ))}
        </div>

        {/* Training days */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Training Days</p>
          <div className="space-y-1">
            {(template.program.workouts || []).map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-4 h-4 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-foreground flex-shrink-0">
                  {i + 1}
                </span>
                {w.day_name}
              </div>
            ))}
          </div>
        </div>

        {/* Daily targets */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Daily Targets</p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span><span className="font-bold text-foreground">{template.nutrition.calories}</span> kcal</span>
            <span><span className="font-bold text-foreground">{template.nutrition.protein_g}g</span> protein</span>
            <span><span className="font-bold text-foreground">{template.nutrition.carbs_g}g</span> carbs</span>
            <span><span className="font-bold text-foreground">{template.nutrition.fats_g}g</span> fats</span>
          </div>
        </div>

        {/* Auto rules */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Auto Rules</p>
          <div className="space-y-1">
            {template.automationRules.map((r, i) => (
              <div key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Zap className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                {r.name.replace(/^[^–]+–\s*/, '')}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-2">
          <button
            onClick={() => onApply(template)}
            className="w-full h-10 rounded-lg bg-sidebar text-white text-sm font-semibold hover:bg-[var(--kc-1f2937)] transition-colors"
          >
            Apply to Client
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoachingTemplates() {
  const [applyingTemplate, setApplyingTemplate] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredTemplates = COACHING_TEMPLATES.filter(t => matchesFilter(t, activeFilter));

  const countFor = (key) => key === 'all'
    ? COACHING_TEMPLATES.length
    : COACHING_TEMPLATES.filter(t => matchesFilter(t, key)).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
      {/* Dark header banner */}
      <div className="bg-sidebar rounded-xl p-5 text-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Coaching Templates</h1>
          <p className="text-sm text-white/50 mt-0.5">Pre-built blueprints — apply everything to a client in one click</p>
        </div>
        <button className="px-4 py-2 bg-card text-foreground rounded-lg text-sm font-semibold hover:bg-[var(--kc-w-90)] transition-colors">
          + Create Template
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => {
          const count = countFor(f.key);
          if (count === 0 && f.key !== 'all') return null;
          return (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                activeFilter === f.key
                  ? 'bg-sidebar text-white'
                  : 'bg-card border border-border text-muted-foreground hover:border-foreground')}>
              {f.label}
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                activeFilter === f.key ? 'bg-[var(--kc-w-20)] text-white' : 'bg-muted text-muted-foreground')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Template grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-sm text-muted-foreground">No templates in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTemplates.map(t => (
            <TemplateCard key={t.id} template={t} onApply={setApplyingTemplate} />
          ))}
        </div>
      )}

      {applyingTemplate && (
        <ApplyTemplateModal
          template={applyingTemplate}
          onClose={() => setApplyingTemplate(null)}
        />
      )}
    </div>
  );
}