import React from 'react';

/**
 * App-wide error boundary. Without one, any uncaught render error (e.g. a
 * misconfigured backend throwing during the auth check) unmounts the whole
 * React tree and leaves a blank white page. This catches it and shows a
 * minimal recover-with-reload screen instead, so a single failing subtree
 * never blanks the entire platform.
 */
export default class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Something went wrong.' };
  }

  componentDidCatch(error, info) {
    // Surface for debugging; a real logger/Sentry hook can go here.
    console.error('Uncaught render error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="fixed inset-0 flex items-center justify-center px-6" style={{ background: 'var(--tc-sidebar, #0A0A0A)' }}>
        <div className="max-w-sm w-full text-center space-y-4">
          <h1 className="text-xl font-bold text-white">Something went wrong</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            The app hit an unexpected error. Reloading usually fixes it. If it
            keeps happening, please contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-3 rounded-xl font-bold text-sm text-primary-foreground"
            style={{ background: 'var(--tc-primary, #2563EB)' }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
