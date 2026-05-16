import React, { useState } from 'react';
import { X, Target, Flame, BarChart3, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import ProgramDetailHeader from './tabs/ProgramDetailHeader';
import ProgramOverviewTab from './tabs/ProgramOverviewTab';
import ProgramWeeklyScheduleTab from './tabs/ProgramWeeklyScheduleTab';
import ProgramExercisesTab from './tabs/ProgramExercisesTab';
import ProgramAssignedClientsPanel from './sidebar/ProgramAssignedClientsPanel';
import ProgramStatsPanel from './sidebar/ProgramStatsPanel';

const DIFFICULTY_COLORS = {
  beginner: 'from-emerald-600 to-emerald-700',
  intermediate: 'from-blue-600 to-blue-700',
  advanced: 'from-purple-600 to-purple-700',
  elite: 'from-red-600 to-red-700',
};

const TAB_LIST = [
  { id: 'overview', label: 'Overview' },
  { id: 'schedule', label: 'Weekly Schedule' },
  { id: 'exercises', label: 'Exercises' },
];

export default function ProgramDetailModal({
  program,
  assignedClients = [],
  allClients = [],
  onClose,
  onAssign,
  onEdit,
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const gradientClass = DIFFICULTY_COLORS[program.difficulty] || DIFFICULTY_COLORS.intermediate;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className={cn('bg-gradient-to-r', gradientClass, 'text-white p-6 sm:p-8')}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">{program.title}</h2>
              {program.description && (
                <p className="text-white/80 text-sm sm:text-base max-w-2xl">{program.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors ml-4 flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/20">
            {program.duration_weeks && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/60" />
                <div>
                  <div className="text-xs text-white/60">Duration</div>
                  <div className="font-semibold">{program.duration_weeks} weeks</div>
                </div>
              </div>
            )}
            {program.days_per_week && (
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-white/60" />
                <div>
                  <div className="text-xs text-white/60">Frequency</div>
                  <div className="font-semibold">{program.days_per_week}x / week</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-white/60" />
              <div>
                <div className="text-xs text-white/60">Rest Days</div>
                <div className="font-semibold">{7 - (program.days_per_week || 0)} / week</div>
              </div>
            </div>
            {program.difficulty && (
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-white/60" />
                <div>
                  <div className="text-xs text-white/60">Level</div>
                  <div className="font-semibold capitalize">{program.difficulty}</div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={onAssign}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
            >
              Assign to Client
            </Button>
            <Button
              onClick={onEdit}
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Edit Program
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tab Navigation */}
          <div className="flex gap-1 px-6 sm:px-8 pt-4 border-b border-[#E7EAF3] overflow-x-auto">
            {TAB_LIST.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'pb-3 px-2 text-sm font-semibold transition-colors relative whitespace-nowrap',
                  activeTab === tab.id
                    ? 'text-[#1F2A44]'
                    : 'text-[#6B7280] hover:text-[#4B5563]'
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content with Two-Column Layout */}
          <div className="flex-1 overflow-hidden flex">
            {/* Main Content (70%) */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProgramOverviewTab program={program} />
                  </motion.div>
                )}
                {activeTab === 'schedule' && (
                  <motion.div
                    key="schedule"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProgramWeeklyScheduleTab program={program} />
                  </motion.div>
                )}
                {activeTab === 'exercises' && (
                  <motion.div
                    key="exercises"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProgramExercisesTab program={program} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar (30%) */}
            <div className="hidden lg:flex lg:w-[30%] flex-col border-l border-[#E7EAF3] overflow-y-auto bg-[#FAFBFC]">
              <div className="p-6 space-y-6">
                <ProgramAssignedClientsPanel
                  assignedClients={assignedClients}
                  allClients={allClients}
                  programId={program.id}
                  onAssign={onAssign}
                />
                <ProgramStatsPanel program={program} assignedClients={assignedClients} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Sidebar (below modal on small screens) */}
      <div className="lg:hidden hidden absolute bottom-0 left-0 right-0 bg-[#FAFBFC] border-t border-[#E7EAF3] p-4 space-y-4 max-h-[30vh] overflow-y-auto">
        <ProgramAssignedClientsPanel
          assignedClients={assignedClients}
          allClients={allClients}
          programId={program.id}
          onAssign={onAssign}
        />
        <ProgramStatsPanel program={program} assignedClients={assignedClients} />
      </div>
    </div>
  );
}