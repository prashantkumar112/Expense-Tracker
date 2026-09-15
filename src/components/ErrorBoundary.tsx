import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Expense Tracker:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetData = () => {
    if (window.confirm('Reset local cache and reload? Your default categories and data will be restored.')) {
      try {
        localStorage.clear();
      } catch (e) {
        console.error('Failed to clear storage', e);
      }
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 shadow-md">
            <AlertTriangle size={32} />
          </div>

          <h1 className="text-xl font-extrabold text-slate-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-600 max-w-sm mb-4">
            The application encountered an unexpected issue while rendering.
          </p>

          {this.state.error && (
            <div className="w-full max-w-md bg-white border border-rose-200 rounded-xl p-3 mb-6 text-left shadow-xs overflow-x-auto">
              <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1">
                Diagnostic Details
              </div>
              <div className="text-xs text-rose-900 font-mono break-words">
                {this.state.error.message || 'Unknown error'}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
            <button
              onClick={this.handleReload}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <RefreshCw size={14} />
              Reload Application
            </button>
            <button
              onClick={this.handleResetData}
              className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 size={14} />
              Reset Cache & Recover
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
