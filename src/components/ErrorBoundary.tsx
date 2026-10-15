import React from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Keeps a runtime error in one panel from blanking the whole cockpit (important for a live judge
 * demo). Renders a minimal recovery card instead of an empty page.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    // Surface to the console for debugging; no telemetry is sent anywhere.
    // eslint-disable-next-line no-console
    console.error('StreamVault cockpit error:', error);
  }

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-[#070a12] text-gray-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0e1424] border border-slate-800 rounded-lg p-6 text-sm">
          <h1 className="text-base font-bold text-white mb-2">The cockpit hit an error</h1>
          <p className="text-slate-400 mb-3">Reload the page to continue. The covenant itself is unaffected - funds remain locked in the StreamVault contract.</p>
          <pre className="bg-slate-950 border border-slate-800 rounded p-3 text-[11px] text-rose-300 overflow-x-auto">{String(this.state.error.message)}</pre>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-lg text-xs font-bold bg-[#0AC18E] text-black">Reload</button>
        </div>
      </div>
    );
  }
}