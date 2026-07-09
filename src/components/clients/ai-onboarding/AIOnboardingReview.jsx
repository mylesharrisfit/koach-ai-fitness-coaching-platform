import React, { useState } from 'react';
import { ChevronLeft, CheckCircle, Dumbbell, Salad, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';

export default function AIOnboardingReview({ client, program: initialProgram, mealPlan: initialMealPlan, onApprove, onBack }) {
  const [program, setProgram] = useState(initialProgram);
  const [mealPlan, setMealPlan] = useState(initialMealPlan);
  const [activeTab, setActiveTab] = useState('program');
  const [saving, setSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [programTitle, setProgramTitle] = useState(initialProgram?.title || '');

  const handleApprove = async () => {
    setSaving(true);
    const finalProgram = { ...program, title: programTitle };
    await onApprove(finalProgram, mealPlan);
    setSaving(false);
  };

  const trainingMeals = mealPlan?.training_day?.meals || mealPlan?.meals || [];
  const coachNotes = mealPlan?.coach_notes || {};

  return (
    <div className="h-full flex flex-col">
      {/* Sub-nav */}
      <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-border flex-shrink-0 bg-card">
        {[
          { key: 'program', label: 'Training Program', icon: Dumbbell },
          { key: 'nutrition', label: 'Meal Plan', icon: Salad },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all"
            style={{
              borderBottomColor: activeTab === key ? 'rgb(var(--primary))' : 'transparent',
              color: activeTab === key ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))',
            }}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ background: 'rgb(var(--muted))' }}>
        {activeTab === 'program' && (
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
            {/* Program header */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                {editingTitle ? (
                  <input
                    autoFocus
                    value={programTitle}
                    onChange={e => setProgramTitle(e.target.value)}
                    onBlur={() => setEditingTitle(false)}
                    onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
                    className="flex-1 text-base font-bold text-foreground border-b-2 border-primary outline-none bg-transparent"
                  />
                ) : (
                  <h3 className="text-base font-bold text-foreground flex-1">{programTitle}</h3>
                )}
                <button onClick={() => setEditingTitle(t => !t)} className="text-muted-foreground hover:text-primary">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{program.description}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: program.difficulty, color: 'rgb(var(--ai))', bg: 'rgb(var(--ai))' },
                  { label: `${program.duration_weeks}w`, color: 'rgb(var(--primary))', bg: 'rgb(var(--accent))' },
                  { label: `${program.days_per_week}x/week`, color: 'rgb(var(--success))', bg: 'rgb(var(--success))' },
                  { label: program.category, color: 'rgb(var(--warning))', bg: 'rgb(var(--warning))' },
                ].map((tag, i) => (
                  <span key={i} className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: tag.bg, color: tag.color }}>{tag.label}</span>
                ))}
              </div>
              {program.coach_rationale && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">AI Rationale</p>
                  <p className="text-xs text-muted-foreground italic">{program.coach_rationale.split}</p>
                </div>
              )}
            </div>

            {/* Workouts */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Training Days ({program.workouts?.length || 0})
              </p>
              {(program.workouts || []).map((workout, di) => (
                <div key={di} className="bg-card rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedDay(expandedDay === di ? -1 : di)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">{workout.day_name}</p>
                      {workout.workout_notes && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{workout.workout_notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-muted-foreground">{workout.exercises?.length || 0} exercises</span>
                      {expandedDay === di ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {expandedDay === di && (
                    <div className="border-t border-border divide-y divide-muted">
                      {(workout.exercises || []).map((ex, ei) => (
                        <div key={ei} className="px-5 py-3 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground truncate">{ex.name}</p>
                              {ex.section && ex.section !== 'main' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                                  style={{ background: 'rgb(var(--success))', color: 'rgb(var(--success))' }}>{ex.section}</span>
                              )}
                            </div>
                            {ex.notes && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{ex.notes}</p>}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-xs font-bold text-foreground">{ex.sets} × {ex.reps}</p>
                            {ex.rpe && <p className="text-[10px] text-muted-foreground">RPE {ex.rpe}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
            {/* Meal plan header */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-base font-bold text-foreground mb-1">{client.name} — AI Meal Plan</h3>
              {coachNotes.why_these_calories && (
                <p className="text-sm text-muted-foreground mb-3">{coachNotes.why_these_calories}</p>
              )}
              {mealPlan?.weekly_overview && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { label: 'Avg Daily', value: `${mealPlan.weekly_overview.avg_daily_calories} kcal` },
                    { label: 'Training days', value: mealPlan.weekly_overview.training_days },
                    { label: 'Weekly protein', value: `${mealPlan.weekly_overview.weekly_protein_target}g` },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-3 rounded-xl" style={{ background: 'rgb(var(--muted))' }}>
                      <p className="text-base font-bold text-foreground">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Training day meals */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Training Day Meals ({trainingMeals.length})
              </p>
              {trainingMeals.map((meal, mi) => (
                <div key={mi} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">{meal.name}</p>
                      <p className="text-[11px] text-muted-foreground">{meal.time}</p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-sm font-bold text-foreground">{meal.calories} kcal</p>
                        <p className="text-[10px] text-muted-foreground">P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fats}g</p>
                      </div>
                    </div>
                  </div>
                  {(meal.foods || []).length > 0 && (
                    <div className="space-y-1 mt-2 pt-2 border-t border-border">
                      {meal.foods.map((food, fi) => (
                        <div key={fi} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{food.name}</span>
                          <span className="text-muted-foreground">{food.amount_household || `${food.amount}${food.unit}`}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {coachNotes.first_2_weeks && (
              <div className="bg-accent border border-accent rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">First 2 Weeks</p>
                <p className="text-xs text-primary">{coachNotes.first_2_weeks}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approve footer */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-border bg-card">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg border border-border bg-card transition-colors">
          <ChevronLeft className="w-4 h-4" /> Edit Questionnaire
        </button>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground hidden sm:block">Review both tabs, then approve to save</p>
          <button
            onClick={handleApprove}
            disabled={saving}
            className="flex items-center gap-2 text-sm font-bold text-white px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
            style={{ background: saving ? 'rgb(var(--muted-foreground))' : 'linear-gradient(135deg, rgb(var(--success)), rgb(var(--primary)))' }}
          >
            <CheckCircle className="w-4 h-4" />
            {saving ? 'Saving…' : 'Approve & Save to Client'}
          </button>
        </div>
      </div>
    </div>
  );
}