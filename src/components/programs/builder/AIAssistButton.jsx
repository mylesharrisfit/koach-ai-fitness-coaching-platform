import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function AIAssistButton({
  onSuggestExercises,
  onGenerateProgram,
  onCheckBalance,
  onAddProgression,
}) {
  const [open, setOpen] = useState(false);

  const handleAction = (callback) => {
    callback();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="fixed bottom-6 right-6 flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all z-40"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">AI Assist</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <div className="space-y-2">
          <button
            onClick={() => handleAction(onSuggestExercises)}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#F6F7FB] transition-colors text-sm"
          >
            <p className="font-semibold text-[#1F2A44]">Suggest exercises</p>
            <p className="text-xs text-[#9CA3AF]">Based on day focus</p>
          </button>
          <button
            onClick={() => handleAction(onGenerateProgram)}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#F6F7FB] transition-colors text-sm"
          >
            <p className="font-semibold text-[#1F2A44]">Generate rest</p>
            <p className="text-xs text-[#9CA3AF]">Fill remaining weeks</p>
          </button>
          <button
            onClick={() => handleAction(onCheckBalance)}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#F6F7FB] transition-colors text-sm"
          >
            <p className="font-semibold text-[#1F2A44]">Check balance</p>
            <p className="text-xs text-[#9CA3AF]">Muscle imbalances</p>
          </button>
          <button
            onClick={() => handleAction(onAddProgression)}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#F6F7FB] transition-colors text-sm"
          >
            <p className="font-semibold text-[#1F2A44]">Add progression</p>
            <p className="text-xs text-[#9CA3AF]">Auto progressive overload</p>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}