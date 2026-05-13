import React from 'react';

export default function KoachLogo({ size = 32, rounded = 'rounded-xl', glow = false, bg = true }) {
  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 ${rounded}`}
      style={{
        width: size,
        height: size,
        background: bg ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' : 'transparent',
        boxShadow: glow ? '0 0 20px rgba(59,130,246,0.4)' : 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: size * 0.52,
          fontWeight: 800,
          color: '#fff',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        K
      </span>
    </div>
  );
}