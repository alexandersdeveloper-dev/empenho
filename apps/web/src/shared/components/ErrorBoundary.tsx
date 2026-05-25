import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { error: Error | null; info: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: '' };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: '' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Componente quebrou:', error.message);
    console.error('[ErrorBoundary] Stack do componente:', info.componentStack);
    this.setState({ info: info.componentStack ?? '' });
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      const isDev = import.meta.env.DEV;

      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: 320, padding: 40, textAlign: 'center',
          fontFamily: 'Manrope, system-ui, sans-serif',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, marginBottom: 20,
            background: '#fef5f5', display: 'grid', placeItems: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea4242" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f1622', margin: '0 0 8px' }}>
            Algo deu errado nesta seção
          </p>

          <p style={{ fontSize: 13, color: '#5b667a', maxWidth: 380, margin: '0 0 8px', lineHeight: 1.6 }}>
            {this.state.error.message || 'Erro inesperado ao renderizar este componente.'}
          </p>

          {isDev && this.state.info && (
            <pre style={{
              fontSize: 10, color: '#8590a3', maxWidth: 500, overflow: 'auto',
              background: '#f6f8fb', border: '1px solid #e3e7ee', borderRadius: 8,
              padding: '10px 14px', textAlign: 'left', margin: '12px 0',
            }}>
              {this.state.info.trim()}
            </pre>
          )}

          <button
            onClick={() => this.setState({ error: null, info: '' })}
            style={{
              marginTop: 16, padding: '8px 22px', borderRadius: 8,
              background: '#0f1622', color: '#fff', border: 0,
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
