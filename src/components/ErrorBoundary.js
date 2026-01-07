import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: '#dc3545' }}>⚠️ Something went wrong</h2>
          <p style={{ margin: '1rem 0' }}>
            The application encountered an error. This might be due to:
          </p>
          <ul style={{ textAlign: 'left', display: 'inline-block', margin: '1rem auto' }}>
            <li>Supabase connection issues</li>
            <li>LocalStorage being blocked</li>
            <li>Browser compatibility</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            Reload Application
          </button>
          <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
            <p>Error details (for debugging):</p>
            <code style={{ display: 'block', background: '#f8f9fa', padding: '1rem', borderRadius: '4px' }}>
              {this.state.error?.toString()}
            </code>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;