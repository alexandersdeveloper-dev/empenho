import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// xlsx@0.18.5 (esm.sh) — versão mais recente disponível no npm.
// NOTA: CVE-2023-30533 (prototype pollution) existe nesta versão.
// A correção (0.20.x) só está no CDN oficial SheetJS, bloqueado pelo bundler do Supabase.
// Risco mitigado: apenas admins autenticados podem enviar arquivos.
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

// ─── CORS dinâmico ────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',').map((s) => s.trim()).filter(Boolean);

function corsHeaders(origin: string) {
  const allowed =
    ALLOWED_ORIGINS.length === 0 ? '*' :
    ALLOWED_ORIGINS.includes(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// ─── Constantes de validação ──────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
  'text/plain', // alguns sistemas enviam CSV como text/plain
]);

// ─── Utilidades ───────────────────────────────────────────────────────────────

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

function parseSheet(buffer: ArrayBuffer): unknown[][] {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
}

// ─── Handler principal ────────────────────────────────────────────────────────

serve(async (req) => {
  const origin = req.headers.get('origin') ?? '';
  const CORS   = corsHeaders(origin);

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

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

    const { data: perfil } = await supabaseAdmin
      .from('perfis')
      .select('id, role, nome')
      .eq('id', user.id)
      .single();

    if (!perfil || !['admin', 'superadmin'].includes(perfil.role)) {
      return json({ error: 'Permissão insuficiente' }, 403);
    }

    // Seta contexto de auditoria
    await supabaseAdmin.rpc('set_audit_context', {
      p_user_id:   perfil.id,
      p_user_nome: perfil.nome,
    });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const tipo = formData.get('tipo') as string | null;

    if (!file) return json({ error: 'Arquivo não enviado' }, 400);
    if (!tipo) return json({ error: 'Tipo de importação não informado' }, 400);

    // ── Validação de tamanho ──────────────────────────────────────────────────

    if (file.size > MAX_FILE_SIZE) {
      return json({ error: 'Arquivo muito grande. Máximo permitido: 5 MB' }, 400);
    }

    // ── Validação de tipo MIME ────────────────────────────────────────────────
    // Verifica tanto o tipo declarado quanto a extensão do nome do arquivo

    const ext = (file.name ?? '').split('.').pop()?.toLowerCase() ?? '';
    const extValida = ['xlsx', 'xls', 'csv'].includes(ext);
    const mimeValido = !file.type || ALLOWED_MIME.has(file.type);

    if (!extValida && !mimeValido) {
      return json({ error: 'Tipo de arquivo inválido. Use .xlsx, .xls ou .csv' }, 400);
    }
    if (!extValida) {
      return json({ error: 'Extensão inválida. Use .xlsx, .xls ou .csv' }, 400);
    }

    const buffer = await file.arrayBuffer();
    const rows = parseSheet(buffer).slice(1); // descarta cabeçalho

    // ── Tipos de importação ───────────────────────────────────────────────────

    if (tipo === 'classificacao') {
      const items = rows
        .filter((r) => r[0])
        .map((r) => ({
          numero_ficha:      String(r[0]).trim(),
          projeto_atividade: String(r[1] || '').trim() || null,
          dotacao:           String(r[2] || '').trim() || null,
          stn:               String(r[3] || '').trim() || null,
        }));

      if (!items.length) return json({ error: 'Nenhum registro válido encontrado' }, 400);

      const { error } = await supabaseAdmin
        .from('classificacao_orcamentaria')
        .upsert(items, { onConflict: 'numero_ficha' });

      if (error) return json({ error: error.message }, 400);
      return json({ inserted: items.length });
    }

    if (tipo === 'credores') {
      const items = rows
        .filter((r) => r[1])
        .map((r) => ({
          numero: String(r[0] || '').trim() || null,
          nome:   String(r[1]).trim(),
        }));

      if (!items.length) return json({ error: 'Nenhum registro válido encontrado' }, 400);

      const { error } = await supabaseAdmin
        .from('credores')
        .upsert(items, { onConflict: 'numero' });

      if (error) return json({ error: error.message }, 400);
      return json({ inserted: items.length });
    }

    if (tipo === 'subelementos') {
      const items = rows
        .filter((r) => r[0] && r[1])
        .map((r) => ({
          natureza:  normalizarNatureza(String(r[0]).trim()),
          sub:       String(r[1]).trim().padStart(2, '0'),
          descricao: String(r[2] || '').trim() || null,
        }));

      if (!items.length) return json({ error: 'Nenhum registro válido encontrado' }, 400);

      const { error } = await supabaseAdmin
        .from('subelementos')
        .upsert(items, { onConflict: 'natureza,sub' });

      if (error) return json({ error: error.message }, 400);
      return json({ inserted: items.length });
    }

    if (tipo === 'retencoes') {
      const items = rows
        .filter((r) => r[0] && r[1])
        .map((r) => ({
          nome:   String(r[0]).trim(),
          codigo: String(r[1]).trim(),
        }));

      if (!items.length) return json({ error: 'Nenhum registro válido encontrado' }, 400);

      // Operação atômica via RPC Postgres (evita tabela vazia em caso de erro)
      const { data: count, error } = await supabaseAdmin
        .rpc('substituir_retencoes', { p_items: JSON.stringify(items) });

      if (error) return json({ error: error.message }, 400);
      return json({ inserted: count });
    }

    if (tipo === 'formas_pagamento') {
      const items = rows
        .filter((r) => r[0])
        .map((r) => ({
          codigo:   String(r[0]).trim(),
          descricao: String(r[1] || r[0]).trim(),
        }));

      if (!items.length) return json({ error: 'Nenhum registro válido encontrado' }, 400);

      // Operação atômica via RPC Postgres
      const { data: count, error } = await supabaseAdmin
        .rpc('substituir_formas_pagamento', { p_items: JSON.stringify(items) });

      if (error) return json({ error: error.message }, 400);
      return json({ inserted: count });
    }

    if (tipo === 'efd') {
      const items = rows
        .filter((r) => r[0])
        .map((r) => ({
          codigo:   String(r[0]).trim(),
          descricao: String(r[1] || '').trim() || null,
        }));

      if (!items.length) return json({ error: 'Nenhum registro válido encontrado' }, 400);

      const { error } = await supabaseAdmin
        .from('efd')
        .upsert(items, { onConflict: 'codigo' });

      if (error) return json({ error: error.message }, 400);
      return json({ inserted: items.length });
    }

    return json({ error: 'Tipo de importação inválido' }, 400);

  } catch (err) {
    return json({ error: (err as Error).message ?? 'Erro interno' }, 500);
  }
});
