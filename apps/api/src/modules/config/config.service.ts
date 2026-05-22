import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase.module';

@Injectable()
export class ConfigAppService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async getConfigQr() {
    const { data, error } = await this.supabase
      .from('config_qr')
      .select('*')
      .eq('id', 1)
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateConfigQr(campos: string | string[], separador: string) {
    const camposStr = Array.isArray(campos) ? campos.join(',') : campos;
    const { data, error } = await this.supabase
      .from('config_qr')
      .upsert({ id: 1, campos: camposStr, separador })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getCamposObrigatorios() {
    const { data, error } = await this.supabase
      .from('campos_obrigatorios')
      .select('*')
      .eq('id', 1)
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateCamposObrigatorios(campos: string | string[]) {
    const camposStr = Array.isArray(campos) ? campos.join(',') : campos;
    const { data, error } = await this.supabase
      .from('campos_obrigatorios')
      .upsert({ id: 1, campos: camposStr })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getFormasPagamento() {
    const { data, error } = await this.supabase
      .from('formas_pagamento')
      .select('*')
      .order('codigo');
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getRetencoes(q?: string) {
    let query = this.supabase
      .from('retencoes')
      .select('*')
      .order('nome');
    if (q) query = query.or(`nome.ilike.%${q}%,codigo.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
