import React, { useState } from 'react';
import { CheckSquare, Square, MessageSquare, ClipboardList, Dumbbell, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function DailyChecklist({ checkIns, messages, clients }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const pendingCheckIns = checkIns.filter(ci => {
    const daysSince = Math.floor((Date.now() - new Date(ci.date)) / 86400000);
    return daysSince <= 3;
  });

  const unreadMessages = messages;

  const clientsNoProgram = clients.filter(c => c.status === 'active' && !c.assigned_program_id).slice(0, 3);

  const allTasks = [
    ...pendingCheckIns.map(ci => ({
      id: `ci-${ci.id}`,
      label: `Review ${ci.client_name}'s check-in`,
      icon: ClipboardList,
      color: 'text-emerald-400',
      link: '/progress',
      category: 'check-in',
    })),
    ...unreadMessages.map(m => ({
      id: `msg-${m.id}`,
      label: `Reply to ${m.client_name}`,
      icon: MessageSquare,
      color: 'text-primary',
      link: '/messages',
      category: 'message',
    })),
    ...clientsNoProgram.map(c => ({
      id: `prog-${c.id}`,
      label: `Assign program to ${c.name}`,
      icon: Dumbbell,
      color: 'text-amber-400',
      link: '/programs',
      category: 'program',
    })),
  ].slice(0, 8);

  const [checked, setChecked] = useState({});
  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider">Daily Checklist</h2>
        </div>
        <span className="text-xs text-muted-foreground">{doneCount}/{allTasks.length} done</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-secondary rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: allTasks.length ? `${(doneCount / allTasks.length) * 100}%` : '0%' }}
        />
      </div>

      {allTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">All caught up for today! 🎉</p>
      ) : (
        <div className="space-y-2">
          {allTasks.map(task => (
            <button
              key={task.id}
              onClick={() => toggle(task.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-secondary/50 ${checked[task.id] ? 'opacity-50' : ''}`}
            >
              {checked[task.id]
                ? <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                : <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              }
              <task.icon className={`w-4 h-4 flex-shrink-0 ${task.color}`} />
              <span className={`text-sm flex-1 ${checked[task.id] ? 'line-through text-muted-foreground' : ''}`}>
                {task.label}
              </span>
              <Link
                to={task.link}
                onClick={e => e.stopPropagation()}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}