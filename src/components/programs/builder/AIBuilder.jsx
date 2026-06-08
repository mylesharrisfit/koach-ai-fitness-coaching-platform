import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import AIProfileStep from './steps/AIProfileStep';
import AIPreferencesStep from './steps/AIPreferencesStep';
import AIGeneratingStep from './steps/AIGeneratingStep';
import AIReviewStep from './steps/AIReviewStep';

const STEPS = ['profile', 'preferences', 'generating', 'review'];

export default function AIBuilder({ onBack, onProgramCreated }) {
  const [step, setStep] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [generatedProgram, setGeneratedProgram] = useState(null);
  const [rating, setRating] = useState(null);
  const [generateError, setGenerateError] = useState(null);

  const handleProfileSubmit = (profileData) => {
    setProfile(profileData);
    setStep('preferences');
  };

  const handlePreferencesSubmit = async (prefsData) => {
    setPreferences(prefsData);
    setStep('generating');
    await generateProgram(prefsData);
  };

  const generateProgram = async (prefs) => {
    try {
      setLoading(true);
      setGenerateError(null);
      const result = await base44.functions.invoke('generateAIProgram', {
        profile,
        preferences: prefs,
      });
      // Unwrap any extra nesting (belt + suspenders after backend fix)
      let program = result.data;
      if (program?.response) program = program.response;

      if (!program || program.error) {
        throw new Error(program?.error || 'Invalid program returned from AI');
      }
      // Resilient coercion — only fail if truly critical fields are absent
      if (!program.title) program.title = 'AI Generated Program';
      if (!Array.isArray(program.workouts) || program.workouts.length === 0) {
        throw new Error('AI did not return any workout days. Please try again.');
      }
      // Ensure every exercise has minimum required fields
      program.workouts = program.workouts.map((w, wi) => ({
        ...w,
        day_number: w.day_number ?? wi + 1,
        exercises: (w.exercises || []).map(ex => ({
          ...ex,
          sets: ex.sets ?? 3,
          reps: ex.reps ?? '8-12',
          section: ex.section || 'main',
        })),
      }));
      setGeneratedProgram(program);
      setStep('review');
    } catch (error) {
      setGenerateError(error.message || 'Failed to generate program');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async (editedProgram) => {
    try {
      setLoading(true);
      const dataToSave = editedProgram || generatedProgram;
      const newProgram = await base44.entities.WorkoutProgram.create({
        ...dataToSave,
        is_template: false,
        is_ai_generated: true,
      });
      toast.success('Program created!');
      onProgramCreated(newProgram);
    } catch (error) {
      toast.error('Failed to save program');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="hover:bg-accent rounded-lg p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-heading text-xl">Build with AI</h2>
          <p className="text-sm text-muted-foreground">
            {{
              profile: 'Step 1 of 4 — Client Profile',
              preferences: 'Step 2 of 4 — Program Settings',
              generating: 'Step 3 of 4 — Generating',
              review: 'Step 4 of 4 — Review & Save',
            }[step]}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 h-1">
        {STEPS.map((s) => (
          <div
            key={s}
            className={`flex-1 rounded-full transition-colors ${
              STEPS.indexOf(s) <= STEPS.indexOf(step) ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {step === 'profile' && (
          <AIProfileStep key="profile" onSubmit={handleProfileSubmit} />
        )}
        {step === 'preferences' && (
          <AIPreferencesStep
            key="prefs"
            profile={profile}
            onSubmit={handlePreferencesSubmit}
            isLoading={loading}
          />
        )}
        {step === 'generating' && (
          <AIGeneratingStep
            key="gen"
            error={generateError}
            onRetry={() => {
              setGenerateError(null);
              generateProgram(preferences);
            }}
            onBack={() => setStep('preferences')}
          />
        )}
        {step === 'review' && generatedProgram && (
          <AIReviewStep
            key="review"
            program={generatedProgram}
            onSave={handleSaveProgram}
            onRegenerate={() => {
              setStep('generating');
              generateProgram(preferences);
            }}
            onRating={setRating}
            currentRating={rating}
            isSaving={loading}
          />
        )}

      </AnimatePresence>
    </div>
  );
}