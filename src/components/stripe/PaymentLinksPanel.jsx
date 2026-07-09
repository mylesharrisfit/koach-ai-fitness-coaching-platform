import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createPaymentLink } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Link, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Link copied!');
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sidebar text-white text-xs font-semibold hover:bg-sidebar transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
}

export default function PaymentLinksPanel() {
  const [form, setForm] = useState({ name: '', amount: '', description: '' });
  const [generatedLink, setGeneratedLink] = useState(null);

  const mutation = useMutation({
    mutationFn: () => createPaymentLink(form.name, parseFloat(form.amount), form.description),
    onSuccess: (data) => {
      if (data?.url) {
        setGeneratedLink(data.url);
        toast.success('Payment link created!');
      } else {
        toast.error(data?.error || 'Failed to create link');
      }
    },
    onError: () => toast.error('Failed to create payment link'),
  });

  const isValid = form.name.trim() && parseFloat(form.amount) > 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[var(--kc-635bff)]/10 flex items-center justify-center">
          <Link className="w-3.5 h-3.5 text-[var(--kc-635bff)]" />
        </div>
        <h3 className="text-sm font-bold text-foreground">Create Payment Link</h3>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Product / Service Name *</Label>
          <Input
            className="mt-1"
            placeholder="e.g. 1:1 Coaching Session"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <Label className="text-xs">Amount (USD) *</Label>
          <Input
            className="mt-1"
            type="number"
            placeholder="0.00"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          />
        </div>
        <div>
          <Label className="text-xs">Description</Label>
          <Textarea
            className="mt-1 resize-none"
            rows={2}
            placeholder="Optional description for the payment page..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <Button
          className="w-full bg-[var(--kc-635bff)] hover:bg-[var(--kc-5850ea)]"
          onClick={() => mutation.mutate()}
          disabled={!isValid || mutation.isPending}
        >
          {mutation.isPending ? (
            <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Generating...</>
          ) : (
            <><Link className="w-3.5 h-3.5 mr-2" /> Generate Link</>
          )}
        </Button>

        {generatedLink && (
          <div className="mt-2 p-3 bg-success/10 border border-success rounded-xl">
            <p className="text-xs font-semibold text-success mb-1.5">Payment Link Ready</p>
            <div className="flex items-center gap-2">
              <a
                href={generatedLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[var(--kc-635bff)] truncate flex-1 font-mono hover:underline"
              >
                {generatedLink}
              </a>
              <CopyButton text={generatedLink} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}