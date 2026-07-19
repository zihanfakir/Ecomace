import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Oops! Something went wrong.</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>This section encountered an error. Please refresh the page or try again later.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--primary-accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '500' }}
          >
            Reload Page
          </button>
          {/* BUG-010 FIX: Only show raw error in development */}
          {import.meta.env.DEV && this.state.error && (
            <pre style={{ marginTop: '20px', padding: '15px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', borderRadius: '8px', textAlign: 'left', fontSize: '0.8rem', overflowX: 'auto' }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
