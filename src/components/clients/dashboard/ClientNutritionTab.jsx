import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Download, AlertCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────
// Helpers for nutrition compliance (same as in SummaryTab)
// ─────────────────────────────────────────────────────────

function weekNutritionCompliance(checkIns, weekStart, weekEnd) {
  const inRange = checkIns.filter(ci => {
    const d = new Date(ci.date);
    return d >= weekStart && d <= weekEnd;
  });
  if (!inRange.length) return 0;
  return Math.round(inRange.reduce((s, ci) => s + (ci.compliance_nutrition ?? 0), 0) / inRange.length);
}

function Ring({ pct = 0, label, size = 72, active = false }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(pct / 100, 1)) * circ;
  const activeColor = '#2563EB';
  const inactiveColor = '#9CA3AF';

  return (
    <div className={cn('flex flex-col items-center gap-1.5', active && 'scale-105')}>
      <div className="relative rounded-full">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={active ? 7 : 5} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={pct > 0 ? (active ? activeColor : inactiveColor) : '#E5E7EB'}
            strokeWidth={active ? 7 : 5}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold tabular-nums leading-none', active ? 'text-sm' : 'text-xs')}
            style={{ color: active ? activeColor : '#6B7280' }}>
            {pct}%
          </span>
        </div>
      </div>
      <p className="text-[10px] font-semibold leading-tight" style={{ color: active ? '#0E1525' : '#9CA3AF' }}>
        {label}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PDF Viewer Component
// ─────────────────────────────────────────────────────────

function PDFViewer({ pdfUrl, fileName }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">Plan Document</h3>
        <a
          href={pdfUrl}
          download={fileName || 'nutrition-plan.pdf'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-secondary transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </a>
      </div>
      <div className="rounded-xl border border-border overflow-hidden bg-white" style={{ height: '600px' }}>
        <iframe
          src={pdfUrl}
          title="Nutrition Plan PDF"
          className="w-full h-full"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export default function ClientNutritionTab({ client, nutritionPlan, checkIns = [] }) {
  const navigate = useNavigate();

  const now = new Date();
  const weeks = useMemo(() => [
    { label: '2 Wks Ago', start: startOfWeek(subWeeks(now, 2)), end: endOfWeek(subWeeks(now, 2)) },
    { label: '1 Wk Ago',  start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) },
    { label: 'This Week', start: startOfWeek(now), end: endOfWeek(now), active: true },
  ], []);

  const recentCompliance = useMemo(() => {
    const recent = checkIns.slice(0, 4);
    return recent.length ? Math.round(recent.reduce((s, c) => s + (c.compliance_nutrition ?? 50), 0) / recent.length) : null;
  }, [checkIns]);

  if (!nutritionPlan) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <p className="font-semibold text-foreground mb-1">No Nutrition Plan Assigned</p>
          <p className="text-xs text-muted-foreground mb-4">This client doesn't have a meal plan yet.</p>
          <button
            onClick={() => navigate('/nutrition')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all"
            style={{ background: '#2563EB' }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Go to Nutrition Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-[#f8f9fa]">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{nutritionPlan.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold px-2 py-1 rounded-full"
                style={{
                  background: nutritionPlan.plan_type === 'pdf' ? '#f3e8ff' : '#e0f2fe',
                  color: nutritionPlan.plan_type === 'pdf' ? '#7c3aed' : '#0369a1',
                }}>
                {nutritionPlan.plan_type === 'pdf' ? '📄 PDF Plan' : '🍽️ Structured Plan'}
              </span>
              {nutritionPlan.tracking_mode && (
                <span className="text-xs text-muted-foreground">
                  • {nutritionPlan.tracking_mode === 'macros' ? 'Macro Tracking' : 'Habit Mode'}
                </span>
              )}
            </div>
          </div>
          {nutritionPlan.plan_type === 'structured' && (
            <button
              onClick={() => navigate(`/nutrition`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-secondary transition-colors flex-shrink-0"
              title="Edit plan meals and structure"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Edit Plan
            </button>
          )}
        </div>
      </div>

      {/* Macro Targets — read-only */}
      {nutritionPlan.plan_type === 'structured' && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#94A3B8' }}>
            Macro Targets
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Calories', value: nutritionPlan.calories, unit: 'kcal', color: 'text-orange-600' },
              { label: 'Protein', value: nutritionPlan.protein_g, unit: 'g', color: 'text-blue-600' },
              { label: 'Carbs', value: nutritionPlan.carbs_g, unit: 'g', color: 'text-amber-600' },
              { label: 'Fats', value: nutritionPlan.fats_g, unit: 'g', color: 'text-red-500' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="rounded-lg p-3" style={{ background: '#f8f9fa' }}>
                <p className={`text-[10px] font-bold mb-1 ${color}`}>
                  {label} <span className="font-normal text-muted-foreground">({unit})</span>
                </p>
                <p className="text-base font-bold text-foreground">{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition Compliance */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
            Compliance Trends
          </h3>
          {recentCompliance !== null && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{
                background: recentCompliance >= 75 ? '#d1fae5' : recentCompliance >= 50 ? '#fef3c7' : '#fee2e2',
                color: recentCompliance >= 75 ? '#059669' : recentCompliance >= 50 ? '#d97706' : '#dc2626',
              }}>
              Avg: {recentCompliance}%
            </span>
          )}
        </div>
        <div className="flex items-end justify-around gap-2">
          {weeks.map((w, i) => {
            const pct = weekNutritionCompliance(checkIns, w.start, w.end);
            return (
              <Ring
                key={i}
                pct={pct}
                label={w.label}
                active={!!w.active}
                size={w.active ? 82 : 68}
              />
            );
          })}
        </div>
      </div>

      {/* PDF Viewer (if plan_type='pdf') */}
      {nutritionPlan.plan_type === 'pdf' && nutritionPlan.pdf_file_url && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <PDFViewer pdfUrl={nutritionPlan.pdf_file_url} fileName={`${nutritionPlan.title}.pdf`} />
        </div>
      )}

      {/* Info box for PDF plans */}
      {nutritionPlan.plan_type === 'pdf' && nutritionPlan.client_notes && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#0369a1' }}>
            Plan Summary
          </h3>
          <p className="text-xs text-blue-900 leading-relaxed">{nutritionPlan.client_notes}</p>
        </div>
      )}
    </div>
  );
}