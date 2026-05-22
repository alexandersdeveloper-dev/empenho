import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase.module';
import { buildMeta } from '../../common/dtos/pagination.dto';

@Injectable()
export class AuditService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async listar(opts: {
    tabela?: string;
    usuario_id?: string;
    operacao?: string;
    de?: string;
    ate?: string;
    page?: number;
    limit?: number;
  }) {
    const { tabela, usuario_id, operacao, de, ate, page = 1, limit = 50 } = opts;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('audit_log')
      .select('*, usuario:perfis(id, nome)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tabela) query = query.eq('tabela', tabela);
    if (usuario_id) query = query.eq('usuario_id', usuario_id);
    if (operacao) query = query.eq('operacao', operacao);
    if (de) query = query.gte('created_at', de);
    if (ate) query = query.lte('created_at', ate);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);
    return { data, meta: buildMeta(page, limit, count ?? 0) };
  }
}
