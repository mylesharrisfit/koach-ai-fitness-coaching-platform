import React, { useState } from 'react';
import { Sparkles, Loader2, BookOpen, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const TEMPLATES = [
  { label: 'Great Check-in', text: "Awesome check-in this week! Your consistency is really showing. Keep up the great work and let's build on this momentum! 💪" },
  { label: 'Motivation Boost', text: "Just wanted to say I'm proud of the effort you've been putting in. Some weeks are harder than others — keep showing up and the results will follow 🔥" },
  { label: 'Nutrition Reminder', text: "Quick reminder to stay on track with your nutrition targets this week. Even 80% compliance makes a huge difference over time. You've got this!" },
  { label: 'Missed Check-in', text: "Hey, I noticed you missed your check-in this week. Everything okay? Let me know if anything came up — I'm here to support you!" },
  { label: 'Training Adjustment', text: "I've reviewed your recent sessions and made some adjustments to your program. Check the updated plan and let me know if you have questions!" },
  { label: 'Weekly Win', text: "You crushed it this week! I saw real progress in your numbers. Let's keep that energy going into next week 🙌" },
];

export default function CheckInResponseBox({ checkIn, client, onSave, saving }) {
  const [reply, setReply] = useState(checkIn.notes || '');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [saved, setSaved] = useState(false);

  const generateAI = async () => {
    setAiLoading(true);
    setAiDraft('');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a fitness coach reviewing a weekly check-in for client "${client?.name || 'the client'}".
Check-in data:
- Weight: ${checkIn.weight || 'N/A'} lbs
- Body Fat: ${checkIn.body_fat_pct || 'N/A'}%
- Mood: ${checkIn.mood || 'N/A'}
- Sleep: ${checkIn.sleep_hours || 'N/A'} hours
- Training compliance: ${checkIn.compliance_training || 'N/A'}%
- Nutrition compliance: ${checkIn.compliance_nutrition || 'N/A'}%
- Client notes: ${checkIn.notes || 'None'}

Write a warm, personal, and motivating coach response (max 80 words). Acknowledge specific numbers, praise their effort, and give one actionable tip for next week.`,
    });
    setAiDraft(result);
    setAiLoading(false);
  };

  const handleSave = async () => {
    await onSave(reply);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Coach Response</p>
        <div className="flex gap-1.5">
          <div className="relative">
            <Button
              size="sm" variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={() => setShowTemplates(s => !s)}
            >
              <BookOpen className="w-3 h-3" /> Templates <ChevronDown className="w-3 h-3" />
            </Button>
            {showTemplates && (
              <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-xl shadow-xl p-2 w-64 max-h-60 overflow-y-auto">
                {TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => { setReply(t.text); setShowTemplates(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <p className="text-xs font-medium">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{t.text}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={generateAI} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-primary" />}
            AI Draft
          </Button>
        </div>
      </div>

      {aiDraft && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm text-foreground">
          <p className="text-xs text-primary font-medium mb-1.5 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Suggestion</p>
          {aiDraft}
          <div className="flex gap-2 mt-2.5">
            <Button size="sm" className="h-7 text-xs" onClick={() => { setReply(aiDraft); setAiDraft(''); }}>Use This</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAiDraft('')}>Dismiss</Button>
          </div>
        </div>
      )}

      <Textarea
        value={reply}
        onChange={e => setReply(e.target.value)}
        placeholder="Write your coaching response..."
        className="text-sm resize-none"
        rows={3}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saving || !reply.trim()} className="gap-1.5">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : null}
          {saved ? 'Saved!' : 'Save Response'}
        </Button>
      </div>
    </div>
  );
}