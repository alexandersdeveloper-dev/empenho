import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS dinâmico ────────────────────────────────────────────────────────────
// Configure ALLOWED_ORIGINS no Supabase Dashboard → Edge Functions → Secrets
// Ex: ALLOWED_ORIGINS=https://fichas.parintins.am.gov.br
// Sem a variável, mantém '*' para não quebrar dev local.

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

// ─── Roles permitidas por hierarquia ─────────────────────────────────────────

const ROLES_ABAIXO: Record<string, string[]> = {
  superadmin: ['superadmin', 'admin', 'user', 'viewer'],
  admin:      ['user', 'viewer'],
};

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

    // ── Identifica o usuário via JWT ─────────────────────────────────────────

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return json({ error: 'Não autorizado' }, 401);

    // ── Cliente admin para operações privilegiadas ───────────────────────────

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ── Carrega perfil do chamador ───────────────────────────────────────────

    const { data: perfil } = await supabaseAdmin
      .from('perfis')
      .select('id, role, departamento_id, nome, ativo')
      .eq('id', user.id)
      .single();

    if (!perfil) return json({ error: 'Perfil não encontrado' }, 403);
    if (!perfil.ativo) return json({ error: 'Conta desativada' }, 403);
    if (!['admin', 'superadmin'].includes(perfil.role)) {
      return json({ error: 'Permissão insuficiente' }, 403);
    }

    // Seta contexto para os triggers de audit_log registrarem o usuário correto
    await supabaseAdmin.rpc('set_audit_context', {
      p_user_id:   perfil.id,
      p_user_nome: perfil.nome,
    });

    const body = await req.json();
    const { action } = body;

    // ─── Criar usuário ────────────────────────────────────────────────────────

    if (action === 'criar') {
      const { nome, email, password, role = 'user', departamento_id = null } = body;

      if (!nome || !email || !password) {
        return json({ error: 'nome, email e password são obrigatórios' }, 400);
      }

      // Validação de senha mínima (12 chars)
      if (typeof password === 'string' && password.length < 12) {
        return json({ error: 'Senha deve ter no mínimo 12 caracteres' }, 400);
      }

      // Admin só pode criar roles abaixo da sua — nunca iguais ou superiores
      const permitidas = ROLES_ABAIXO[perfil.role] ?? [];
      if (!permitidas.includes(role)) {
        return json(
          { error: `Role '${role}' não permitida. Você pode criar: ${permitidas.filter(r => r !== perfil.role).join(', ')}` },
          403,
        );
      }

      // Cria no Supabase Auth
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome, role },
      });

      if (createError) return json({ error: createError.message }, 400);

      // Cria perfil — em caso de falha, faz rollback do usuário no Auth
      const { error: perfilError } = await supabaseAdmin.from('perfis').upsert({
        id:             created.user.id,
        nome,
        role,
        departamento_id,
        ativo:          true,
      });

      if (perfilError) {
        await supabaseAdmin.auth.admin.deleteUser(created.user.id);
        return json({ error: `Falha ao criar perfil: ${perfilError.message}` }, 400);
      }

      return json({ data: { id: created.user.id } });
    }

    // ─── Atualizar usuário ────────────────────────────────────────────────────

    if (action === 'atualizar') {
      const { id, nome, role, departamento_id, ativo } = body;
      if (!id) return json({ error: 'id é obrigatório' }, 400);

      const { data: alvo } = await supabaseAdmin
        .from('perfis')
        .select('role, departamento_id')
        .eq('id', id)
        .single();

      if (!alvo) return json({ error: 'Usuário não encontrado' }, 404);

      // Valida nova role se informada
      if (role !== undefined) {
        const permitidas = ROLES_ABAIXO[perfil.role] ?? [];
        if (!permitidas.includes(role)) {
          return json({ error: `Sem permissão para atribuir a role '${role}'` }, 403);
        }
        // Admin não pode alterar usuário cuja role atual é igual ou superior à sua
        if (perfil.role === 'admin' && ['admin', 'superadmin'].includes(alvo.role)) {
          return json({ error: 'Sem permissão para alterar este usuário' }, 403);
        }
      }

      const patch: Record<string, unknown> = {};
      if (nome           !== undefined) patch.nome           = nome;
      if (role           !== undefined) patch.role           = role;
      if (departamento_id !== undefined) patch.departamento_id = departamento_id;
      if (ativo          !== undefined) patch.ativo          = ativo;

      const { error } = await supabaseAdmin.from('perfis').update(patch).eq('id', id);
      if (error) return json({ error: error.message }, 400);

      return json({ data: { ok: true } });
    }

    // ─── Desativar usuário ────────────────────────────────────────────────────

    if (action === 'desativar') {
      const { id } = body;
      if (!id) return json({ error: 'id é obrigatório' }, 400);
      if (id === user.id) return json({ error: 'Você não pode desativar sua própria conta' }, 400);

      const { data: alvo } = await supabaseAdmin
        .from('perfis')
        .select('role, departamento_id')
        .eq('id', id)
        .single();

      if (!alvo) return json({ error: 'Usuário não encontrado' }, 404);

      // Apenas superadmin pode desativar outro superadmin
      if (alvo.role === 'superadmin') {
        if (perfil.role !== 'superadmin') {
          return json({ error: 'Apenas superadmin pode desativar outro superadmin' }, 403);
        }
        // Protege o último superadmin ativo
        const { count } = await supabaseAdmin
          .from('perfis')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'superadmin')
          .eq('ativo', true);

        if ((count ?? 0) <= 1) {
          return json({ error: 'Não é possível desativar o único superadmin ativo' }, 400);
        }
      }

      // Admin só pode desativar user/viewer do próprio departamento
      if (perfil.role === 'admin') {
        if (['admin', 'superadmin'].includes(alvo.role)) {
          return json({ error: 'Sem permissão para desativar este usuário' }, 403);
        }
        if (alvo.departamento_id !== perfil.departamento_id) {
          return json({ error: 'Sem permissão para desativar usuário de outro departamento' }, 403);
        }
      }

      const { error } = await supabaseAdmin
        .from('perfis')
        .update({ ativo: false })
        .eq('id', id);

      if (error) return json({ error: error.message }, 400);
      return json({ data: { ok: true } });
    }

    return json({ error: 'Ação inválida' }, 400);

  } catch (err) {
    return json({ error: (err as Error).message ?? 'Erro interno' }, 500);
  }
});
