import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { normalizarNatureza, padSubelemento, gerarCodigoInterno } from '@ficha-empenho/shared';
import { SUPABASE_CLIENT } from '../../supabase.module';
import type { CreateEmpenhoDto, EmpenhoFiltrosDto, UpdateEmpenhoDto } from './dto/empenho.dto';
import { buildMeta } from '../../common/dtos/pagination.dto';
import type { Perfil } from '@ficha-empenho/shared';

@Injectable()
export class EmpenhosService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async listar(filtros: EmpenhoFiltrosDto, user: Perfil) {
    const { page, limit, q, interno, tipo, de, ate, departamento_id } = filtros;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('empenhos')
      .select(
        `*, departamento:departamentos(id,nome,sigla),
         descontos(*), liquidacoes(*, parcelas(*))`,
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Superadmin/admin vê todos; user/viewer vê só o próprio departamento
    if (!['superadmin', 'admin'].includes(user.role)) {
      query = query.eq('departamento_id', user.departamento_id);
    } else if (departamento_id) {
      query = query.eq('departamento_id', departamento_id);
    }

    if (q) {
      query = query.or(`numero_ficha.ilike.%${q}%,credor_nome.ilike.%${q}%`);
    }
    if (interno) query = query.ilike('codigo_interno', `%${interno}%`);
    if (tipo) query = query.eq('tipo_empenho', tipo);
    if (de) query = query.gte('data_empenho', de);
    if (ate) query = query.lte('data_empenho', ate);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      data,
      meta: buildMeta(page, limit, count ?? 0),
    };
  }

  async buscarPorId(id: number, user: Perfil) {
    const { data, error } = await this.supabase
      .from('empenhos')
      .select(`*, departamento:departamentos(id,nome,sigla), descontos(*), liquidacoes(*, parcelas(*))`)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Empenho não encontrado');
    this.verificarAcesso(data, user);
    return data;
  }

  async criar(dto: CreateEmpenhoDto, user: Perfil) {
    await this.validarSubelemento(dto);
    await this.validarCamposObrigatorios(dto);

    const departamentoId =
      ['superadmin', 'admin'].includes(user.role)
        ? (dto.departamento_id ?? user.departamento_id)
        : user.departamento_id;

    // Insert empenho
    const { data: empenho, error } = await this.supabase
      .from('empenhos')
      .insert({
        departamento_id: departamentoId,
        numero_ficha: dto.numero_ficha ?? null,
        projeto_atividade: dto.projeto_atividade ?? null,
        dotacao: dto.dotacao ?? null,
        stn: dto.stn ?? null,
        subelemento_codigo: dto.subelemento_codigo
          ? padSubelemento(dto.subelemento_codigo)
          : null,
        subelemento_descricao: dto.subelemento_descricao ?? null,
        credor_id: dto.credor_id ?? null,
        credor_numero: dto.credor_numero ?? null,
        credor_nome: dto.credor_nome ?? null,
        tipo_empenho: dto.tipo_empenho,
        historico: dto.historico ?? null,
        valor_empenho: dto.valor_empenho,
        emenda: dto.emenda ?? null,
        exercicio: dto.exercicio,
        numero_contrato: dto.numero_contrato ?? null,
        numero_convenio: dto.numero_convenio ?? null,
        data_empenho: dto.data_empenho ?? null,
        usuario_id: user.id,
        usuario_nome: user.nome,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // codigo_interno é gerado pelo trigger PostgreSQL automaticamente
    await this.salvarDescontos(empenho.id, dto.descontos ?? []);
    await this.salvarLiquidacao(empenho.id, dto.liquidacao ?? null);

    return this.buscarPorId(empenho.id, user);
  }

  async atualizar(id: number, dto: UpdateEmpenhoDto, user: Perfil) {
    const existing = await this.buscarPorId(id, user);
    this.verificarAcesso(existing, user);
    await this.validarSubelemento(dto);
    await this.validarCamposObrigatorios(dto);

    const { error } = await this.supabase
      .from('empenhos')
      .update({
        numero_ficha: dto.numero_ficha ?? null,
        projeto_atividade: dto.projeto_atividade ?? null,
        dotacao: dto.dotacao ?? null,
        stn: dto.stn ?? null,
        subelemento_codigo: dto.subelemento_codigo
          ? padSubelemento(dto.subelemento_codigo)
          : null,
        subelemento_descricao: dto.subelemento_descricao ?? null,
        credor_id: dto.credor_id ?? null,
        credor_numero: dto.credor_numero ?? null,
        credor_nome: dto.credor_nome ?? null,
        tipo_empenho: dto.tipo_empenho,
        historico: dto.historico ?? null,
        valor_empenho: dto.valor_empenho,
        emenda: dto.emenda ?? null,
        exercicio: dto.exercicio,
        numero_contrato: dto.numero_contrato ?? null,
        numero_convenio: dto.numero_convenio ?? null,
        data_empenho: dto.data_empenho ?? null,
      })
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);

    await this.salvarDescontos(id, dto.descontos ?? []);
    await this.salvarLiquidacao(id, dto.liquidacao ?? null);

    return this.buscarPorId(id, user);
  }

  async excluir(id: number, user: Perfil) {
    const existing = await this.buscarPorId(id, user);
    this.verificarAcesso(existing, user);

    // Cascade deletes handled by FK ON DELETE CASCADE in PostgreSQL
    const { error } = await this.supabase.from('empenhos').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { deleted: true, id };
  }

  // ─── Validações portadas do sistema legado ──────────────────────────────────

  private async validarSubelemento(dto: CreateEmpenhoDto) {
    if (!dto.dotacao || !dto.subelemento_codigo) return;

    const natureza = normalizarNatureza(dto.dotacao);
    const sub = padSubelemento(dto.subelemento_codigo);

    const { data } = await this.supabase
      .from('subelementos')
      .select('id')
      .eq('natureza', natureza)
      .eq('sub', sub)
      .maybeSingle();

    if (!data) {
      throw new BadRequestException(
        `Subelemento '${sub}' inválido para a natureza '${natureza}'`,
      );
    }
  }

  private async validarCamposObrigatorios(dto: CreateEmpenhoDto) {
    // Superávit (exercicio=2) bypassa validação de campos obrigatórios
    if (dto.exercicio === 2) return;

    const { data: config } = await this.supabase
      .from('campos_obrigatorios')
      .select('campos')
      .eq('id', 1)
      .single();

    if (!config?.campos) return;

    const obrig = config.campos
      .split(',')
      .map((c: string) => c.trim())
      .filter(Boolean);

    const erros = obrig.filter((campo: string) => {
      const val = (dto as Record<string, unknown>)[campo];
      return val === null || val === undefined || val === '' || val === 0;
    });

    if (erros.length) {
      throw new BadRequestException(
        `Campos obrigatórios não preenchidos: ${erros.join(', ')}`,
      );
    }
  }

  private async salvarDescontos(empenhoId: number, descontos: CreateEmpenhoDto['descontos']) {
    await this.supabase.from('descontos').delete().eq('empenho_id', empenhoId);
    if (!descontos.length) return;

    const rows = descontos
      .filter((d) => d.tipo || d.codigo || d.valor)
      .map((d, i) => ({
        empenho_id: empenhoId,
        tipo: d.tipo ?? null,
        codigo: d.codigo ?? null,
        valor: d.valor ?? 0,
        efd_codigo: d.efd_codigo ?? null,
        ord: i,
      }));

    if (rows.length) {
      const { error } = await this.supabase.from('descontos').insert(rows);
      if (error) throw new BadRequestException(error.message);
    }
  }

  private async salvarLiquidacao(empenhoId: number, liquidacao: CreateEmpenhoDto['liquidacao'] | null) {
    // Apaga liquidações e parcelas existentes (CASCADE)
    await this.supabase.from('liquidacoes').delete().eq('empenho_id', empenhoId);
    if (!liquidacao) return;

    const { data: liq, error } = await this.supabase
      .from('liquidacoes')
      .insert({
        empenho_id: empenhoId,
        valor: liquidacao.valor ?? 0,
        data_liquidacao: liquidacao.data_liquidacao ?? null,
        data_pagamento: liquidacao.data_pagamento ?? null,
        numero_op: liquidacao.numero_op ?? null,
        forma_pagamento: liquidacao.forma_pagamento ?? null,
        conta: liquidacao.conta ?? null,
        ord: 0,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    const parcelas = (liquidacao.parcelas ?? []).filter(
      (p) => p.valor || p.data || p.numero_op,
    );
    if (parcelas.length) {
      const parcelaRows = parcelas.map((p, i) => ({
        liquidacao_id: liq.id,
        valor: p.valor ?? 0,
        data: p.data ?? null,
        forma_pagamento: p.forma_pagamento ?? null,
        conta: p.conta ?? null,
        numero_op: p.numero_op ?? null,
        ord: i,
      }));
      const { error: pErr } = await this.supabase.from('parcelas').insert(parcelaRows);
      if (pErr) throw new BadRequestException(pErr.message);
    }
  }

  private verificarAcesso(empenho: Record<string, unknown>, user: Perfil) {
    if (['superadmin', 'admin'].includes(user.role)) return;
    if (empenho['departamento_id'] !== user.departamento_id) {
      throw new NotFoundException('Empenho não encontrado');
    }
  }
}
