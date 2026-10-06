import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import { Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Page, PageHeader } from '@/components/kit';
import { Button } from '@/components/ui/button';
import InvoicesWorkspace from '@/components/invoicing/InvoicesWorkspace';
import { invoiceTotals } from '@/components/invoicing/InvoiceStatCards';
import { BillingNav, money, plural } from '@/components/business/ui';
import PaymentTracking from './PaymentTracking';

/** Billing: invoices (default) and the payments ledger (?view=payments). */
export default function Invoicing() {
  const location = useLocation();
  const navigate = useNavigate();
  const view = new URLSearchParams(location.search).get('view') === 'payments' ? 'payments' : 'invoices';
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => db.entities.Invoice.list('-created_date', 500),
  });

  const t = invoiceTotals(invoices);
  const subtitle = isLoading
    ? 'Invoices, payments and packages.'
    : `${money(t.thisMonthRev)} collected this month. ${t.overdue.length ? `${plural(t.overdue.length, 'invoice')} overdue.` : 'Nothing overdue.'}`;

  return (
    <Page>
      <PageHeader
        title="Billing"
        subtitle={subtitle}
        actions={(
          <Button onClick={() => { if (view !== 'invoices') navigate('/invoicing'); setEditingInvoice(null); setShowForm(true); }}>
            <Plus /> New invoice
          </Button>
        )}
      />

      <BillingNav className="mb-5" />

      {view === 'payments' ? (
        <PaymentTracking />
      ) : (
        <InvoicesWorkspace
          invoices={invoices}
          isLoading={isLoading}
          showForm={showForm}
          setShowForm={setShowForm}
          editingInvoice={editingInvoice}
          setEditingInvoice={setEditingInvoice}
        />
      )}

    </Page>
  );
}
