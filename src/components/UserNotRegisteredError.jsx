import React from 'react';
import KoachLogo from '@/components/brand/KoachLogo.jsx';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'var(--tc-sidebar)' }}>
      <div className="max-w-md w-full p-8 rounded-2xl" style={{ background: 'var(--kc-161616)', border: '1px solid color-mix(in srgb, white 6%, transparent)' }}>
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <KoachLogo size={64} rounded="rounded-2xl" glow={true} bg={true} />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-2" style={{ color: 'var(--tc-primary)' }}>KOACH AI</p>
          <h1 className="text-2xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>Access Restricted</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--kc-7a7a7a)' }}>
            You are not registered on this platform. Please contact the coach or administrator to request access.
          </p>
          <div className="p-4 rounded-xl text-sm text-left space-y-2" style={{ background: 'color-mix(in srgb, white 3%, transparent)', border: '1px solid color-mix(in srgb, white 6%, transparent)' }}>
            <p style={{ color: 'var(--kc-b3b3b3)' }}>If you believe this is an error:</p>
            <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--kc-7a7a7a)' }}>
              <li>Verify you are logged in with the correct account</li>
              <li>Contact your coach for access</li>
              <li>Try logging out and back in again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;