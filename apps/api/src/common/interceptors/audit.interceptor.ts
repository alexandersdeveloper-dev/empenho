import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Observable, tap } from 'rxjs';
import { SUPABASE_CLIENT } from '../../supabase.module';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    if (!MUTATING_METHODS.has(req.method)) return next.handle();

    const userId = req.user?.id ?? null;
    const ip = req.ip ?? req.headers['x-forwarded-for'] ?? null;

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          const tabela = this.inferTabela(req.path);
          if (!tabela) return;

          const registroId =
            req.params?.id ??
            (responseData as Record<string, unknown>)?.id ??
            'unknown';

          const operacao =
            req.method === 'POST' ? 'INSERT'
            : req.method === 'DELETE' ? 'DELETE'
            : 'UPDATE';

          await this.supabase.from('audit_log').insert({
            tabela,
            operacao,
            registro_id: String(registroId),
            dados_depois: operacao !== 'DELETE' ? responseData : null,
            usuario_id: userId,
            ip: String(ip),
          });
        } catch {
          // Falha de auditoria nunca deve quebrar a resposta
        }
      }),
    );
  }

  private inferTabela(path: string): string | null {
    const segments = path.replace('/api/v1/', '').split('/');
    const map: Record<string, string> = {
      empenhos: 'empenhos',
      credores: 'credores',
      classificacao: 'classificacao_orcamentaria',
      subelementos: 'subelementos',
      users: 'perfis',
      config: 'config_qr',
    };
    return map[segments[0]] ?? null;
  }
}
