import React from 'react';

export default function KoachLogo({ size = 32, rounded = 'rounded-xl', glow = false, bg = true }) {
  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 ${rounded}`}
      style={{
        width: size,
        height: size,
        background: bg ? '#0A0A0A' : 'transparent',
        border: bg ? '1px solid rgba(255,255,255,0.08)' : 'none',
        boxShadow: glow ? '0 0 20px rgba(59,130,246,0.25)' : 'none',
      }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left vertical bar */}
        <rect x="3" y="3" width="4" height="18" rx="1" fill="white" />
        {/* Top-right arm */}
        <polygon points="7,3 22,3 22,7 11,12" fill="white" />
        {/* Bottom-right arm */}
        <polygon points="7,21 22,21 22,17 11,12" fill="white" />
        {/* Blue accent slash */}
        <polygon points="13,10.5 17,8 19,12 17,16 13,13.5 15,12" fill="#3B82F6" opacity="0.9" />
      </svg>
    </div>
  );
}