import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '40px 20px',
          background: 'var(--bg)',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '72px',
            fontWeight: 900,
            background: 'var(--gradient-accent)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>500</div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-2xl)' }}>
            Something went wrong
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.7 }}>
            An unexpected error occurred. Our team has been notified.
            Please refresh the page or return home.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
            <a className="btn btn-outline" href="/">
              Go Home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
