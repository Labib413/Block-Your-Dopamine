import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { logger } from "../lib/logger";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if ((this as any).state.hasError) {
      if ((this as any).props.fallback) {
        return (this as any).props.fallback;
      }

      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black p-6">
          <GlassCard className="max-w-md w-full p-8 text-center border-red-500/30">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-sans font-bold mb-4 text-white">System Interruption</h2>
            <p className="text-white/60 mb-8 text-sm leading-relaxed">
              A component encountered an unexpected error. Your session data has been check-pointed to prevent loss.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-white text-black font-sans font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Restore Session
            </button>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-black/40 rounded-lg text-left overflow-auto max-h-40">
                <p className="text-red-400 font-mono text-xs whitespace-pre-wrap">
                  {(this as any).state.error?.toString()}
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
