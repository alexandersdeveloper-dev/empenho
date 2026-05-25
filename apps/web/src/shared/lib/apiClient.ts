import axios from 'axios';
import { supabase } from './supabaseClient';

// Warn early so it appears in Vercel function logs
if (!import.meta.env.VITE_API_URL) {
  console.warn(
    '[Config] VITE_API_URL não está definido. ' +
    'Requisições irão para /api/v1 (relativo) e provavelmente retornarão HTML do Vercel. ' +
    'Configure VITE_API_URL nas variáveis de ambiente do Vercel apontando para o backend Railway.',
  );
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: injeta token JWT em todas as requisições
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

// Interceptor: valida respostas e trata erros
apiClient.interceptors.response.use(
  (res) => {
    // Detecta quando o Vercel devolve index.html no lugar de JSON
    // (ocorre quando VITE_API_URL não está configurado e as rotas de API caem no rewrite catch-all)
    const contentType = (res.headers['content-type'] ?? '') as string;
    if (contentType.includes('text/html')) {
      const msg = import.meta.env.VITE_API_URL
        ? 'Resposta inesperada da API (HTML). Verifique se o backend Railway está em execução.'
        : 'VITE_API_URL não configurado no Vercel — as chamadas de API retornam HTML em vez de JSON.';
      console.error('[API] Resposta HTML detectada:', res.config.url, '→', msg);
      return Promise.reject(new Error(msg));
    }
    return res;
  },
  async (error) => {
    const status = error.response?.status;
    console.error('[API] Erro', status ?? 'network', error.config?.url, error.message);

    if (status === 401) {
      // Faz logout mas NÃO força window.location — o onAuthStateChange do App.tsx
      // detecta a sessão nula e redireciona para o login dentro do React,
      // evitando o flash de tela branca causado por hard-navigation.
      await supabase.auth.signOut();
    }

    return Promise.reject(error);
  },
);
