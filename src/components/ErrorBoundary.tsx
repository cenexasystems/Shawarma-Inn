import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[var(--black)] text-[var(--white)] px-6 text-center">
        <h1 className="font-bebas text-3xl tracking-wide">Something went wrong.</h1>
        <p className="text-white/60 max-w-sm">
          We hit an unexpected error. Please reload the page, and contact us if it keeps happening.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[var(--red)] text-white font-bebas text-lg px-8 py-3 rounded-full tracking-[2px]"
        >
          RELOAD
        </button>
      </div>
    );
  }
}
