import React, { useState } from 'react';
import { Sparkles, Loader2, Check, ChevronDown, ChevronUp, Flame, Footprints, Dumbbell, Utensils, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const CATEGORY_META = {
  calories:  { icon: Flame,     color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20' },
  cardio:    { icon: Footprints, color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  intensity: { icon: Dumbbell,  color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20' },
  nutrition: { icon: Utensils,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  recovery:  { icon: Zap,       color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
};

function buildPrompt(client, checkIn, allClientCIs, nutritionPlan) {
  const weights = allClientCIs.filter(c => c.weight).slice(0, 4).map(c => c.weight);
  let weightTrend = 'no trend data';
  if (weights.length >= 2) {
    const diff = weights[0] - weights[weights.length - 1];
    if (Math.abs(diff) < 0.5) weightTrend = 'weight is stable (not moving)';
    else if (diff > 0) weightTrend = `weight is down ${diff.toFixed(1)} lbs over last ${weights.length} check-ins`;
    else weightTrend = `weight is up ${Math.abs(diff).toFixed(1)} lbs over last ${weights.length} check-ins`;
  }

  const avgTraining = allClientCIs.length
    ? Math.round(allClientCIs.slice(0,4).reduce((s, c) => s + (c.compliance_training || 0), 0) / Math.min(allClientCIs.length, 4))
    : null;
  const avgNutrition = allClientCIs.length
    ? Math.round(allClientCIs.slice(0,4).reduce((s, c) => s + (c.compliance_nutrition || 0), 0) / Math.min(allClientCIs.length, 4))
    : null;

  return `You are an elite fitness coach analyzing a client check-in to generate smart program adjustment suggestions.

CLIENT: ${client?.name || 'Client'}
GOAL: ${client?.goal?.replace(/_/g, ' ') || 'general fitness'}
CURRENT NUTRITION: ${nutritionPlan ? `${nutritionPlan.calories || '?'} calories, ${nutritionPlan.protein_g || '?'}g protein` : 'no plan assigned'}

THIS WEEK'S CHECK-IN:
- Weight: ${checkIn.weight ? `${checkIn.weight} lbs` : 'not recorded'}
- Weight trend: ${weightTrend}
- Sleep: ${checkIn.sleep_hours ? `${checkIn.sleep_hours} hrs` : 'not recorded'}
- Energy: ${checkIn.energy_level ? `${checkIn.energy_level}/5` : 'not recorded'}
- Stress: ${checkIn.stress_level ? `${checkIn.stress_level}/5` : 'not recorded'}
- Mood: ${checkIn.mood || 'not recorded'}
- Training compliance: ${checkIn.compliance_training != null ? `${checkIn.compliance_training}%` : 'not recorded'} (4-check-in avg: ${avgTraining != null ? avgTraining + '%' : 'N/A'})
- Nutrition compliance: ${checkIn.compliance_nutrition != null ? `${checkIn.compliance_nutrition}%` : 'not recorded'} (4-check-in avg: ${avgNutrition != null ? avgNutrition + '%' : 'N/A'})
- Client notes: ${checkIn.notes || 'none'}

Generate 3-5 specific, actionable program adjustment suggestions based on the data above.
Return a JSON array. Each suggestion must have:
- "title": short action label (e.g. "Decrease calories by 150")
- "rationale": 1 sentence explaining WHY based on the data (be specific, cite a number)
- "category": one of: calories, cardio, intensity, nutrition, recovery
- "impact": one of: high, medium, low
- "action_type": one of: increase_calories, decrease_calories, increase_cardio, decrease_cardio, increase_intensity, decrease_intensity, add_rest_day, adjust_macros, other
- "action_value": numeric value if applicable (e.g. 150 for calorie change, 2000 for steps), null otherwise

Only suggest what the data justifies. Be specific with numbers. No vague suggestions.`;
}

function SuggestionCard({ suggestion, onApply, applied }) {
  const meta = CATEGORY_META[suggestion.category] || CATEGORY_META.intensity;
  const Icon = meta.icon;
  const impactColor = suggestion.impact === 'high' ? 'text-destructive' : suggestion.impact === 'medium' ? 'text-amber-400' : 'text-muted-foreground';

  return (
    <div className={cn('border rounded-xl p-3.5 space-y-2 transition-all', meta.bg, applied && 'opacity-50')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon className={cn('w-4 h-4 flex-shrink-0', meta.color)} />
          <p className="text-sm font-semibold leading-snug">{suggestion.title}</p>
        </div>
        <span className={cn('text-[10px] font-bold uppercase tracking-wide flex-shrink-0', impactColor)}>
          {suggestion.impact}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pl-6">{suggestion.rationale}</p>
      <div className="flex justify-end pl-6">
        <Button
          size="sm"
          variant={applied ? 'secondary' : 'default'}
          className="h-7 text-xs gap-1.5"
          onClick={() => onApply(suggestion)}
          disabled={applied}
        >
          {applied ? <><Check className="w-3 h-3" /> Applied</> : 'Apply Change'}
        </Button>
      </div>
    </div>
  );
}

export default function AIProgramSuggestions({ checkIn, client, allClientCIs = [], nutritionPlan, onApply }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [applied, setApplied] = useState({});
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(client, checkIn, allClientCIs, nutritionPlan),
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                rationale: { type: 'string' },
                category: { type: 'string' },
                impact: { type: 'string' },
                action_type: { type: 'string' },
                action_value: { type: 'number' },
              },
            },
          },
        },
      },
    });
    setSuggestions(result?.suggestions || []);
    setLoading(false);
  };

  const handleApply = (suggestion) => {
    setApplied(prev => ({ ...prev, [suggestion.title]: true }));
    if (onApply) onApply(suggestion);
  };

  const appliedCount = Object.keys(applied).length;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">AI Program Suggestions</p>
          {appliedCount > 0 && (
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              {appliedCount} applied
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {suggestions.length > 0 && (
            <button onClick={() => setExpanded(e => !e)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
          )}
          <Button
            size="sm"
            variant={suggestions.length ? 'outline' : 'default'}
            className={cn('h-8 text-xs gap-1.5', !suggestions.length && 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20')}
            onClick={generate}
            disabled={loading}
          >
            {loading
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Sparkles className="w-3 h-3" />
            }
            {loading ? 'Analyzing...' : suggestions.length ? 'Regenerate' : 'Analyze & Suggest'}
          </Button>
        </div>
      </div>

      {/* Content */}
      {!suggestions.length && !loading && (
        <div className="px-4 py-6 text-center space-y-1.5">
          <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">Click "Analyze & Suggest" to get AI-powered adjustment recommendations based on this check-in data.</p>
        </div>
      )}

      {loading && (
        <div className="px-4 py-6 text-center space-y-2">
          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Analyzing weight trend, compliance, sleep & energy...</p>
        </div>
      )}

      {suggestions.length > 0 && expanded && (
        <div className="p-4 space-y-2.5">
          {suggestions.map((s, i) => (
            <SuggestionCard
              key={i}
              suggestion={s}
              onApply={handleApply}
              applied={!!applied[s.title]}
            />
          ))}
          {appliedCount > 0 && (
            <p className="text-[11px] text-center text-muted-foreground pt-1">
              {appliedCount} suggestion{appliedCount > 1 ? 's' : ''} marked as applied. Remember to update the client's plan manually.
            </p>
          )}
        </div>
      )}

      {suggestions.length > 0 && !expanded && (
        <div className="px-4 py-2.5 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{suggestions.length} suggestions generated</span>
          {appliedCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <Check className="w-3 h-3" />{appliedCount} applied
            </span>
          )}
        </div>
      )}
    </div>
  );
}