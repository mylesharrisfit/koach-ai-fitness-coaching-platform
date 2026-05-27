import React from 'react';

export default function InvoiceListHeader() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '34px minmax(120px,1.8fr) minmax(140px,2.5fr) 90px minmax(90px,1fr) 90px auto',
      gap: 12,
      padding: '8px 16px',
      background: '#F9FAFB',
      borderBottom: '1px solid #F3F4F6',
    }}>
      <div />
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Amount</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dates</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</div>
    </div>
  );
}