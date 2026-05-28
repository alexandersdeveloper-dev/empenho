-- Migration 005: Novos tipos de empenho (Sub-Empenho, Despesa Extra, Receita Extra)
-- Adiciona colunas para dados exclusivos dos tipos 4, 5 e 6.
-- Aplique este arquivo no Supabase SQL Editor após 003_security_hardening.sql.

ALTER TABLE empenhos
  ADD COLUMN IF NOT EXISTS fonte_recurso        text,
  ADD COLUMN IF NOT EXISTS ficha_extra_codigo   text,
  ADD COLUMN IF NOT EXISTS ficha_extra_descricao text;

COMMENT ON COLUMN empenhos.fonte_recurso         IS 'Fonte de recurso — preenchido para Sub-Empenho (tipo 4)';
COMMENT ON COLUMN empenhos.ficha_extra_codigo    IS 'Código da ficha extra — preenchido para Despesa Extra (tipo 5) e Receita Extra (tipo 6)';
COMMENT ON COLUMN empenhos.ficha_extra_descricao IS 'Descrição da ficha extra — preenchido para Despesa Extra (tipo 5) e Receita Extra (tipo 6)';
