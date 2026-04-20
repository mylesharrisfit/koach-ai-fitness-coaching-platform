import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const MOOD_OPTIONS = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
  { value: 'stressed', emoji: '😰', label: 'Stressed' },
];

function ScaleSelector({ value, onChange, low, high }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            'flex-1 h-11 rounded-xl text-sm font-bold border-2 transition-all active:scale-95',
            value === n
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/40'
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function SliderInput({ value, onChange, label }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm font-bold text-primary">{value ?? '–'}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value ?? 70}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

export default function CheckInSubmitForm({ clientId, clientName, onSuccess }) {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [form, setForm] = useState({
    weight: '',
    sleep_hours: '',
    mood: '',
    energy_level: null,
    stress_level: null,
    compliance_training: 70,
    compliance_nutrition: 70,
    notes: '',
    photo_urls: [],
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingPhotos(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    set('photo_urls', [...form.photo_urls, ...urls]);
    setUploadingPhotos(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.CheckIn.create({
      client_id: clientId,
      client_name: clientName,
      date: format(new Date(), 'yyyy-MM-dd'),
      weight: form.weight ? Number(form.weight) : undefined,
      sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : undefined,
      mood: form.mood || undefined,
      energy_level: form.energy_level ?? undefined,
      stress_level: form.stress_level ?? undefined,
      compliance_training: form.compliance_training,
      compliance_nutrition: form.compliance_nutrition,
      notes: form.notes || undefined,
      photo_urls: form.photo_urls.length ? form.photo_urls : undefined,
    });
    setSaving(false);
    setSubmitted(true);
    onSuccess?.();
    toast.success('Check-in submitted!');
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-xl font-heading font-bold">Check-in Submitted!</h2>
        <p className="text-muted-foreground text-sm max-w-xs">Your coach has been notified. Keep up the great work!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7 max-w-lg mx-auto">
      {/* Weight */}
      <div>
        <label className="text-sm font-semibold block mb-2">⚖️ Current Weight (lbs)</label>
        <Input
          type="number"
          placeholder="e.g. 175"
          value={form.weight}
          onChange={e => set('weight', e.target.value)}
          className="h-12 text-base"
        />
      </div>

      {/* Sleep */}
      <div>
        <label className="text-sm font-semibold block mb-2">😴 Sleep Last Night (hours)</label>
        <Input
          type="number"
          step="0.5"
          placeholder="e.g. 7.5"
          value={form.sleep_hours}
          onChange={e => set('sleep_hours', e.target.value)}
          className="h-12 text-base"
        />
      </div>

      {/* Mood */}
      <div>
        <label className="text-sm font-semibold block mb-3">😊 How are you feeling?</label>
        <div className="grid grid-cols-5 gap-2">
          {MOOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('mood', opt.value)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all active:scale-95',
                form.mood === opt.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary/40 hover:border-primary/30'
              )}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-[10px] font-medium text-muted-foreground">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy */}
      <div>
        <label className="text-sm font-semibold block mb-3">⚡ Energy Level <span className="text-muted-foreground font-normal">(1 = exhausted, 5 = energized)</span></label>
        <ScaleSelector value={form.energy_level} onChange={v => set('energy_level', v)} />
      </div>

      {/* Stress */}
      <div>
        <label className="text-sm font-semibold block mb-3">🧠 Stress Level <span className="text-muted-foreground font-normal">(1 = calm, 5 = very stressed)</span></label>
        <ScaleSelector value={form.stress_level} onChange={v => set('stress_level', v)} />
      </div>

      {/* Training compliance */}
      <SliderInput
        value={form.compliance_training}
        onChange={v => set('compliance_training', v)}
        label="💪 Training Compliance"
      />

      {/* Nutrition compliance */}
      <SliderInput
        value={form.compliance_nutrition}
        onChange={v => set('compliance_nutrition', v)}
        label="🥗 Nutrition Compliance"
      />

      {/* Photos */}
      <div>
        <label className="text-sm font-semibold block mb-2">📸 Progress Photos (optional)</label>
        <label className={cn(
          'flex items-center justify-center gap-2 h-14 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
          uploadingPhotos ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/40 bg-secondary/30'
        )}>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
          {uploadingPhotos ? (
            <><Loader2 className="w-4 h-4 animate-spin text-primary" /><span className="text-sm text-muted-foreground">Uploading...</span></>
          ) : (
            <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">{form.photo_urls.length > 0 ? `${form.photo_urls.length} photo(s) added` : 'Tap to add photos'}</span></>
          )}
        </label>
        {form.photo_urls.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {form.photo_urls.map((url, i) => (
              <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-border" />
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-semibold block mb-2">📝 Notes, wins, or struggles</label>
        <Textarea
          placeholder="Share anything on your mind — how you're feeling, what's working, what's been tough..."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={4}
          className="text-base resize-none"
        />
      </div>

      <Button type="submit" className="w-full h-14 text-base font-bold" disabled={saving || uploadingPhotos}>
        {saving ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Submitting...</> : 'Submit Check-in ✓'}
      </Button>
    </form>
  );
}