import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

const BLANK = {
  title: '', description: '', long_description: '', price: '', original_price: '',
  category: 'workout', difficulty: 'all_levels', duration_weeks: '', image_url: '',
  features: [], is_published: true,
};

export default function ProductFormModal({ open, onClose, editing, onCreate, onUpdate }) {
  const [form, setForm] = useState(BLANK);
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    if (editing) setForm({ ...BLANK, ...editing, price: editing.price || '', original_price: editing.original_price || '', duration_weeks: editing.duration_weeks || '' });
    else setForm(BLANK);
    setFeatureInput('');
  }, [editing, open]);

  const addFeature = () => {
    if (featureInput.trim() && (form.features?.length || 0) < 5) {
      setForm(f => ({ ...f, features: [...(f.features || []), featureInput.trim()] }));
      setFeatureInput('');
    }
  };

  const removeFeature = (idx) => setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, price: Number(form.price), original_price: Number(form.original_price) || undefined, duration_weeks: Number(form.duration_weeks) || undefined };
    if (editing) onUpdate(editing.id, data);
    else onCreate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#111827] font-semibold">{editing ? 'Edit Product' : 'Create Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs font-semibold text-[#374151]">Product Name *</Label>
            <Input className="mt-1" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required placeholder="e.g. 12-Week Fat Loss Program" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#374151]">Short Description</Label>
            <Input className="mt-1" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="One-line summary" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#374151]">Full Description</Label>
            <Textarea className="mt-1" value={form.long_description} onChange={e => setForm(f => ({...f, long_description: e.target.value}))} rows={3} placeholder="Detailed description…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-[#374151]">Price ($) *</Label>
              <Input className="mt-1" type="number" min="0" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} required placeholder="79" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#374151]">Original Price ($)</Label>
              <Input className="mt-1" type="number" min="0" value={form.original_price} onChange={e => setForm(f => ({...f, original_price: e.target.value}))} placeholder="99 (optional)" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#374151]">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="workout">Workout</SelectItem>
                  <SelectItem value="nutrition">Nutrition</SelectItem>
                  <SelectItem value="coaching">Coaching</SelectItem>
                  <SelectItem value="bundle">Bundle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#374151]">Difficulty</Label>
              <Select value={form.difficulty} onValueChange={v => setForm(f => ({...f, difficulty: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="all_levels">All Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#374151]">Duration (weeks)</Label>
              <Input className="mt-1" type="number" min="1" value={form.duration_weeks} onChange={e => setForm(f => ({...f, duration_weeks: e.target.value}))} placeholder="12" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#374151]">Image URL</Label>
              <Input className="mt-1" value={form.image_url} onChange={e => setForm(f => ({...f, image_url: e.target.value}))} placeholder="https://…" />
            </div>
          </div>

          {/* Feature bullets */}
          <div>
            <Label className="text-xs font-semibold text-[#374151]">Feature Bullets (up to 5)</Label>
            <div className="flex gap-2 mt-1">
              <Input value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder="e.g. 5x per week training" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())} />
              <Button type="button" variant="outline" size="sm" onClick={addFeature} disabled={(form.features?.length || 0) >= 5}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            {(form.features?.length > 0) && (
              <div className="mt-2 space-y-1.5">
                {form.features.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                    <span className="text-xs text-[#374151]">{f}</span>
                    <button type="button" onClick={() => removeFeature(i)} className="text-[#9CA3AF] hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 py-1">
            <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({...f, is_published: v}))} />
            <Label className="text-sm text-[#374151]">Published</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-[#111827] hover:bg-black text-white">
              {editing ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}