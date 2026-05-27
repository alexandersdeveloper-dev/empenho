import { toast } from 'sonner';
import { supabase } from './supabaseClient';

/**
 * Extrai a mensagem real do corpo da resposta quando a Edge Function retorna não-2xx.
 *
 * O Supabase JS SDK v2 não propaga o body da resposta em `error.message` — guarda-o
 * como string em `error.context`. Esta função normaliza os dois caminhos possíveis.
 */
export function edgeFnError(err: unknown): string {
  if (err && typeof err === 'object') {
    const ctx = (err as Record<string, unknown>).context;
    if (typeof ctx === 'string') {
      try {
        const body = JSON.parse(ctx) as Record<string, unknown>;
        if (typeof body.error === 'string') return body.error;
        if (typeof body.message === 'string') return body.message;
      } catch { /* não é JSON */ }
    }
  }
  return (err as Error)?.message ?? 'Erro desconhecido';
}

/**
 * Exibe um toast de erro com a mensagem real da Edge Function.
 * Se o erro indicar sessão expirada (401), faz logout imediato para
 * limpar o token stale e redirecionar para o login.
 */
export async function handleEdgeFnError(err: unknown): Promise<void> {
  const msg = edgeFnError(err);
  const isAuthError =
    msg.toLowerCase().includes('não autorizado') ||
    msg.toLowerCase().includes('unauthorized') ||
    (err as { status?: number })?.status === 401;

  if (isAuthError) {
    toast.error('Sessão expirada. Faça login novamente.');
    await supabase.auth.signOut();
    return;
  }
  toast.error(msg);
}
