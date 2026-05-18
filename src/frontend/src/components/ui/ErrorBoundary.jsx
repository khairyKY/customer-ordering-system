import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-8 font-mono">
          <div className="border border-red-600 bg-red-950/20 p-8 max-w-md text-center">
            <h1 className="text-red-500 text-2xl font-black mb-4 uppercase tracking-tighter">
              CRITICAL::SYSTEM_FAILURE
            </h1>
            <p className="text-white/60 mb-8 text-sm">
              The Dev-Cosmic interface encountered an unhandled exception in this sector.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="border border-cyan-400 text-cyan-400 px-6 py-2 hover:bg-cyan-400 hover:text-black uppercase font-bold"
            >
              [ RETURN_TO_CATALOG ]
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
