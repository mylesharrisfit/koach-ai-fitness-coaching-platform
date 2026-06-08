import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, X, Check, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

function avatarColor(name) {
  const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
}

export default function GroupFormModal({ open, onOpenChange, group, currentUser }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');

  const isEdit = !!group;

  useEffect(() => {
    if (group) {
      setName(group.name || '');
      setDescription(group.description || '');
      setSelectedIds(group.member_ids || []);
      setCoverUrl(group.cover_image_url || '');
    } else {
      setName(''); setDescription(''); setSelectedIds([]); setCoverUrl('');
    }
  }, [group, open]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit
      ? base44.entities.CommunityGroup.update(group.id, data)
      : base44.entities.CommunityGroup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
      onOpenChange(false);
    },
  });

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setCoverUrl(file_url);
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      name,
      description,
      member_ids: selectedIds,
      coach_id: currentUser?.id,
      cover_image_url: coverUrl,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0E1525] font-semibold">
            {isEdit ? 'Edit Group' : 'Create Community'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-1">
          {/* Name */}
          <div>
            <Label className="text-xs font-semibold text-[#374151]">Group Name *</Label>
            <Input className="mt-1" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HYROX Crew, Fat Loss Group" />
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs font-semibold text-[#374151]">Description</Label>
            <Input className="mt-1" value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this group about?" />
          </div>

          {/* Cover image */}
          <div>
            <Label className="text-xs font-semibold text-[#374151]">Cover Image (optional)</Label>
            <div className="mt-1 flex items-center gap-3">
              {coverUrl ? (
                <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setCoverUrl('')}
                    className="absolute top-1 right-1 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center">
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-12 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-[#9CA3AF]" />
                </div>
              )}
              <label className="flex-1 cursor-pointer text-xs font-semibold text-[#2563EB] hover:text-blue-700">
                {uploading ? 'Uploading…' : 'Upload photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Member picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-[#374151]">Members</Label>
              {selectedIds.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB]">
                  {selectedIds.length} selected
                </span>
              )}
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search clients…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] outline-none focus:border-[#2563EB] transition-colors"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 border border-[#E5E7EB] rounded-lg bg-white p-2">
              {filtered.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] text-center py-4">No clients found</p>
              ) : filtered.map(c => {
                const selected = selectedIds.includes(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => toggle(c.id)}
                    className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left',
                      selected ? 'bg-[#EFF6FF] border border-[#BFDBFE]' : 'hover:bg-[#F9FAFB] border border-transparent')}>
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0', avatarColor(c.name))}>
                      {c.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111827] truncate">{c.name}</p>
                      <p className="text-[11px] text-[#9CA3AF] truncate">{c.email}</p>
                    </div>
                    {selected && <Check className="w-4 h-4 text-[#2563EB] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <button type="button" onClick={() => onOpenChange(false)}
              className="px-4 py-2 border border-[#E5E7EB] text-sm font-semibold text-[#374151] rounded-lg hover:bg-[#F9FAFB] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saveMutation.isPending || !name.trim()}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-40"
              style={{ background: '#2563EB' }}>
              {saveMutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Group'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}