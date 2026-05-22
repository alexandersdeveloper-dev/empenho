import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase.module';

@Injectable()
export class ClassificacaoService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async buscarPorFicha(numeroFicha: string) {
    const { data, error } = await this.supabase
      .from('classificacao_orcamentaria')
      .select('*')
      .eq('numero_ficha', numeroFicha)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Classificação não encontrada para esta ficha');
    return data;
  }

  async listar(q?: string) {
    let query = this.supabase
      .from('classificacao_orcamentaria')
      .select('*')
      .order('numero_ficha')
      .limit(100);
    if (q) {
      query = query.or(`numero_ficha.ilike.%${q}%,projeto_atividade.ilike.%${q}%`);
    }
    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async upsert(dto: { numero_ficha: string; projeto_atividade?: string; dotacao?: string; stn?: string }) {
    const { data, error } = await this.supabase
      .from('classificacao_orcamentaria')
      .upsert(dto, { onConflict: 'numero_ficha' })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async excluir(id: number) {
    const { error } = await this.supabase
      .from('classificacao_orcamentaria')
      .delete()
      .eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { deleted: true, id };
  }
}
