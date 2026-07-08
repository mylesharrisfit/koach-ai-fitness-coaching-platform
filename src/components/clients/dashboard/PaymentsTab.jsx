import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createStripeCustomer, sendStripeInvoice, getClientInvoices } from '@/lib/stripe';
import { sendZapierEvent } from '@/lib/zapier';
import { DollarSign, ExternalLink, Send, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const QUICK_CHARGES = [
  { label: '1:1 Session', amount: 150 },
  { label: 'Monthly Coaching', amount: 299 },
  { label: 'Program Package', amount: 197 },
  { label: 'Custom Amount', amount: null },
];

const STATUS_STYLES = {
  paid:   'bg-emerald-50 text-emerald-700 border-emerald-100',
  open:   'bg-blue-50 text-blue-700 border-blue-100',
  void:   'bg-gray-50 text-gray-500 border-gray-200',
  uncollectible: 'bg-red-50 text-red-600 border-red-100',
  draft:  'bg-yellow-50 text-yellow-700 border-yellow-100',
};

export default function PaymentsTab({ client }) {
  const queryClient = useQueryClient();
  const [selectedCharge, setSelectedCharge] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [sending, setSending] = useState(false);

  // Only fetch invoices if we have a stripe customer id
  const { data: invoiceData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['stripe-invoices', client?.id, client?.stripe_customer_id],
    queryFn: () => getClientInvoices(client.stripe_customer_id),
    enabled: !!client?.stripe_customer_id,
  });

  const invoices = invoiceData?.invoices || [];
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount_paid / 100, 0);
  const outstanding = invoices.filter(i => i.status === 'open').reduce((s, i) => s + i.amount_due / 100, 0);

  const handleCharge = async (item) => {
    const amount = item.amount ?? (parseFloat(customAmount) || 0);
    const description = item.amount ? item.label : (customDesc || 'Coaching Service');
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setSending(true);
    try {
      let customerId = client.stripe_customer_id;
      // Create Stripe customer if needed
      if (!customerId) {
        const res = await createStripeCustomer(client);
        customerId = res.customer?.id;
        if (customerId) {
          await base44.entities.Client.update(client.id, { stripe_customer_id: customerId });
          queryClient.invalidateQueries({ queryKey: ['clients'] });
        } else {
          throw new Error('Failed to create Stripe customer');
        }
      }
      const result = await sendStripeInvoice(customerId, amount, description, client.id, client.name);
      if (result?.invoice) {
        toast.success(`Invoice sent to ${client.email}`);
        queryClient.invalidateQueries({ queryKey: ['stripe-invoices', client.id] });
        setSelectedCharge(null);
        setCustomAmount('');
        setCustomDesc('');
        sendZapierEvent('payment.invoice_sent', {
          client_id: client.id,
          client_name: client.name,
          amount,
          description,
        });
      } else {
        throw new Error(result?.error || 'Failed to send invoice');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  const billingStatusStyle = {
    active:    'bg-emerald-50 text-emerald-700 border-emerald-100',
    past_due:  'bg-red-50 text-red-600 border-red-100',
    cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
    none:      'bg-gray-50 text-gray-400 border-gray-200',
  };

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Paid', value: `$${totalPaid.toFixed(2)}`, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Outstanding', value: `$${outstanding.toFixed(2)}`, icon: AlertTriangle, color: 'text-amber-600' },
          { label: 'Billing', value: client?.billing_status || 'none', icon: DollarSign, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#E5E7EB] rounded-xl p-3 flex items-center gap-2">
            <s.icon className={cn('w-4 h-4 flex-shrink-0', s.color)} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#111827] truncate">{s.value}</p>
              <p className="text-[10px] text-[#9CA3AF]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Charge */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Quick Charge</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_CHARGES.map(item => (
            <button
              key={item.label}
              onClick={() => setSelectedCharge(selectedCharge?.label === item.label ? null : item)}
              className={cn(
                'p-3 border rounded-xl text-left transition-all',
                selectedCharge?.label === item.label
                  ? 'border-[#111827] bg-[#111827] text-white'
                  : 'border-[#E5E7EB] hover:border-[#111827] bg-white'
              )}
            >
              <p className="text-sm font-semibold">{item.label}</p>
              {item.amount && (
                <p className={cn('text-xs mt-0.5', selectedCharge?.label === item.label ? 'text-white/60' : 'text-[#6B7280]')}>
                  ${item.amount}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Custom amount inputs */}
        {selectedCharge?.amount === null && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Amount ($)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input
                  placeholder="Service description"
                  value={customDesc}
                  onChange={e => setCustomDesc(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {selectedCharge && (
          <Button
            className="w-full mt-3 bg-[#111827] hover:bg-[#1F2A44]"
            onClick={() => handleCharge(selectedCharge)}
            disabled={sending}
          >
            {sending ? (
              <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-3.5 h-3.5 mr-2" />
                Send Invoice — {selectedCharge.amount ? `$${selectedCharge.amount}` : customAmount ? `$${customAmount}` : '...'}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Invoice History */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Invoice History</p>
        {!client?.stripe_customer_id ? (
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 text-center">
            <p className="text-xs text-[#9CA3AF]">No Stripe customer yet. Send an invoice to create one.</p>
          </div>
        ) : invoicesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 text-center">
            <p className="text-xs text-[#9CA3AF]">No invoices yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">
                    {inv.description || inv.lines?.data?.[0]?.description || 'Invoice'}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {inv.created ? format(new Date(inv.created * 1000), 'MMM d, yyyy') : ''}
                  </p>
                </div>
                <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', STATUS_STYLES[inv.status] || STATUS_STYLES.draft)}>
                  {inv.status}
                </span>
                <p className="text-sm font-bold text-[#111827] flex-shrink-0">
                  ${((inv.amount_due || 0) / 100).toFixed(2)}
                </p>
                {inv.hosted_invoice_url && (
                  <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer"
                    className="text-[#9CA3AF] hover:text-primary transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* View in Stripe */}
        {client?.stripe_customer_id && (
          <a
            href={`https://dashboard.stripe.com/customers/${client.stripe_customer_id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 mt-2 text-xs text-[#6B7280] hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> View in Stripe Dashboard
          </a>
        )}
      </div>
    </div>
  );
}