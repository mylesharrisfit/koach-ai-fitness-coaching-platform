import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  const { data: authData, isFetched } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return { user, isAuthenticated: true };
      } catch {
        return { user: null, isAuthenticated: false };
      }
    }
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0A0A0A' }}>
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        {/* Logo mark */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', color: '#fff', boxShadow: '0 0 30px rgba(59,130,246,0.3)' }}>
            K
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#3B82F6' }}>KOACH AI</p>
        </div>

        {/* 404 */}
        <div className="space-y-3">
          <h1 className="text-8xl font-bold" style={{ color: 'rgba(255,255,255,0.06)', letterSpacing: '-0.04em' }}>404</h1>
          <h2 className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Page not found</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#7A7A7A' }}>
            The page <span className="font-medium" style={{ color: '#B3B3B3' }}>"{pageName}"</span> doesn't exist on this platform.
          </p>
        </div>

        {/* Admin note */}
        {isFetched && authData?.isAuthenticated && authData.user?.role === 'admin' && (
          <div className="p-4 rounded-2xl text-left text-sm" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-semibold text-white mb-1">Admin Note</p>
            <p style={{ color: '#7A7A7A' }}>This page hasn't been implemented yet. Ask the AI to build it in the chat.</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', boxShadow: '0 0 20px rgba(59,130,246,0.2)' }}
        >
          ← Return to Dashboard
        </button>
      </div>
    </div>
  );
}