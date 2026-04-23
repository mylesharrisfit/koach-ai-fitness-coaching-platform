import React, { useState } from 'react';
import { COACHING_TEMPLATES } from '@/lib/coachingTemplates';
import ApplyTemplateModal from '@/components/templates/ApplyTemplateModal';
import { Dumbbell, Salad, Zap, CheckSquare, LayoutTemplate } from 'lucide-react';
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

function TemplateCard({ template, onApply }) {
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all">
      {/* Header stripe */}
      <div className={cn('px-5 py-4 border-b border-border', template.color)}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{template.emoji}</span>
          <div>
            <h3 className="font-bold text-base leading-tight">{template.label}</h3>
            <p className="text-xs opacity-75 mt-0.5">{template.description}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* What's included */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">What's included</p>
          <div className="grid grid-cols-2 gap-2">
            {(['workouts', 'nutrition', 'automations', 'checkins']).map(f => {
              const Icon = FEATURE_ICONS[f];
              return (
                <div key={f} className="flex items-center gap-2 text-xs text-foreground">
                  <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3 h-3 text-muted-foreground" />
                  </div>
                  {FEATURE_LABELS[f]}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-1.5">
          {template.stats.map(s => (
            <span key={s} className="text-[11px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border">
              {s}
            </span>
          ))}
        </div>

        {/* Program preview */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Training days</p>
          <div className="space-y-1">
            {(template.program.workouts || []).map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-4 h-4 rounded bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground flex-shrink-0">
                  {i + 1}
                </span>
                {w.day_name}
              </div>
            ))}
          </div>
        </div>

        {/* Macros */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Daily targets</p>
          <div className="flex gap-3 text-xs">
            <span><span className="font-bold text-foreground">{template.nutrition.calories}</span> kcal</span>
            <span><span className="font-bold text-foreground">{template.nutrition.protein_g}g</span> protein</span>
            <span><span className="font-bold text-foreground">{template.nutrition.carbs_g}g</span> carbs</span>
            <span><span className="font-bold text-foreground">{template.nutrition.fats_g}g</span> fats</span>
          </div>
        </div>

        {/* Automation rules */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Auto rules</p>
          <div className="space-y-1">
            {template.automationRules.map((r, i) => (
              <div key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Zap className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                {r.name.replace(/^[^–]+–\s*/, '')}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => onApply(template)}
          className="w-full h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Apply to Client
        </button>
      </div>
    </div>
  );
}

export default function CoachingTemplates() {
  const [applyingTemplate, setApplyingTemplate] = useState(null);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <LayoutTemplate className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Smart Coaching Templates</h1>
          <p className="text-sm text-muted-foreground">Pre-built blueprints — apply everything to a client in one click.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {COACHING_TEMPLATES.map(t => (
          <TemplateCard key={t.id} template={t} onApply={setApplyingTemplate} />
        ))}
      </div>

      {applyingTemplate && (
        <ApplyTemplateModal
          template={applyingTemplate}
          onClose={() => setApplyingTemplate(null)}
        />
      )}
    </div>
  );
}