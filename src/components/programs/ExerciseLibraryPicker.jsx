import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Play, Dumbbell, Star, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MUSCLE_COLORS = {
  chest: 'bg-red-50 text-red-600', back: 'bg-emerald-50 text-emerald-700',
  shoulders: 'bg-purple-50 text-purple-700', biceps: 'bg-blue-50 text-blue-700',
  triceps: 'bg-blue-50 text-blue-700', legs: 'bg-orange-50 text-orange-700',
  glutes: 'bg-orange-50 text-orange-700', core: 'bg-amber-50 text-amber-700',
  full_body: 'bg-indigo-50 text-indigo-700', cardio: 'bg-teal-50 text-teal-700',
};

const MUSCLES = ['all', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'full_body', 'cardio'];
const EQUIPMENT = ['all', 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'resistance_band', 'trx'];
const PATTERNS = ['all', 'push', 'pull', 'hinge', 'squat', 'carry', 'rotation', 'isometric', 'cardio'];

const defaultNewEx = { name: '', muscle_group: 'chest', equipment: 'barbell', movement_pattern: 'push', video_url: '', thumbnail_url: '', description: '', is_coach_branded: true };

export default function ExerciseLibraryPicker({ open, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('all');
  const [equipment, setEquipment] = useState('all');
  const [pattern, setPattern] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newEx, setNewEx] = useState(defaultNewEx);
  const queryClient = useQueryClient();

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.ExerciseLibrary.list('-created_date', 300),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ExerciseLibrary.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setNewEx(defaultNewEx);
      setShowAdd(false);
      toast.success('Exercise saved to library!');
    },
  });

  const filtered = exercises.filter(ex => {
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = muscle === 'all' || ex.muscle_group === muscle;
    const matchEquip = equipment === 'all' || ex.equipment === equipment;
    const matchPattern = pattern === 'all' || ex.movement_pattern === pattern;
    return matchSearch && matchMuscle && matchEquip && matchPattern;
  });

  const FilterPill = ({ value, current, onSet, label }) => (
    <button onClick={() => onSet(value === current ? 'all' : value)}
      className={cn('px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all whitespace-nowrap capitalize',
        current === value ? 'bg-primary text-white border-transparent' : 'bg-white text-[#374151] border-[#E7EAF3] hover:border-primary/40')}>
      {label || value.replace('_', ' ')}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl gap-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-[#E7EAF3] flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <DialogTitle className="text-base font-bold text-[#1F2A44]">Exercise Library</DialogTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(v => !v)} className="gap-1.5 text-xs h-8">
              <Plus className="w-3.5 h-3.5" /> Add Custom
            </Button>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
            <Input placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 bg-[#F6F7FB] border-[#E7EAF3] text-sm" autoFocus />
          </div>
          {/* Filter rows */}
          <div className="space-y-2">
            <div className="flex gap-1 overflow-x-auto pb-1">
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider self-center flex-shrink-0 mr-1">Muscle</span>
              {MUSCLES.map(m => <FilterPill key={m} value={m} current={muscle} onSet={setMuscle} label={m === 'all' ? 'All' : m.replace('_', ' ')} />)}
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider self-center flex-shrink-0 mr-1">Equip</span>
              {EQUIPMENT.map(e => <FilterPill key={e} value={e} current={equipment} onSet={setEquipment} label={e === 'all' ? 'All' : e.replace('_', ' ')} />)}
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider self-center flex-shrink-0 mr-1">Pattern</span>
              {PATTERNS.map(p => <FilterPill key={p} value={p} current={pattern} onSet={setPattern} label={p === 'all' ? 'All' : p} />)}
            </div>
          </div>
        </div>

        {/* Add custom exercise form */}
        {showAdd && (
          <div className="px-5 py-4 border-b border-[#E7EAF3] bg-[#F8FAFC] flex-shrink-0 space-y-3">
            <p className="text-xs font-bold text-[#1F2A44] uppercase tracking-wider">New Custom Exercise</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input placeholder="Exercise name *" value={newEx.name} onChange={e => setNewEx(p => ({ ...p, name: e.target.value }))}
                  className="h-8 text-sm border-[#E7EAF3]" />
              </div>
              <div>
                <select value={newEx.muscle_group} onChange={e => setNewEx(p => ({ ...p, muscle_group: e.target.value }))}
                  className="h-8 w-full text-xs rounded-lg border border-[#E7EAF3] bg-white px-2 focus:outline-none">
                  {MUSCLES.slice(1).map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <select value={newEx.equipment} onChange={e => setNewEx(p => ({ ...p, equipment: e.target.value }))}
                  className="h-8 w-full text-xs rounded-lg border border-[#E7EAF3] bg-white px-2 focus:outline-none">
                  {EQUIPMENT.slice(1).map(eq => <option key={eq} value={eq}>{eq.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <select value={newEx.movement_pattern} onChange={e => setNewEx(p => ({ ...p, movement_pattern: e.target.value }))}
                  className="h-8 w-full text-xs rounded-lg border border-[#E7EAF3] bg-white px-2 focus:outline-none">
                  {PATTERNS.slice(1).map(pt => <option key={pt} value={pt}>{pt}</option>)}
                </select>
              </div>
              <div>
                <Input placeholder="YouTube / Video URL" value={newEx.video_url} onChange={e => setNewEx(p => ({ ...p, video_url: e.target.value }))}
                  className="h-8 text-xs border-[#E7EAF3]" />
              </div>
              <div className="col-span-2">
                <Input placeholder="Description / form notes" value={newEx.description} onChange={e => setNewEx(p => ({ ...p, description: e.target.value }))}
                  className="h-8 text-xs border-[#E7EAF3]" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="text-xs h-7">Cancel</Button>
              <Button size="sm" onClick={() => { if (!newEx.name.trim()) { toast.error('Enter a name'); return; } createMutation.mutate(newEx); }}
                disabled={createMutation.isPending} className="gap-1.5 text-xs h-7">
                <Save className="w-3 h-3" /> Save to Library
              </Button>
            </div>
          </div>
        )}

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <div className="text-center py-14">
              <Dumbbell className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
              <p className="text-sm text-[#9CA3AF] font-medium">No exercises found</p>
              <p className="text-xs text-[#C4C9D4] mt-1">Try adjusting filters or add a custom exercise</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map(ex => (
                <button key={ex.id} onClick={() => { onSelect(ex); onClose(); }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F0F4FF] border border-transparent hover:border-primary/20 transition-all group text-left">
                  {/* Thumbnail or icon */}
                  <div className="w-12 h-12 rounded-xl bg-[#F6F7FB] border border-[#E7EAF3] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {ex.thumbnail_url
                      ? <img src={ex.thumbnail_url} alt={ex.name} className="w-full h-full object-cover" />
                      : ex.video_url
                      ? <div className="w-full h-full bg-primary/10 flex items-center justify-center"><Play className="w-4 h-4 text-primary" fill="currentColor" /></div>
                      : <Dumbbell className="w-5 h-5 text-[#9CA3AF]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-[#1F2A44] truncate">{ex.name}</p>
                      {ex.is_coach_branded && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" fill="currentColor" />}
                    </div>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {ex.muscle_group && (
                        <span className={cn('text-[9px] px-1.5 py-0.5 rounded-md font-bold', MUSCLE_COLORS[ex.muscle_group] || 'bg-[#F6F7FB] text-[#6B7280]')}>
                          {ex.muscle_group.replace('_', ' ')}
                        </span>
                      )}
                      {ex.equipment && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium bg-[#F6F7FB] text-[#6B7280] border border-[#E7EAF3]">
                          {ex.equipment.replace('_', ' ')}
                        </span>
                      )}
                      {ex.movement_pattern && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium bg-blue-50 text-blue-600">
                          {ex.movement_pattern}
                        </span>
                      )}
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-[#C4C9D4] group-hover:text-primary transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}