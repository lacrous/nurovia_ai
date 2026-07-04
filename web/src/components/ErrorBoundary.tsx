import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <span className="text-[24px] font-bold text-red-500">!</span>
            </div>
            <h1 className="text-[18px] font-bold mb-2">Something went wrong</h1>
            <p className="text-[13px] txt-muted max-w-sm mb-3">
              An unexpected error occurred while loading the app.
            </p>
            {this.state.message && (
              <pre className="text-[11px] txt-faint bg-surface px-3 py-2 rounded-lg mb-6 max-w-md overflow-auto">
                {this.state.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-gold text-white font-semibold text-[13px] hover:bg-gold-light transition-colors"
            >
              Refresh page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
