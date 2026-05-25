import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ─── Utilitários portados de @ficha-empenho/shared ───────────────────────────

function normalizarNatureza(s: string | null | undefined): string {
  if (!s || typeof s !== 'string') return '';
  const parts = String(s).trim().split('.').filter(Boolean);
  if (parts.length < 4) return String(s).trim();
  return (
    parts[0] + '.' + parts[1] + '.' +
    String(parts[2]).padStart(2, '0') + '.' +
    String(parts[3]).padStart(2, '0')
  );
}

function padSubelemento(sub: string | null | undefined): string {
  if (!sub) return '';
  return String(sub).trim().padStart(2, '0');
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Desconto = {
  tipo?: string | null;
  codigo?: string | null;
  valor?: number;
  efd_codigo?: string | null;
};

type Parcela = {
  valor?: number;
  data?: string | null;
  forma_pagamento?: string | null;
  conta?: string | null;
  numero_op?: string | null;
};

type Liquidacao = {
  valor?: number;
  data_liquidacao?: string | null;
  data_pagamento?: string | null;
  numero_op?: string | null;
  forma_pagamento?: string | null;
  conta?: string | null;
  parcelas?: Parcela[];
};

type EmpenhoDto = {
  departamento_id?: number | null;
  numero_ficha?: string | null;
  projeto_atividade?: string | null;
  dotacao?: string | null;
  stn?: string | null;
  subelemento_codigo?: string | null;
  subelemento_descricao?: string | null;
  credor_id?: number | null;
  credor_numero?: string | null;
  credor_nome?: string | null;
  tipo_empenho: number;
  historico?: string | null;
  valor_empenho: number;
  emenda?: number | null;
  exercicio: number;
  numero_contrato?: string | null;
  numero_convenio?: string | null;
  data_empenho?: string | null;
  descontos?: Desconto[];
  liquidacao?: Liquidacao | null;
};

// ─── Validações ───────────────────────────────────────────────────────────────

async function validarSubelemento(
  supabase: ReturnType<typeof createClient>,
  dto: EmpenhoDto,
) {
  if (!dto.dotacao || !dto.subelemento_codigo) return;

  const natureza = normalizarNatureza(dto.dotacao);
  const sub = padSubelemento(dto.subelemento_codigo);

  const { data } = await supabase
    .from('subelementos')
    .select('id')
    .eq('natureza', natureza)
    .eq('sub', sub)
    .maybeSingle();

  if (!data) {
    throw new Error(`Subelemento '${sub}' inválido para a natureza '${natureza}'`);
  }
}

async function validarCamposObrigatorios(
  supabase: ReturnType<typeof createClient>,
  dto: EmpenhoDto,
) {
  if (dto.exercicio === 2) return; // Superávit bypassa validação

  const { data: config } = await supabase
    .from('campos_obrigatorios')
    .select('campos')
    .eq('id', 1)
    .single();

  if (!config?.campos) return;

  const obrig = config.campos.split(',').map((c: string) => c.trim()).filter(Boolean);
  const erros = obrig.filter((campo: string) => {
    const val = (dto as unknown as Record<string, unknown>)[campo];
    return val === null || val === undefined || val === '' || val === 0;
  });

  if (erros.length) {
    throw new Error(`Campos obrigatórios não preenchidos: ${erros.join(', ')}`);
  }
}

async function salvarDescontos(
  supabase: ReturnType<typeof createClient>,
  empenhoId: number,
  descontos: Desconto[],
) {
  await supabase.from('descontos').delete().eq('empenho_id', empenhoId);
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
    const { error } = await supabase.from('descontos').insert(rows);
    if (error) throw new Error(error.message);
  }
}

async function salvarLiquidacao(
  supabase: ReturnType<typeof createClient>,
  empenhoId: number,
  liquidacao: Liquidacao | null | undefined,
) {
  await supabase.from('liquidacoes').delete().eq('empenho_id', empenhoId);
  if (!liquidacao) return;

  const { data: liq, error } = await supabase
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

  if (error) throw new Error(error.message);

  const parcelas = (liquidacao.parcelas ?? []).filter(
    (p) => p.valor || p.data || p.numero_op,
  );
  if (parcelas.length) {
    const rows = parcelas.map((p, i) => ({
      liquidacao_id: liq.id,
      valor: p.valor ?? 0,
      data: p.data ?? null,
      forma_pagamento: p.forma_pagamento ?? null,
      conta: p.conta ?? null,
      numero_op: p.numero_op ?? null,
      ord: i,
    }));
    const { error: pErr } = await supabase.from('parcelas').insert(rows);
    if (pErr) throw new Error(pErr.message);
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Não autorizado' }, 401);

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return json({ error: 'Não autorizado' }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Busca perfil do usuário autenticado
    const { data: perfil } = await supabaseAdmin
      .from('perfis')
      .select('id, role, departamento_id, nome')
      .eq('id', user.id)
      .single();

    if (!perfil) return json({ error: 'Perfil não encontrado' }, 403);
    if (perfil.role === 'viewer') return json({ error: 'Sem permissão para esta operação' }, 403);

    const body = await req.json();
    const { action, id, dto }: { action: string; id?: number; dto: EmpenhoDto } = body;

    // ─── Criar ───────────────────────────────────────────────────────────────

    if (action === 'criar') {
      await validarSubelemento(supabaseAdmin, dto);
      await validarCamposObrigatorios(supabaseAdmin, dto);

      const departamentoId =
        ['superadmin', 'admin'].includes(perfil.role)
          ? (dto.departamento_id ?? perfil.departamento_id)
          : perfil.departamento_id;

      const { data: empenho, error } = await supabaseAdmin
        .from('empenhos')
        .insert({
          departamento_id: departamentoId,
          numero_ficha: dto.numero_ficha ?? null,
          projeto_atividade: dto.projeto_atividade ?? null,
          dotacao: dto.dotacao ?? null,
          stn: dto.stn ?? null,
          subelemento_codigo: dto.subelemento_codigo ? padSubelemento(dto.subelemento_codigo) : null,
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
          usuario_id: perfil.id,
          usuario_nome: perfil.nome,
        })
        .select()
        .single();

      if (error) return json({ error: error.message }, 400);

      await salvarDescontos(supabaseAdmin, empenho.id, dto.descontos ?? []);
      await salvarLiquidacao(supabaseAdmin, empenho.id, dto.liquidacao ?? null);

      // Retorna o empenho completo com relações
      const { data: completo } = await supabaseAdmin
        .from('empenhos')
        .select('*, departamento:departamentos(*), descontos(*), liquidacoes(*, parcelas(*))')
        .eq('id', empenho.id)
        .single();

      return json({ data: completo });
    }

    // ─── Atualizar ────────────────────────────────────────────────────────────

    if (action === 'atualizar') {
      if (!id) return json({ error: 'id é obrigatório' }, 400);

      // Verifica acesso ao empenho
      const { data: existing } = await supabaseAdmin
        .from('empenhos')
        .select('departamento_id')
        .eq('id', id)
        .single();

      if (!existing) return json({ error: 'Empenho não encontrado' }, 404);

      if (
        !['superadmin', 'admin'].includes(perfil.role) &&
        existing.departamento_id !== perfil.departamento_id
      ) {
        return json({ error: 'Empenho não encontrado' }, 404);
      }

      await validarSubelemento(supabaseAdmin, dto);
      await validarCamposObrigatorios(supabaseAdmin, dto);

      const { error } = await supabaseAdmin
        .from('empenhos')
        .update({
          numero_ficha: dto.numero_ficha ?? null,
          projeto_atividade: dto.projeto_atividade ?? null,
          dotacao: dto.dotacao ?? null,
          stn: dto.stn ?? null,
          subelemento_codigo: dto.subelemento_codigo ? padSubelemento(dto.subelemento_codigo) : null,
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

      if (error) return json({ error: error.message }, 400);

      await salvarDescontos(supabaseAdmin, id, dto.descontos ?? []);
      await salvarLiquidacao(supabaseAdmin, id, dto.liquidacao ?? null);

      const { data: completo } = await supabaseAdmin
        .from('empenhos')
        .select('*, departamento:departamentos(*), descontos(*), liquidacoes(*, parcelas(*))')
        .eq('id', id)
        .single();

      return json({ data: completo });
    }

    return json({ error: 'Ação inválida' }, 400);

  } catch (err) {
    return json({ error: (err as Error).message ?? 'Erro interno' }, 500);
  }
});
