import React from 'react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#0A0A0A' }}>
      <div className="max-w-md w-full p-8 rounded-2xl" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-2xl"
            style={{ background: 'linear-gradient(145deg, #3B82F6 0%, #1D4ED8 100%)', boxShadow: '0 0 30px rgba(59,130,246,0.4), 0 4px 16px rgba(0,0,0,0.4)' }}
          >
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
              <line x1="5" y1="3" x2="5" y2="17" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="5" y1="10" x2="15" y2="3" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="5" y1="10" x2="15" y2="17" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
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