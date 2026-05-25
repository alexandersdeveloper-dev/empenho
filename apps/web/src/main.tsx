import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { App } from './app/App';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import './app/globals.css';

// ── Captura global de erros não tratados ──────────────────────────────────────

window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.filename, e.lineno, e.error);
  // Não exibe toast para erros de carregamento de recursos (imagens, fontes, etc.)
  if (e.error) {
    toast.error(`Erro inesperado: ${e.error?.message ?? 'erro desconhecido'}`, { duration: 8000 });
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Rejection]', e.reason);
  const msg = e.reason?.message ?? String(e.reason) ?? 'promise rejeitada';
  toast.error(`Erro assíncrono: ${msg}`, { duration: 8000 });
  e.preventDefault(); // evita que o erro apareça no console como "Uncaught"
});

// ── QueryClient ───────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Não lança exceções no componente — deixa TanStack Query gerenciar isError
      throwOnError: false,
    },
    mutations: {
      throwOnError: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
