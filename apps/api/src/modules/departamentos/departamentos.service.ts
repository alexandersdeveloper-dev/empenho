import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase.module';

@Injectable()
export class DepartamentosService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async listar() {
    const { data, error } = await this.supabase
      .from('departamentos')
      .select('id, nome, sigla, ativo')
      .eq('ativo', true)
      .order('nome');
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async criar(dto: { nome: string; sigla?: string }) {
    const { data, error } = await this.supabase
      .from('departamentos')
      .insert({ nome: dto.nome, sigla: dto.sigla ?? null, ativo: true })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
