-- ============================================================
-- Migração 002: Row Level Security (RLS) e Políticas de Acesso
-- ============================================================

-- ─── Habilitar RLS em todas as tabelas ───────────────────────────────────────

ALTER TABLE departamentos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE credores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE classificacao_orcamentaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE subelementos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE retencoes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE formas_pagamento       ENABLE ROW LEVEL SECURITY;
ALTER TABLE efd                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE empenhos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE descontos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidacoes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_qr              ENABLE ROW LEVEL SECURITY;
ALTER TABLE campos_obrigatorios    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log              ENABLE ROW LEVEL SECURITY;

-- ─── Funções auxiliares de role ───────────────────────────────────────────────

-- Retorna a role do usuário autenticado
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT STABLE SECURITY DEFINER AS $$
  SELECT role FROM perfis WHERE id = auth.uid()
$$ LANGUAGE sql;

-- Retorna o departamento_id do usuário autenticado
CREATE OR REPLACE FUNCTION auth_departamento_id()
RETURNS BIGINT STABLE SECURITY DEFINER AS $$
  SELECT departamento_id FROM perfis WHERE id = auth.uid()
$$ LANGUAGE sql;

-- Verifica se o usuário tem role admin ou superadmin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfis
    WHERE id = auth.uid()
    AND role IN ('superadmin','admin')
  )
$$ LANGUAGE sql;

-- ─── Departamentos ────────────────────────────────────────────────────────────

CREATE POLICY "departamentos_leitura" ON departamentos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "departamentos_escrita" ON departamentos
  FOR ALL USING (is_admin());

-- ─── Perfis ───────────────────────────────────────────────────────────────────

-- Usuário pode ler o próprio perfil; admin lê todos
CREATE POLICY "perfis_select" ON perfis
  FOR SELECT USING (
    id = auth.uid()
    OR is_admin()
  );

-- Apenas admin cria/edita/remove perfis
CREATE POLICY "perfis_insert" ON perfis
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "perfis_update" ON perfis
  FOR UPDATE USING (
    id = auth.uid()         -- pode editar o próprio
    OR is_admin()
  );

CREATE POLICY "perfis_delete" ON perfis
  FOR DELETE USING (is_admin());

-- ─── Dados de referência (credores, classificação, subelementos, etc.) ────────
-- Leitura: qualquer usuário autenticado
-- Escrita: somente admin/superadmin

CREATE POLICY "credores_select" ON credores
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "credores_write" ON credores
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "classificacao_select" ON classificacao_orcamentaria
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "classificacao_write" ON classificacao_orcamentaria
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "subelementos_select" ON subelementos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "subelementos_write" ON subelementos
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "retencoes_select" ON retencoes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "retencoes_write" ON retencoes
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "formas_pagamento_select" ON formas_pagamento
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "formas_pagamento_write" ON formas_pagamento
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "efd_select" ON efd
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "efd_write" ON efd
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- ─── Empenhos: isolamento por departamento ────────────────────────────────────

CREATE POLICY "empenhos_select" ON empenhos
  FOR SELECT USING (
    -- superadmin/admin vê todos
    is_admin()
    OR
    -- user/viewer vê apenas o próprio departamento
    departamento_id = auth_departamento_id()
  );

CREATE POLICY "empenhos_insert" ON empenhos
  FOR INSERT WITH CHECK (
    auth_role() IN ('superadmin','admin','user')
    AND (
      is_admin()
      OR departamento_id = auth_departamento_id()
    )
  );

CREATE POLICY "empenhos_update" ON empenhos
  FOR UPDATE USING (
    auth_role() IN ('superadmin','admin','user')
    AND (
      is_admin()
      OR departamento_id = auth_departamento_id()
    )
  );

CREATE POLICY "empenhos_delete" ON empenhos
  FOR DELETE USING (
    auth_role() IN ('superadmin','admin','user')
    AND (
      is_admin()
      OR departamento_id = auth_departamento_id()
    )
  );

-- ─── Descontos, Liquidações, Parcelas: herdam isolamento do empenho pai ───────

CREATE POLICY "descontos_select" ON descontos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM empenhos e
      WHERE e.id = empenho_id
      AND (is_admin() OR e.departamento_id = auth_departamento_id())
    )
  );

CREATE POLICY "descontos_write" ON descontos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM empenhos e
      WHERE e.id = empenho_id
      AND (is_admin() OR e.departamento_id = auth_departamento_id())
      AND auth_role() IN ('superadmin','admin','user')
    )
  );

CREATE POLICY "liquidacoes_select" ON liquidacoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM empenhos e
      WHERE e.id = empenho_id
      AND (is_admin() OR e.departamento_id = auth_departamento_id())
    )
  );

CREATE POLICY "liquidacoes_write" ON liquidacoes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM empenhos e
      WHERE e.id = empenho_id
      AND (is_admin() OR e.departamento_id = auth_departamento_id())
      AND auth_role() IN ('superadmin','admin','user')
    )
  );

CREATE POLICY "parcelas_select" ON parcelas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM liquidacoes l
      JOIN empenhos e ON e.id = l.empenho_id
      WHERE l.id = liquidacao_id
      AND (is_admin() OR e.departamento_id = auth_departamento_id())
    )
  );

CREATE POLICY "parcelas_write" ON parcelas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM liquidacoes l
      JOIN empenhos e ON e.id = l.empenho_id
      WHERE l.id = liquidacao_id
      AND (is_admin() OR e.departamento_id = auth_departamento_id())
      AND auth_role() IN ('superadmin','admin','user')
    )
  );

-- ─── Config QR e Campos Obrigatórios ─────────────────────────────────────────

CREATE POLICY "config_qr_select" ON config_qr
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "config_qr_write" ON config_qr
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "campos_obrigatorios_select" ON campos_obrigatorios
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "campos_obrigatorios_write" ON campos_obrigatorios
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- ─── Audit Log ────────────────────────────────────────────────────────────────
-- INSERT: qualquer usuário autenticado (o backend usa service_role key)
-- SELECT: apenas admin/superadmin
-- UPDATE/DELETE: proibido para todos

CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT USING (is_admin());
-- Sem policy de UPDATE ou DELETE → bloqueado por padrão com RLS
