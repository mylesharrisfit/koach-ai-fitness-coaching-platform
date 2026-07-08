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
      <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-gray-100 flex-shrink-0 bg-white">
        {[
          { key: 'program', label: 'Training Program', icon: Dumbbell },
          { key: 'nutrition', label: 'Meal Plan', icon: Salad },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all"
            style={{
              borderBottomColor: activeTab === key ? '#2563EB' : 'transparent',
              color: activeTab === key ? '#2563EB' : '#6B7280',
            }}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ background: '#f8f9fa' }}>
        {activeTab === 'program' && (
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
            {/* Program header */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                {editingTitle ? (
                  <input
                    autoFocus
                    value={programTitle}
                    onChange={e => setProgramTitle(e.target.value)}
                    onBlur={() => setEditingTitle(false)}
                    onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
                    className="flex-1 text-base font-bold text-gray-900 border-b-2 border-blue-400 outline-none bg-transparent"
                  />
                ) : (
                  <h3 className="text-base font-bold text-gray-900 flex-1">{programTitle}</h3>
                )}
                <button onClick={() => setEditingTitle(t => !t)} className="text-gray-400 hover:text-blue-500">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-3">{program.description}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: program.difficulty, color: '#7C3AED', bg: '#f5f3ff' },
                  { label: `${program.duration_weeks}w`, color: '#2563EB', bg: '#eff6ff' },
                  { label: `${program.days_per_week}x/week`, color: '#059669', bg: '#f0fdf4' },
                  { label: program.category, color: '#D97706', bg: '#fffbeb' },
                ].map((tag, i) => (
                  <span key={i} className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: tag.bg, color: tag.color }}>{tag.label}</span>
                ))}
              </div>
              {program.coach_rationale && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">AI Rationale</p>
                  <p className="text-xs text-gray-500 italic">{program.coach_rationale.split}</p>
                </div>
              )}
            </div>

            {/* Workouts */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Training Days ({program.workouts?.length || 0})
              </p>
              {(program.workouts || []).map((workout, di) => (
                <div key={di} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setExpandedDay(expandedDay === di ? -1 : di)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-800">{workout.day_name}</p>
                      {workout.workout_notes && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{workout.workout_notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-gray-400">{workout.exercises?.length || 0} exercises</span>
                      {expandedDay === di ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {expandedDay === di && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {(workout.exercises || []).map((ex, ei) => (
                        <div key={ei} className="px-5 py-3 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-800 truncate">{ex.name}</p>
                              {ex.section && ex.section !== 'main' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                                  style={{ background: '#f0fdf4', color: '#059669' }}>{ex.section}</span>
                              )}
                            </div>
                            {ex.notes && <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{ex.notes}</p>}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-xs font-bold text-gray-700">{ex.sets} × {ex.reps}</p>
                            {ex.rpe && <p className="text-[10px] text-gray-400">RPE {ex.rpe}</p>}
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
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-base font-bold text-gray-900 mb-1">{client.name} — AI Meal Plan</h3>
              {coachNotes.why_these_calories && (
                <p className="text-sm text-gray-500 mb-3">{coachNotes.why_these_calories}</p>
              )}
              {mealPlan?.weekly_overview && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { label: 'Avg Daily', value: `${mealPlan.weekly_overview.avg_daily_calories} kcal` },
                    { label: 'Training days', value: mealPlan.weekly_overview.training_days },
                    { label: 'Weekly protein', value: `${mealPlan.weekly_overview.weekly_protein_target}g` },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-3 rounded-xl" style={{ background: '#f8f9fa' }}>
                      <p className="text-base font-bold text-gray-800">{s.value}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Training day meals */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Training Day Meals ({trainingMeals.length})
              </p>
              {trainingMeals.map((meal, mi) => (
                <div key={mi} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{meal.name}</p>
                      <p className="text-[11px] text-gray-400">{meal.time}</p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-sm font-bold text-gray-700">{meal.calories} kcal</p>
                        <p className="text-[10px] text-gray-400">P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fats}g</p>
                      </div>
                    </div>
                  </div>
                  {(meal.foods || []).length > 0 && (
                    <div className="space-y-1 mt-2 pt-2 border-t border-gray-50">
                      {meal.foods.map((food, fi) => (
                        <div key={fi} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{food.name}</span>
                          <span className="text-gray-400">{food.amount_household || `${food.amount}${food.unit}`}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {coachNotes.first_2_weeks && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">First 2 Weeks</p>
                <p className="text-xs text-blue-700">{coachNotes.first_2_weeks}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approve footer */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 bg-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Edit Questionnaire
        </button>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-400 hidden sm:block">Review both tabs, then approve to save</p>
          <button
            onClick={handleApprove}
            disabled={saving}
            className="flex items-center gap-2 text-sm font-bold text-white px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
            style={{ background: saving ? '#9CA3AF' : 'linear-gradient(135deg, #059669, #2563EB)' }}
          >
            <CheckCircle className="w-4 h-4" />
            {saving ? 'Saving…' : 'Approve & Save to Client'}
          </button>
        </div>
      </div>
    </div>
  );
}