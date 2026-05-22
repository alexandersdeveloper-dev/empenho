-- ============================================================
-- Migração 001: Schema inicial do sistema de fichas de empenho
-- Prefeitura Municipal de Parintins
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- busca fuzzy em texto
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- busca sem acento

-- ─── Departamentos ────────────────────────────────────────────────────────────

CREATE TABLE departamentos (
  id          BIGSERIAL PRIMARY KEY,
  nome        TEXT      NOT NULL,
  sigla       TEXT      UNIQUE,
  ativo       BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Perfis de Usuário ────────────────────────────────────────────────────────
-- Espelha auth.users do Supabase. Criado via trigger após signup.

CREATE TABLE perfis (
  id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome             TEXT        NOT NULL,
  role             TEXT        NOT NULL DEFAULT 'user'
                               CHECK (role IN ('superadmin','admin','user','viewer')),
  departamento_id  BIGINT      REFERENCES departamentos(id) ON DELETE SET NULL,
  ativo            BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER perfis_updated_at
  BEFORE UPDATE ON perfis
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Credores ─────────────────────────────────────────────────────────────────

CREATE TABLE credores (
  id          BIGSERIAL PRIMARY KEY,
  numero      TEXT      UNIQUE,
  nome        TEXT      NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credores_nome_trgm ON credores USING gin (nome gin_trgm_ops);
CREATE INDEX idx_credores_numero    ON credores (numero) WHERE numero IS NOT NULL;

-- ─── Classificação Orçamentária ───────────────────────────────────────────────

CREATE TABLE classificacao_orcamentaria (
  id                 BIGSERIAL PRIMARY KEY,
  numero_ficha       TEXT      NOT NULL UNIQUE,
  projeto_atividade  TEXT,
  dotacao            TEXT,
  stn                TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_classificacao_ficha ON classificacao_orcamentaria (numero_ficha);

-- ─── Subelementos ─────────────────────────────────────────────────────────────

CREATE TABLE subelementos (
  id          BIGSERIAL PRIMARY KEY,
  natureza    TEXT      NOT NULL,
  sub         TEXT      NOT NULL,
  descricao   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (natureza, sub)
);

CREATE INDEX idx_subelementos_natureza ON subelementos (natureza);

-- ─── Retenções ────────────────────────────────────────────────────────────────

CREATE TABLE retencoes (
  id          BIGSERIAL PRIMARY KEY,
  nome        TEXT      NOT NULL,
  codigo      TEXT      NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_retencoes_nome_trgm ON retencoes USING gin (nome gin_trgm_ops);

-- ─── Formas de Pagamento ──────────────────────────────────────────────────────

CREATE TABLE formas_pagamento (
  id          BIGSERIAL PRIMARY KEY,
  codigo      TEXT      NOT NULL UNIQUE,
  descricao   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dados padrão (mesmos do sistema legado)
INSERT INTO formas_pagamento (codigo) VALUES
  ('TR'), ('TED'), ('BOL'), ('GPS'), ('DARF'),
  ('D.A'), ('REM'), ('BLOQ'), ('FAT'), ('PIX')
ON CONFLICT (codigo) DO NOTHING;

-- ─── Códigos EFD ─────────────────────────────────────────────────────────────
-- (existia no código do sistema legado mas não no schema — corrigido aqui)

CREATE TABLE efd (
  id          BIGSERIAL PRIMARY KEY,
  codigo      TEXT      NOT NULL UNIQUE,
  descricao   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_efd_codigo_trgm ON efd USING gin (codigo gin_trgm_ops);

-- ─── Empenhos ─────────────────────────────────────────────────────────────────

CREATE TABLE empenhos (
  id                      BIGSERIAL   PRIMARY KEY,
  codigo_interno          TEXT        UNIQUE,   -- gerado após insert: E000001
  departamento_id         BIGINT      REFERENCES departamentos(id) ON DELETE RESTRICT,
  numero_ficha            TEXT,
  projeto_atividade       TEXT,
  dotacao                 TEXT,
  stn                     TEXT,
  subelemento_codigo      TEXT,
  subelemento_descricao   TEXT,
  credor_id               BIGINT      REFERENCES credores(id) ON DELETE RESTRICT,
  credor_numero           TEXT,                 -- desnormalizado para histórico
  credor_nome             TEXT,                 -- desnormalizado para histórico
  tipo_empenho            SMALLINT    NOT NULL DEFAULT 1
                                      CHECK (tipo_empenho IN (1, 2, 3)),
  historico               TEXT,
  valor_empenho           NUMERIC(15,2) NOT NULL DEFAULT 0,
  emenda                  INTEGER,
  exercicio               SMALLINT    NOT NULL DEFAULT 1
                                      CHECK (exercicio IN (1, 2)),
  numero_contrato         TEXT,
  numero_convenio         TEXT,
  data_empenho            DATE,
  usuario_id              UUID        REFERENCES perfis(id) ON DELETE SET NULL,
  usuario_nome            TEXT,                 -- desnormalizado para histórico
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_empenhos_departamento_data  ON empenhos (departamento_id, data_empenho DESC);
CREATE INDEX idx_empenhos_credor             ON empenhos (credor_id);
CREATE INDEX idx_empenhos_codigo_interno     ON empenhos (codigo_interno);
CREATE INDEX idx_empenhos_numero_ficha       ON empenhos (numero_ficha) WHERE numero_ficha IS NOT NULL;
CREATE INDEX idx_empenhos_usuario            ON empenhos (usuario_id);
CREATE INDEX idx_empenhos_created_at         ON empenhos (created_at DESC);

CREATE TRIGGER empenhos_updated_at
  BEFORE UPDATE ON empenhos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: gera codigo_interno automaticamente após INSERT
CREATE OR REPLACE FUNCTION gerar_codigo_interno()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE empenhos
  SET codigo_interno = 'E' || LPAD(NEW.id::TEXT, 6, '0')
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER empenhos_codigo_interno
  AFTER INSERT ON empenhos
  FOR EACH ROW
  WHEN (NEW.codigo_interno IS NULL)
  EXECUTE FUNCTION gerar_codigo_interno();

-- ─── Descontos ────────────────────────────────────────────────────────────────

CREATE TABLE descontos (
  id           BIGSERIAL   PRIMARY KEY,
  empenho_id   BIGINT      NOT NULL REFERENCES empenhos(id) ON DELETE CASCADE,
  tipo         TEXT,
  codigo       TEXT,
  valor        NUMERIC(15,2) NOT NULL DEFAULT 0,
  efd_codigo   TEXT,
  ord          INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX idx_descontos_empenho ON descontos (empenho_id);

-- ─── Liquidações ──────────────────────────────────────────────────────────────

CREATE TABLE liquidacoes (
  id               BIGSERIAL   PRIMARY KEY,
  empenho_id       BIGINT      NOT NULL REFERENCES empenhos(id) ON DELETE CASCADE,
  valor            NUMERIC(15,2) NOT NULL DEFAULT 0,
  data_liquidacao  DATE,
  data_pagamento   DATE,
  numero_op        TEXT,
  forma_pagamento  TEXT,
  conta            TEXT,
  ord              INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX idx_liquidacoes_empenho ON liquidacoes (empenho_id);

-- ─── Parcelas ─────────────────────────────────────────────────────────────────

CREATE TABLE parcelas (
  id               BIGSERIAL   PRIMARY KEY,
  liquidacao_id    BIGINT      NOT NULL REFERENCES liquidacoes(id) ON DELETE CASCADE,
  valor            NUMERIC(15,2) NOT NULL DEFAULT 0,
  data             DATE,
  forma_pagamento  TEXT,
  conta            TEXT,
  numero_op        TEXT,
  ord              INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX idx_parcelas_liquidacao ON parcelas (liquidacao_id);

-- ─── Config QR (singleton) ────────────────────────────────────────────────────

CREATE TABLE config_qr (
  id          INTEGER     PRIMARY KEY DEFAULT 1,
  campos      TEXT        NOT NULL DEFAULT '',
  separador   TEXT        NOT NULL DEFAULT ';',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT singleton CHECK (id = 1)
);

INSERT INTO config_qr (id, campos, separador)
VALUES (1, 'codigo_interno,numero_ficha,credor_nome,valor_empenho,data_empenho', ';')
ON CONFLICT (id) DO NOTHING;

-- ─── Campos Obrigatórios (singleton) ─────────────────────────────────────────

CREATE TABLE campos_obrigatorios (
  id          INTEGER     PRIMARY KEY DEFAULT 1,
  campos      TEXT        NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT singleton CHECK (id = 1)
);

INSERT INTO campos_obrigatorios (id, campos)
VALUES (1, '')
ON CONFLICT (id) DO NOTHING;

-- ─── Audit Log (imutável) ─────────────────────────────────────────────────────

CREATE TABLE audit_log (
  id           BIGSERIAL   PRIMARY KEY,
  tabela       TEXT        NOT NULL,
  operacao     TEXT        NOT NULL CHECK (operacao IN ('INSERT','UPDATE','DELETE')),
  registro_id  TEXT        NOT NULL,
  dados_antes  JSONB,
  dados_depois JSONB,
  usuario_id   UUID        REFERENCES perfis(id) ON DELETE SET NULL,
  ip           TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tabela_registro ON audit_log (tabela, registro_id);
CREATE INDEX idx_audit_log_usuario         ON audit_log (usuario_id);
CREATE INDEX idx_audit_log_created_at      ON audit_log (created_at DESC);
