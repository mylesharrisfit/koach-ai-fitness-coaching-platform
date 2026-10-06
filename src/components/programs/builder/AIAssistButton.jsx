import React, { useState } from 'react';
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
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/85"
        >
          <span className="hidden sm:inline">AI Assist</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <div className="space-y-2">
          <button
            onClick={() => handleAction(onSuggestExercises)}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm"
          >
            <p className="font-semibold text-foreground">Suggest exercises</p>
            <p className="text-xs text-muted-foreground">Based on day focus</p>
          </button>
          <button
            onClick={() => handleAction(onGenerateProgram)}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm"
          >
            <p className="font-semibold text-foreground">Generate rest</p>
            <p className="text-xs text-muted-foreground">Fill remaining weeks</p>
          </button>
          <button
            onClick={() => handleAction(onCheckBalance)}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm"
          >
            <p className="font-semibold text-foreground">Check balance</p>
            <p className="text-xs text-muted-foreground">Muscle imbalances</p>
          </button>
          <button
            onClick={() => handleAction(onAddProgression)}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm"
          >
            <p className="font-semibold text-foreground">Add progression</p>
            <p className="text-xs text-muted-foreground">Auto progressive overload</p>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}