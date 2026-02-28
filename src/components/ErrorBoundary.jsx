import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '2rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#9B1B5D' }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>We're sorry for the inconvenience. Please try reloading the page.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '0.75rem 2rem', backgroundColor: '#9B1B5D', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
