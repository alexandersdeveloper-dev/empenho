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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Não autorizado' }, 401);

    // Cliente com JWT do usuário (para identificar quem está chamando)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return json({ error: 'Não autorizado' }, 401);

    // Cliente admin (service_role) para operações privilegiadas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verifica role do chamador
    const { data: perfil } = await supabaseAdmin
      .from('perfis')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!perfil || !['admin', 'superadmin'].includes(perfil.role)) {
      return json({ error: 'Permissão insuficiente' }, 403);
    }

    const body = await req.json();
    const { action } = body;

    // ─── Criar usuário ────────────────────────────────────────────────────────

    if (action === 'criar') {
      const { nome, email, password, role = 'user', departamento_id = null } = body;

      if (!nome || !email || !password) {
        return json({ error: 'nome, email e password são obrigatórios' }, 400);
      }

      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome, role },
      });

      if (createError) return json({ error: createError.message }, 400);

      const { error: perfilError } = await supabaseAdmin.from('perfis').upsert({
        id: created.user.id,
        nome,
        role,
        departamento_id,
        ativo: true,
      });

      if (perfilError) return json({ error: perfilError.message }, 400);

      return json({ data: { id: created.user.id } });
    }

    // ─── Desativar usuário ────────────────────────────────────────────────────

    if (action === 'desativar') {
      const { id } = body;

      if (!id) return json({ error: 'id é obrigatório' }, 400);

      if (id === user.id) {
        return json({ error: 'Você não pode desativar sua própria conta' }, 400);
      }

      // Impede desativar o último superadmin ativo
      if (perfil.role === 'superadmin') {
        const { data: alvo } = await supabaseAdmin
          .from('perfis')
          .select('role')
          .eq('id', id)
          .single();

        if (alvo?.role === 'superadmin') {
          const { count } = await supabaseAdmin
            .from('perfis')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'superadmin')
            .eq('ativo', true);

          if ((count ?? 0) <= 1) {
            return json({ error: 'Não é possível desativar o único superadmin ativo' }, 400);
          }
        }
      }

      const { error: updateError } = await supabaseAdmin
        .from('perfis')
        .update({ ativo: false })
        .eq('id', id);

      if (updateError) return json({ error: updateError.message }, 400);

      return json({ data: { ok: true } });
    }

    return json({ error: 'Ação inválida' }, 400);

  } catch (err) {
    return json({ error: (err as Error).message ?? 'Erro interno' }, 500);
  }
});
