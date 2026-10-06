import React, { useEffect } from 'react';

/** Graphite splash: the logo and nothing else, for ~2 seconds. */
export default function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-sidebar">
      <img src="/koach-logo-white.png" alt="KOACH" className="h-9 w-auto" />
      <span className="absolute bottom-12 h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/80" aria-label="Loading" />
    </div>
  );
}
