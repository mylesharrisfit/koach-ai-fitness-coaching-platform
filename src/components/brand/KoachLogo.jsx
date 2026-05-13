import React from 'react';

const LOGO_URL = 'https://media.base44.com/images/public/69e2a436330b5bde8cea6d84/5fcf73373_ChatGPTImageMay12202609_18_33PM.png';

export default function KoachLogo({ size = 32, rounded = 'rounded-xl', glow = false, bg = true }) {
  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 overflow-hidden ${rounded}`}
      style={{
        width: size,
        height: size,
        background: bg ? '#0A0A0A' : 'transparent',
        boxShadow: glow ? '0 0 20px rgba(59,130,246,0.4)' : 'none',
      }}
    >
      <img
        src={LOGO_URL}
        alt="KOACH AI"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}