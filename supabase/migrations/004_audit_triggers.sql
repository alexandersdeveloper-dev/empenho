-- ============================================================
-- Migração 004: Triggers de auditoria automática
-- Substitui o AuditInterceptor do NestJS por triggers
-- nativos do PostgreSQL.
--
-- Vantagens sobre o interceptor:
--   - Captura dados_antes (OLD) em UPDATE/DELETE
--   - Atômico: registra mesmo se a aplicação falhar
--   - Funciona com qualquer cliente (PostgREST, Edge Functions, etc.)
--
-- Tabelas monitoradas (dados operacionais e de configuração):
--   empenhos, credores, perfis, departamentos,
--   config_qr, campos_obrigatorios
--
-- NÃO monitoradas intencionalmente (importação em massa geraria
-- centenas de entradas por operação):
--   classificacao_orcamentaria, subelementos,
--   formas_pagamento, retencoes, efd
-- ============================================================

-- ─── Função genérica chamada por todos os triggers ───────────────────────────

CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registro_id TEXT;
  v_antes       JSONB;
  v_depois      JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_registro_id := NEW.id::TEXT;
    v_antes       := NULL;
    v_depois      := to_jsonb(NEW);

  ELSIF TG_OP = 'UPDATE' THEN
    v_registro_id := NEW.id::TEXT;
    v_antes       := to_jsonb(OLD);
    v_depois      := to_jsonb(NEW);

  ELSE -- DELETE
    v_registro_id := OLD.id::TEXT;
    v_antes       := to_jsonb(OLD);
    v_depois      := NULL;
  END IF;

  INSERT INTO audit_log (tabela, operacao, registro_id, dados_antes, dados_depois, usuario_id)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    v_registro_id,
    v_antes,
    v_depois,
    auth.uid()
  );

  -- Triggers AFTER não precisam retornar a linha modificada
  RETURN NULL;
END;
$$;

-- ─── Triggers por tabela ─────────────────────────────────────────────────────

CREATE OR REPLACE TRIGGER trg_audit_empenhos
  AFTER INSERT OR UPDATE OR DELETE ON empenhos
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE OR REPLACE TRIGGER trg_audit_credores
  AFTER INSERT OR UPDATE OR DELETE ON credores
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE OR REPLACE TRIGGER trg_audit_perfis
  AFTER INSERT OR UPDATE OR DELETE ON perfis
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE OR REPLACE TRIGGER trg_audit_departamentos
  AFTER INSERT OR UPDATE OR DELETE ON departamentos
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE OR REPLACE TRIGGER trg_audit_config_qr
  AFTER INSERT OR UPDATE OR DELETE ON config_qr
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE OR REPLACE TRIGGER trg_audit_campos_obrigatorios
  AFTER INSERT OR UPDATE OR DELETE ON campos_obrigatorios
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- ─── Atualiza política de INSERT no audit_log ────────────────────────────────
-- A função fn_audit_trigger roda como SECURITY DEFINER (postgres),
-- que ignora RLS. Mas quando a Edge Function inserir diretamente
-- (ex: registro de importação), precisa da policy abaixo.
-- A policy anterior já cobre isso — nenhuma alteração necessária.
