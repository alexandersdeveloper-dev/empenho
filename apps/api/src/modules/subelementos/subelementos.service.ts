import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { normalizarNatureza } from '@ficha-empenho/shared';
import { SUPABASE_CLIENT } from '../../supabase.module';

@Injectable()
export class SubelementosService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async buscarPorNatureza(natureza: string) {
    const naturezaNorm = normalizarNatureza(natureza);
    const { data, error } = await this.supabase
      .from('subelementos')
      .select('sub, descricao')
      .eq('natureza', naturezaNorm)
      .order('sub');
    if (error) throw new BadRequestException(error.message);
    return { natureza: naturezaNorm, items: data };
  }

  async buscarEfd(q?: string) {
    let query = this.supabase
      .from('efd')
      .select('codigo, descricao')
      .order('codigo')
      .limit(20);
    if (q) query = query.ilike('codigo', `%${q}%`);
    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
