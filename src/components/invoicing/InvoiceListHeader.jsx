import React from 'react';

export default function InvoiceListHeader() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '34px minmax(120px,1.8fr) minmax(140px,2.5fr) 90px minmax(90px,1fr) 90px auto',
      gap: 12,
      padding: '8px 16px',
      background: 'var(--tc-background)',
      borderBottom: '1px solid var(--tc-muted)',
    }}>
      <div />
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tc-muted-foreground)',  }}>Client</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tc-muted-foreground)',  }}>Description</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tc-muted-foreground)', textAlign: 'right' }}>Amount</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tc-muted-foreground)',  }}>Dates</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tc-muted-foreground)',  }}>Status</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tc-muted-foreground)',  }}>Actions</div>
    </div>
  );
}