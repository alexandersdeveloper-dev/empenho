-- ============================================================
-- Migração 003: Hardening de Segurança
-- Aplicar no Supabase SQL Editor em ordem.
-- ============================================================

-- ─── 1. Corrigir search_path em funções SECURITY DEFINER ─────────────────────
-- Sem SET search_path, funções SECURITY DEFINER são vulneráveis a
-- ataques de schema hijacking (ex: criar public.auth para interceptar chamadas).

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT role FROM perfis WHERE id = auth.uid()
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION auth_departamento_id()
RETURNS BIGINT STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT departamento_id FROM perfis WHERE id = auth.uid()
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfis
    WHERE id = auth.uid()
    AND role IN ('superadmin','admin')
  )
$$ LANGUAGE sql;

-- ─── 2. Remover política de INSERT insegura no audit_log ─────────────────────
-- Qualquer usuário autenticado podia injetar registros forjados no log.
-- A escrita passa a ser feita EXCLUSIVAMENTE via triggers SECURITY DEFINER.

DROP POLICY IF EXISTS "audit_log_insert" ON audit_log;

-- ─── 3. Função para Edge Functions definirem contexto de auditoria ────────────
-- Edge Functions usam service_role (auth.uid() = NULL).
-- Antes de qualquer mutação, chamam set_audit_context() para que o trigger
-- consiga atribuir a operação ao usuário correto.

CREATE OR REPLACE FUNCTION set_audit_context(p_user_id UUID, p_user_nome TEXT DEFAULT '')
RETURNS VOID SECURITY DEFINER
SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM set_config('app.current_user_id',   COALESCE(p_user_id::text, ''), true);
  PERFORM set_config('app.current_user_nome',  COALESCE(p_user_nome, ''),    true);
END;
$$ LANGUAGE plpgsql;

-- ─── 4. Trigger genérico de auditoria ────────────────────────────────────────
-- Captura automaticamente INSERT/UPDATE/DELETE nas tabelas críticas.
-- O bloco EXCEPTION garante que uma falha no audit nunca bloqueie a operação principal.

CREATE OR REPLACE FUNCTION registrar_audit()
RETURNS TRIGGER SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  v_usuario_id UUID;
  v_registro_id TEXT;
BEGIN
  BEGIN
    -- Prioridade: JWT do PostgREST → contexto setado pela Edge Function
    v_usuario_id := COALESCE(
      auth.uid(),
      NULLIF(current_setting('app.current_user_id', true), '')::UUID
    );

    v_registro_id := CASE
      WHEN TG_OP = 'DELETE' THEN (to_jsonb(OLD) ->> 'id')
      ELSE                       (to_jsonb(NEW) ->> 'id')
    END;

    INSERT INTO public.audit_log (
      tabela, operacao, registro_id,
      dados_antes, dados_depois, usuario_id
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      v_registro_id,
      CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
      v_usuario_id
    );
  EXCEPTION WHEN OTHERS THEN
    -- Nunca bloqueia a operação principal se o audit falhar
    NULL;
  END;

  RETURN NULL; -- AFTER trigger: retorno ignorado
END;
$$ LANGUAGE plpgsql;

-- ─── 5. Triggers de auditoria automática ─────────────────────────────────────

DROP TRIGGER IF EXISTS audit_empenhos          ON empenhos;
DROP TRIGGER IF EXISTS audit_perfis            ON perfis;
DROP TRIGGER IF EXISTS audit_departamentos     ON departamentos;
DROP TRIGGER IF EXISTS audit_config_qr         ON config_qr;
DROP TRIGGER IF EXISTS audit_campos_obrigatorios ON campos_obrigatorios;

CREATE TRIGGER audit_empenhos
  AFTER INSERT OR UPDATE OR DELETE ON empenhos
  FOR EACH ROW EXECUTE FUNCTION registrar_audit();

CREATE TRIGGER audit_perfis
  AFTER INSERT OR UPDATE OR DELETE ON perfis
  FOR EACH ROW EXECUTE FUNCTION registrar_audit();

CREATE TRIGGER audit_departamentos
  AFTER INSERT OR UPDATE OR DELETE ON departamentos
  FOR EACH ROW EXECUTE FUNCTION registrar_audit();

CREATE TRIGGER audit_config_qr
  AFTER UPDATE ON config_qr
  FOR EACH ROW EXECUTE FUNCTION registrar_audit();

CREATE TRIGGER audit_campos_obrigatorios
  AFTER UPDATE ON campos_obrigatorios
  FOR EACH ROW EXECUTE FUNCTION registrar_audit();

-- ─── 6. RPCs transacionais para operações destrutivas do import ───────────────
-- Evita que DELETE + INSERT falhe a meio, deixando tabelas vazias.

CREATE OR REPLACE FUNCTION substituir_retencoes(p_items JSONB)
RETURNS INTEGER SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM retencoes;
  INSERT INTO retencoes (nome, codigo)
    SELECT
      elem->>'nome',
      elem->>'codigo'
    FROM jsonb_array_elements(p_items) AS elem
    WHERE (elem->>'nome')   IS NOT NULL
      AND (elem->>'codigo') IS NOT NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION substituir_formas_pagamento(p_items JSONB)
RETURNS INTEGER SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM formas_pagamento;
  INSERT INTO formas_pagamento (codigo, descricao)
    SELECT
      elem->>'codigo',
      elem->>'descricao'
    FROM jsonb_array_elements(p_items) AS elem
    WHERE (elem->>'codigo') IS NOT NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
