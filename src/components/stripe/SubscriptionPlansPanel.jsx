import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listProducts, createProduct } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Package, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SubscriptionPlansPanel() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', description: '', interval: 'month' });
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stripe-products'],
    queryFn: listProducts,
    staleTime: 60000,
  });

  const products = data?.products || [];

  const createMutation = useMutation({
    mutationFn: () => createProduct(form.name, parseFloat(form.amount), form.description, form.interval),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-products'] });
      toast.success('Plan created in Stripe!');
      setShowCreate(false);
      setForm({ name: '', amount: '', description: '', interval: 'month' });
    },
    onError: () => toast.error('Failed to create plan'),
  });

  const isValid = form.name.trim() && parseFloat(form.amount) > 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sidebar/10 flex items-center justify-center">
            <Package className="w-3.5 h-3.5 text-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Subscription Plans</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Button size="sm" className="h-7 px-2.5 text-xs bg-sidebar hover:bg-sidebar" onClick={() => setShowCreate(true)}>
            <Plus className="w-3 h-3 mr-1" /> Create Plan
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-background border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground">No products yet. Create your first coaching plan.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map(p => {
            const price = p.prices?.[0];
            const amount = price ? price.unit_amount / 100 : null;
            const interval = price?.recurring?.interval;
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 border border-border rounded-xl bg-background">
                <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0">
                  <Package className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                  {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                </div>
                {amount !== null && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-foreground">${amount.toFixed(2)}</p>
                    {interval && <p className="text-[10px] text-muted-foreground">/{interval}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Coaching Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <div>
              <Label className="text-xs">Plan Name *</Label>
              <Input className="mt-1" placeholder="Monthly 1:1 Coaching" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Price (USD) *</Label>
                <Input className="mt-1" type="number" placeholder="299.00" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Billing Interval</Label>
                <Select value={form.interval} onValueChange={v => setForm(f => ({ ...f, interval: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea className="mt-1 resize-none" rows={2} placeholder="What's included..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <Button className="w-full bg-sidebar hover:bg-sidebar" onClick={() => createMutation.mutate()}
              disabled={!isValid || createMutation.isPending}>
              {createMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Creating...</> : 'Create Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}