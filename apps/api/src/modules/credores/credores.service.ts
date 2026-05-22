import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase.module';

@Injectable()
export class CredoresService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async buscar(q?: string, limit = 20) {
    let query = this.supabase
      .from('credores')
      .select('id, numero, nome')
      .order('nome')
      .limit(limit);

    if (q) {
      query = query.or(`nome.ilike.%${q}%,numero.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async buscarPorNumero(numero: string) {
    const { data, error } = await this.supabase
      .from('credores')
      .select('*')
      .eq('numero', numero)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Credor não encontrado');
    return data;
  }

  async criar(dto: { numero?: string; nome: string }) {
    const { data, error } = await this.supabase
      .from('credores')
      .insert(dto)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async atualizar(id: number, dto: { numero?: string; nome: string }) {
    const { data, error } = await this.supabase
      .from('credores')
      .update(dto)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Credor não encontrado');
    return data;
  }

  async excluir(id: number) {
    const { error } = await this.supabase.from('credores').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { deleted: true, id };
  }
}
