import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Lock, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FocusFooter } from '@/components/portal/PortalUI';
import { fmtMoney as fmt } from './shared';

/** Only a real hosted payment page (Stripe) is offered as a way to pay. */
const paymentUrl = (invoice) => {
  const u = invoice?.stripe_payment_url;
  return typeof u === 'string' && /^https:\/\//i.test(u) ? u : null;
};

/**
 * Pay an invoice. There is no in-app card form: the client pays on the
 * coach's Stripe payment page when the invoice has one, and the invoice is
 * marked paid only when the payment actually clears (never from here). With
 * no payment link yet, say so and point to the coach.
 */
export default function PaymentFlowModal({ invoice, onClose }) {
  const navigate = useNavigate();
  const url = paymentUrl(invoice);
  const lineItems = invoice.line_items || [{ description: invoice.description || 'Coaching services', qty: 1, price: invoice.amount }];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50">
      <div className="flex h-[90vh] w-full max-w-[480px] flex-col rounded-t-xl bg-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-[22px] text-foreground">Pay invoice</h2>
          <button type="button" onClick={onClose} aria-label="Close"
            className="touch-compact inline-flex h-9 w-9 items-center justify-center rounded-lg bg-card text-foreground shadow-[0_0_0_1px_rgb(var(--border))] hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="rounded-xl shadow-[0_0_0_1px_rgb(var(--border))]">
            <p className="border-b border-border px-4 py-3 text-[13px] text-muted-foreground">Invoice {invoice.invoice_number}</p>
            <ul className="divide-y divide-border px-4">
              {lineItems.map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 break-words text-foreground">{item.description || 'Service'}</span>
                  <span className="font-semibold tabular-nums text-foreground">{fmt((item.price || 0) * (item.qty || 1))}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-[15px] font-semibold text-foreground">Total</span>
              <span className="num text-[28px] text-foreground">{fmt(invoice.amount)}</span>
            </div>
          </div>

          {url ? (
            <p className="mt-5 text-[15px] text-muted-foreground">
              You'll pay on a secure Stripe page. This invoice shows as paid once the payment clears.
            </p>
          ) : (
            <p className="mt-5 text-[15px] text-muted-foreground">
              Your coach hasn't sent a payment link for this invoice yet. Message them to arrange payment.
            </p>
          )}
        </div>

        <FocusFooter>
          {url ? (
            <>
              <Button asChild variant="brand" size="lg" className="h-[52px] w-full text-base font-bold">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Pay {fmt(invoice.amount)} on Stripe <ExternalLink />
                </a>
              </Button>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Card details go to Stripe, never to this app
              </p>
            </>
          ) : (
            <Button size="lg" className="h-[52px] w-full text-base font-bold" onClick={() => navigate('/portal/messages')}>
              <MessageCircle /> Message your coach
            </Button>
          )}
        </FocusFooter>
      </div>
    </div>
  );
}
