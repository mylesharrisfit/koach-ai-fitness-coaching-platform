import React from 'react';
import KoachLogo from '@/components/brand/KoachLogo.jsx';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#0A0A0A' }}>
      <div className="max-w-md w-full p-8 rounded-2xl" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <KoachLogo size={64} rounded="rounded-2xl" glow={true} bg={true} />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-2" style={{ color: '#3B82F6' }}>KOACH AI</p>
          <h1 className="text-2xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>Access Restricted</h1>
          <p className="text-sm mb-6" style={{ color: '#7A7A7A' }}>
            You are not registered on this platform. Please contact the coach or administrator to request access.
          </p>
          <div className="p-4 rounded-xl text-sm text-left space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: '#B3B3B3' }}>If you believe this is an error:</p>
            <ul className="list-disc list-inside space-y-1" style={{ color: '#7A7A7A' }}>
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