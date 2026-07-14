import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ClientPickerStep from './assignment/ClientPickerStep';
import ProgramSettingsStep from './assignment/ProgramSettingsStep';
import NotificationsStep from './assignment/NotificationsStep';
import ReviewStep from './assignment/ReviewStep';
import SmartSuggestions from './assignment/SmartSuggestions';

const STEPS = [
  { id: 1, label: 'Select Client', title: 'Who would you like to assign this to?' },
  { id: 2, label: 'Program Settings', title: 'Configure program details' },
  { id: 3, label: 'Notifications & Kickoff', title: 'Set up notifications and schedule kickoff' },
  { id: 4, label: 'Review & Assign', title: 'Review and confirm assignment' }
];

export default function ProgramAssignmentModal({ 
  open, 
  onOpenChange, 
  program, 
  allClients, 
  onAssign 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClients, setSelectedClients] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [repeatProgram, setRepeatProgram] = useState(false);
  const [pace, setPace] = useState('standard');
  const [customMessage, setCustomMessage] = useState('');
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [notifyClient, setNotifyClient] = useState(true);
  const [scheduleKickoff, setScheduleKickoff] = useState(false);
  const [kickoffSession, setKickoffSession] = useState(null);

  // Draft auto-save
  useEffect(() => {
    if (!program) return;
    if (selectedClients.length > 0 || customMessage) {
      const draft = {
        selectedClients,
        startDate,
        repeatProgram,
        pace,
        customMessage,
        showCustomMessage,
        notifyClient,
        scheduleKickoff,
        kickoffSession,
        currentStep,
      };
      localStorage.setItem(`assignment_draft_${program.id}`, JSON.stringify(draft));
    }
  }, [selectedClients, startDate, repeatProgram, pace, customMessage, showCustomMessage, notifyClient, scheduleKickoff, kickoffSession, currentStep, program]);

  // Load draft on mount
  useEffect(() => {
    if (!program) return;
    const draft = localStorage.getItem(`assignment_draft_${program.id}`);
    if (draft) {
      try {
        const data = JSON.parse(draft);
        setSelectedClients(data.selectedClients);
        setStartDate(data.startDate);
        setRepeatProgram(data.repeatProgram);
        setPace(data.pace);
        setCustomMessage(data.customMessage);
        setShowCustomMessage(data.showCustomMessage);
        setNotifyClient(data.notifyClient);
        setScheduleKickoff(data.scheduleKickoff);
        setKickoffSession(data.kickoffSession);
        setCurrentStep(data.currentStep);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [program, open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAssign = async () => {
    await onAssign({
      selectedClients,
      startDate,
      repeatProgram,
      pace,
      customMessage: showCustomMessage ? customMessage : null,
      notifyClient,
      kickoffSession: scheduleKickoff ? kickoffSession : null,
    });
    
    // Clear draft
    if (program) {
      localStorage.removeItem(`assignment_draft_${program.id}`);
    }
    handleClose();
  };

  const isStep1Valid = selectedClients.length > 0;
  const isStep2Valid = true;
  const isStep3Valid = !scheduleKickoff || kickoffSession;

  const canProceed = {
    1: isStep1Valid,
    2: isStep2Valid,
    3: isStep3Valid,
    4: true,
  }[currentStep];

  if (!program) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold">Assign {program.title}</h2>
            <div className="flex gap-2">
              {program.difficulty && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-warning/10 text-warning">
                  {program.difficulty.charAt(0).toUpperCase() + program.difficulty.slice(1)}
                </span>
              )}
              {program.category && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-accent text-primary">
                  {program.category}
                </span>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-2">
            {STEPS.map((step) => (
              <div key={step.id} className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                    currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : currentStep > step.id
                      ? 'bg-success/10 text-success'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </button>
                {step.id < 4 && <div className="w-2 h-0.5 bg-border" />}
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mt-3">
            {STEPS[currentStep - 1].title}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && (
                <ClientPickerStep
                  selectedClients={selectedClients}
                  onSelectClients={setSelectedClients}
                  allClients={allClients}
                />
              )}

              {currentStep === 2 && (
                <ProgramSettingsStep
                  startDate={startDate}
                  onStartDateChange={setStartDate}
                  repeatProgram={repeatProgram}
                  onRepeatChange={setRepeatProgram}
                  pace={pace}
                  onPaceChange={setPace}
                  showCustomMessage={showCustomMessage}
                  onShowCustomMessageChange={setShowCustomMessage}
                  customMessage={customMessage}
                  onCustomMessageChange={setCustomMessage}
                />
              )}

              {currentStep === 3 && (
                <NotificationsStep
                  notifyClient={notifyClient}
                  onNotifyClientChange={setNotifyClient}
                  program={program}
                  customMessage={showCustomMessage ? customMessage : null}
                  startDate={startDate}
                  selectedClients={selectedClients}
                  scheduleKickoff={scheduleKickoff}
                  onScheduleKickoffChange={setScheduleKickoff}
                  kickoffSession={kickoffSession}
                  onKickoffSessionChange={setKickoffSession}
                  allClients={allClients}
                />
              )}

              {currentStep === 4 && (
                <ReviewStep
                  selectedClients={selectedClients}
                  program={program}
                  startDate={startDate}
                  repeatProgram={repeatProgram}
                  pace={pace}
                  customMessage={showCustomMessage ? customMessage : null}
                  notifyClient={notifyClient}
                  kickoffSession={scheduleKickoff ? kickoffSession : null}
                  allClients={allClients}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Smart Suggestions */}
          <SmartSuggestions
            selectedClients={selectedClients}
            program={program}
            allClients={allClients}
          />
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-6 flex gap-3 justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <button
              onClick={handleClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="gap-2"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleAssign}
              className="bg-gradient-to-r from-primary to-primary hover:opacity-90 gap-2"
            >
              Assign Program
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}