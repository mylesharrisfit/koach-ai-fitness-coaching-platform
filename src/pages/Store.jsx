import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, ShoppingBag, Star, MoreHorizontal, Edit, Trash2, Eye, EyeOff, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageHeader from '../components/shared/PageHeader';
import { cn } from '@/lib/utils';

export default function Store() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', long_description: '', price: '', original_price: '',
    category: 'workout', difficulty: 'all_levels', duration_weeks: '', image_url: '',
    features: [], is_published: true
  });
  const [featureInput, setFeatureInput] = useState('');
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['listings'],
    queryFn: () => base44.entities.PlanListing.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PlanListing.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['listings'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlanListing.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['listings'] }); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlanListing.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listings'] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', long_description: '', price: '', original_price: '', category: 'workout', difficulty: 'all_levels', duration_weeks: '', image_url: '', features: [], is_published: true });
    setShowForm(true);
  };

  const openEdit = (listing) => {
    setEditing(listing);
    setForm({ ...listing, price: listing.price || '', original_price: listing.original_price || '', duration_weeks: listing.duration_weeks || '' });
    setShowForm(true);
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setForm({ ...form, features: [...(form.features || []), featureInput.trim()] });
      setFeatureInput('');
    }
  };

  const removeFeature = (idx) => {
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, price: Number(form.price), original_price: Number(form.original_price) || undefined, duration_weeks: Number(form.duration_weeks) || undefined };
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const categoryColors = {
    workout: 'bg-[#EEF4FF] text-primary',
    nutrition: 'bg-emerald-50 text-emerald-600',
    bundle: 'bg-violet-50 text-violet-600',
    coaching: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Plan Store" subtitle="Sell your training plans"
        actions={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Create Listing</Button>}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-80 bg-white rounded-2xl border border-[#E7EAF3] animate-pulse shadow-sm" />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
          <p className="text-[#6B7280]">No listings yet. Create your first plan to sell.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <div key={listing.id} className="bg-white rounded-2xl border border-[#E7EAF3] overflow-hidden hover:shadow-md hover:border-blue-200 transition-all group shadow-sm">
              <div className="h-40 bg-[#F6F7FB] relative">
                {listing.image_url && <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className={cn("text-xs", categoryColors[listing.category])}>
                    {listing.category}
                  </Badge>
                  {!listing.is_published && (
                    <Badge variant="outline" className="bg-white/90 text-xs"><EyeOff className="w-3 h-3 mr-1" /> Draft</Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-8 w-8 bg-white/90 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(listing)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(listing.id)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="p-5">
                <h3 className="font-heading font-bold text-lg text-[#1F2A44]">{listing.title}</h3>
                {listing.description && <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">{listing.description}</p>}
                
                {listing.features?.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {listing.features.slice(0, 3).map((f, i) => (
                      <p key={i} className="text-xs text-[#6B7280] flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-primary" /> {f}
                      </p>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-[#E7EAF3] flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-heading font-bold text-primary">${listing.price}</span>
                    {listing.original_price && listing.original_price > listing.price && (
                      <span className="text-sm text-[#6B7280] line-through">${listing.original_price}</span>
                    )}
                  </div>
                  {listing.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-chart-4 fill-chart-4" />
                      <span className="font-medium">{listing.rating}</span>
                    </div>
                  )}
                </div>
                {listing.sales_count > 0 && (
                  <p className="text-xs text-[#6B7280] mt-2">{listing.sales_count} sales</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">{editing ? 'Edit Listing' : 'Create Listing'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
            <div><Label>Short Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div><Label>Full Description</Label><Textarea value={form.long_description} onChange={e => setForm({...form, long_description: e.target.value})} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price ($) *</Label><Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
              <div><Label>Original Price ($)</Label><Input type="number" value={form.original_price} onChange={e => setForm({...form, original_price: e.target.value})} /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workout">Workout</SelectItem>
                    <SelectItem value="nutrition">Nutrition</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                    <SelectItem value="coaching">Coaching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={v => setForm({...form, difficulty: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="all_levels">All Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Duration (weeks)</Label><Input type="number" value={form.duration_weeks} onChange={e => setForm({...form, duration_weeks: e.target.value})} /></div>
              <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} /></div>
            </div>
            
            {/* Features */}
            <div>
              <Label>Features</Label>
              <div className="flex gap-2 mb-2">
                <Input value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder="e.g., 5x per week training" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())} />
                <Button type="button" variant="outline" onClick={addFeature}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.features?.map((f, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeFeature(i)}>
                    {f} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={v => setForm({...form, is_published: v})} />
              <Label>Published</Label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Update' : 'Create Listing'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}