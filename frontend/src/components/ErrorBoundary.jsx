import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("💥 Uncaught error in React component tree:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-8 select-none">
          <div className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4 text-center backdrop-blur-md">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Se produjo un error visual</h2>
              <p className="text-xs text-slate-400">
                La interfaz ha capturado una excepción para evitar que la aplicación se cierre.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-red-300 text-left overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <RefreshCw size={14} />
              <span>Recargar Interfaz</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
