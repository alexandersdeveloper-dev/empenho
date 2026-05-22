import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { normalizarNatureza } from '@ficha-empenho/shared';
import { SUPABASE_CLIENT } from '../../supabase.module';

@Injectable()
export class ImportService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  private parseExcel(buffer: Buffer): unknown[][] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
  }

  async importarClassificacao(buffer: Buffer) {
    const rows = this.parseExcel(buffer).slice(1); // pula cabeçalho
    const items = rows
      .filter((r) => r[0])
      .map((r) => ({
        numero_ficha: String(r[0]).trim(),
        projeto_atividade: String(r[1] || '').trim() || null,
        dotacao: String(r[2] || '').trim() || null,
        stn: String(r[3] || '').trim() || null,
      }));

    if (!items.length) throw new BadRequestException('Nenhum registro válido encontrado');

    const { error } = await this.supabase
      .from('classificacao_orcamentaria')
      .upsert(items, { onConflict: 'numero_ficha' });

    if (error) throw new BadRequestException(error.message);
    return { inserted: items.length };
  }

  async importarCredores(buffer: Buffer) {
    const rows = this.parseExcel(buffer).slice(1);
    const items = rows
      .filter((r) => r[1])
      .map((r) => ({
        numero: String(r[0] || '').trim() || null,
        nome: String(r[1]).trim(),
      }));

    if (!items.length) throw new BadRequestException('Nenhum registro válido encontrado');

    const { error } = await this.supabase
      .from('credores')
      .upsert(items, { onConflict: 'numero', ignoreDuplicates: false });

    if (error) throw new BadRequestException(error.message);
    return { inserted: items.length };
  }

  async importarSubelementos(buffer: Buffer) {
    const rows = this.parseExcel(buffer).slice(1);
    const items = rows
      .filter((r) => r[0] && r[1])
      .map((r) => ({
        natureza: normalizarNatureza(String(r[0]).trim()),
        sub: String(r[1]).trim().padStart(2, '0'),
        descricao: String(r[2] || '').trim() || null,
      }));

    if (!items.length) throw new BadRequestException('Nenhum registro válido encontrado');

    const { error } = await this.supabase
      .from('subelementos')
      .upsert(items, { onConflict: 'natureza,sub' });

    if (error) throw new BadRequestException(error.message);
    return { inserted: items.length };
  }

  async importarRetencoes(buffer: Buffer) {
    const rows = this.parseExcel(buffer).slice(1);
    const items = rows
      .filter((r) => r[0] && r[1])
      .map((r) => ({
        nome: String(r[0]).trim(),
        codigo: String(r[1]).trim(),
      }));

    if (!items.length) throw new BadRequestException('Nenhum registro válido encontrado');

    // Substitui todos (DELETE + INSERT)
    await this.supabase.from('retencoes').delete().neq('id', 0);
    const { error } = await this.supabase.from('retencoes').insert(items);
    if (error) throw new BadRequestException(error.message);
    return { inserted: items.length };
  }

  async importarFormasPagamento(buffer: Buffer) {
    const rows = this.parseExcel(buffer).slice(1);
    const items = rows
      .filter((r) => r[0])
      .map((r) => ({
        codigo: String(r[0]).trim(),
        descricao: String(r[1] || r[0]).trim(),
      }));

    if (!items.length) throw new BadRequestException('Nenhum registro válido encontrado');

    await this.supabase.from('formas_pagamento').delete().neq('id', 0);
    const { error } = await this.supabase.from('formas_pagamento').insert(items);
    if (error) throw new BadRequestException(error.message);
    return { inserted: items.length };
  }

  async importarEfd(buffer: Buffer) {
    const rows = this.parseExcel(buffer).slice(1);
    const items = rows
      .filter((r) => r[0])
      .map((r) => ({
        codigo: String(r[0]).trim(),
        descricao: String(r[1] || '').trim() || null,
      }));

    if (!items.length) throw new BadRequestException('Nenhum registro válido encontrado');

    const { error } = await this.supabase
      .from('efd')
      .upsert(items, { onConflict: 'codigo' });
    if (error) throw new BadRequestException(error.message);
    return { inserted: items.length };
  }
}
