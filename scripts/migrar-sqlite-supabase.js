#!/usr/bin/env node
/**
 * Script de migração: SQLite (sistema legado) → Supabase PostgreSQL
 *
 * Uso:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   SQLITE_PATH=../ficha-empenho/data/empenhos.db \
 *   node scripts/migrar-sqlite-supabase.js
 *
 * O script migra na seguinte ordem (respeitando FK):
 *   1. departamentos    (criado padrão se não existir)
 *   2. credores
 *   3. classificacao_orcamentaria
 *   4. subelementos
 *   5. retencoes
 *   6. formas_pagamento
 *   7. efd
 *   8. empenhos         (mapeando usuario legado para UUID fictício)
 *   9. descontos
 *  10. liquidacoes
 *  11. parcelas
 *  12. config_qr
 *  13. campos_obrigatorios
 *
 * Usuários: o sistema legado usa login/senha bcrypt, sem e-mail.
 * O Supabase Auth exige e-mail. A estratégia é criar usuários manualmente
 * no Supabase e depois vincular os IDs. Este script exporta os usuários
 * para um arquivo JSON para referência.
 */

import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SQLITE_PATH = process.env.SQLITE_PATH ?? '../ficha-empenho/data/empenhos.db';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = new Database(resolve(SQLITE_PATH), { readonly: true });

// ─── Utilidades ───────────────────────────────────────────────────────────────

function log(step, msg) {
  console.log(`[${step}] ${msg}`);
}

async function upsert(table, rows, conflictColumn = 'id') {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, {
    onConflict: conflictColumn,
    ignoreDuplicates: false,
  });
  if (error) throw new Error(`Erro ao inserir em ${table}: ${error.message}`);
}

function normalizarNatureza(s) {
  if (!s || typeof s !== 'string') return '';
  const parts = String(s).trim().split('.').filter(Boolean);
  if (parts.length < 4) return String(s).trim();
  return (
    parts[0] + '.' + parts[1] + '.' +
    String(parts[2]).padStart(2, '0') + '.' +
    String(parts[3]).padStart(2, '0')
  );
}

// ─── 0. Exportar usuários legados para referência manual ─────────────────────

function exportarUsuarios() {
  const usuarios = db.prepare('SELECT id, nome, login, admin, ativo FROM usuarios').all();
  const output = usuarios.map((u) => ({
    ...u,
    email_sugerido: `${u.login.toLowerCase().replace(/\s+/g, '.')}@parintins.am.gov.br`,
    role: u.admin === 1 ? 'admin' : 'user',
    note: 'Crie este usuário no Supabase Auth e adicione o UUID aqui',
    supabase_uuid: null,
  }));
  writeFileSync('usuarios_para_migrar.json', JSON.stringify(output, null, 2));
  log('0', `${usuarios.length} usuários exportados → usuarios_para_migrar.json`);
  log('0', 'Crie os usuários no Supabase Auth e preencha supabase_uuid antes de prosseguir.');
  return output;
}

// ─── 1. Departamento padrão ───────────────────────────────────────────────────

async function migrarDepartamentoDefault() {
  const { data, error } = await supabase
    .from('departamentos')
    .upsert({ id: 1, nome: 'Departamento Padrão', sigla: 'GERAL', ativo: true }, { onConflict: 'id' })
    .select('id')
    .single();
  if (error) throw error;
  log('1', `Departamento padrão garantido (id=${data.id})`);
  return data.id;
}

// ─── 2. Credores ──────────────────────────────────────────────────────────────

async function migrarCredores() {
  const rows = db.prepare('SELECT id, numero, nome, created_at FROM credores').all();
  await upsert('credores', rows.map((r) => ({
    id: r.id,
    numero: r.numero || null,
    nome: r.nome,
    created_at: r.created_at,
  })));
  log('2', `${rows.length} credores migrados`);
}

// ─── 3. Classificação Orçamentária ───────────────────────────────────────────

async function migrarClassificacao() {
  const rows = db.prepare(
    'SELECT id, numero_ficha, projeto_atividade, dotacao, stn, created_at FROM classificacao_orcamentaria'
  ).all();
  await upsert('classificacao_orcamentaria', rows.map((r) => ({
    id: r.id,
    numero_ficha: r.numero_ficha,
    projeto_atividade: r.projeto_atividade || null,
    dotacao: r.dotacao || null,
    stn: r.stn || null,
    created_at: r.created_at,
  })), 'numero_ficha');
  log('3', `${rows.length} classificações migradas`);
}

// ─── 4. Subelementos ──────────────────────────────────────────────────────────

async function migrarSubelementos() {
  const rows = db.prepare(
    'SELECT id, natureza, sub, descricao, created_at FROM subelementos'
  ).all();
  await upsert('subelementos', rows.map((r) => ({
    id: r.id,
    natureza: normalizarNatureza(r.natureza),
    sub: String(r.sub || '').padStart(2, '0'),
    descricao: r.descricao || null,
    created_at: r.created_at,
  })));
  log('4', `${rows.length} subelementos migrados`);
}

// ─── 5. Retenções ─────────────────────────────────────────────────────────────

async function migrarRetencoes() {
  const rows = db.prepare('SELECT id, nome, codigo, created_at FROM retencoes').all();
  await upsert('retencoes', rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    codigo: r.codigo,
    created_at: r.created_at,
  })));
  log('5', `${rows.length} retenções migradas`);
}

// ─── 6. Formas de Pagamento ───────────────────────────────────────────────────

async function migrarFormasPagamento() {
  const rows = db.prepare('SELECT id, codigo, descricao, created_at FROM formas_pagamento').all();
  await upsert('formas_pagamento', rows.map((r) => ({
    id: r.id,
    codigo: r.codigo,
    descricao: r.descricao || null,
    created_at: r.created_at,
  })), 'codigo');
  log('6', `${rows.length} formas de pagamento migradas`);
}

// ─── 7. EFD ──────────────────────────────────────────────────────────────────

async function migrarEfd() {
  // Tabela efd pode não existir no banco legado
  try {
    const rows = db.prepare('SELECT id, codigo, descricao, created_at FROM efd').all();
    if (rows.length) {
      await upsert('efd', rows.map((r) => ({
        id: r.id,
        codigo: r.codigo,
        descricao: r.descricao || null,
        created_at: r.created_at,
      })), 'codigo');
      log('7', `${rows.length} códigos EFD migrados`);
    } else {
      log('7', 'Tabela EFD vazia ou inexistente — pulando');
    }
  } catch {
    log('7', 'Tabela EFD não existe no banco legado — pulando');
  }
}

// ─── 8. Empenhos ──────────────────────────────────────────────────────────────

async function migrarEmpenhos(departamentoId, usuarioMap) {
  const rows = db.prepare(`
    SELECT id, numero_ficha, projeto_atividade, dotacao, stn,
           subelemento_codigo, subelemento_descricao,
           credor_id, credor_numero, credor_nome,
           tipo_empenho, historico, valor_empenho,
           emenda, exercicio, numero_contrato, numero_convenio,
           data_empenho, usuario_id, usuario_nome, codigo_interno,
           created_at, updated_at
    FROM empenhos
    ORDER BY id ASC
  `).all();

  // Migra em lotes de 100 para não exceder limites da API
  const BATCH = 100;
  let total = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH).map((r) => ({
      id: r.id,
      codigo_interno: r.codigo_interno || `E${String(r.id).padStart(6, '0')}`,
      departamento_id: departamentoId,
      numero_ficha: r.numero_ficha || null,
      projeto_atividade: r.projeto_atividade || null,
      dotacao: r.dotacao || null,
      stn: r.stn || null,
      subelemento_codigo: r.subelemento_codigo ? String(r.subelemento_codigo).padStart(2, '0') : null,
      subelemento_descricao: r.subelemento_descricao || null,
      credor_id: r.credor_id || null,
      credor_numero: r.credor_numero || null,
      credor_nome: r.credor_nome || null,
      tipo_empenho: r.tipo_empenho || 1,
      historico: r.historico || null,
      valor_empenho: r.valor_empenho || 0,
      emenda: r.emenda || null,
      exercicio: r.exercicio || 1,
      numero_contrato: r.numero_contrato || null,
      numero_convenio: r.numero_convenio || null,
      data_empenho: r.data_empenho || null,
      usuario_id: usuarioMap[r.usuario_id] || null,
      usuario_nome: r.usuario_nome || null,
      created_at: r.created_at,
      updated_at: r.updated_at || r.created_at,
    }));
    await upsert('empenhos', batch, 'id');
    total += batch.length;
    log('8', `  ${total}/${rows.length} empenhos migrados...`);
  }
  log('8', `${rows.length} empenhos migrados`);
}

// ─── 9. Descontos ─────────────────────────────────────────────────────────────

async function migrarDescontos() {
  // Verifica se efd_codigo existe na tabela legada
  const cols = db.prepare("PRAGMA table_info(descontos)").all().map((c) => c.name);
  const hasEfd = cols.includes('efd_codigo');

  const query = hasEfd
    ? 'SELECT id, empenho_id, tipo, codigo, valor, efd_codigo, ord FROM descontos ORDER BY empenho_id, ord'
    : 'SELECT id, empenho_id, tipo, codigo, valor, NULL as efd_codigo, ord FROM descontos ORDER BY empenho_id, ord';

  const rows = db.prepare(query).all();
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH).map((r) => ({
      id: r.id,
      empenho_id: r.empenho_id,
      tipo: r.tipo || null,
      codigo: r.codigo || null,
      valor: r.valor || 0,
      efd_codigo: r.efd_codigo || null,
      ord: r.ord || 0,
    }));
    await upsert('descontos', batch);
  }
  log('9', `${rows.length} descontos migrados`);
}

// ─── 10. Liquidações ──────────────────────────────────────────────────────────

async function migrarLiquidacoes() {
  const cols = db.prepare("PRAGMA table_info(liquidacoes)").all().map((c) => c.name);
  const hasConta = cols.includes('conta');
  const query = hasConta
    ? 'SELECT id, empenho_id, valor, data_liquidacao, data_pagamento, numero_op, forma_pagamento, conta, ord FROM liquidacoes'
    : 'SELECT id, empenho_id, valor, data_liquidacao, data_pagamento, numero_op, forma_pagamento, NULL as conta, ord FROM liquidacoes';

  const rows = db.prepare(query).all();
  await upsert('liquidacoes', rows.map((r) => ({
    id: r.id,
    empenho_id: r.empenho_id,
    valor: r.valor || 0,
    data_liquidacao: r.data_liquidacao || null,
    data_pagamento: r.data_pagamento || null,
    numero_op: r.numero_op || null,
    forma_pagamento: r.forma_pagamento || null,
    conta: r.conta || null,
    ord: r.ord || 0,
  })));
  log('10', `${rows.length} liquidações migradas`);
}

// ─── 11. Parcelas ─────────────────────────────────────────────────────────────

async function migrarParcelas() {
  const rows = db.prepare(
    'SELECT id, liquidacao_id, valor, data, forma_pagamento, conta, numero_op, ord FROM parcelas'
  ).all();
  await upsert('parcelas', rows.map((r) => ({
    id: r.id,
    liquidacao_id: r.liquidacao_id,
    valor: r.valor || 0,
    data: r.data || null,
    forma_pagamento: r.forma_pagamento || null,
    conta: r.conta || null,
    numero_op: r.numero_op || null,
    ord: r.ord || 0,
  })));
  log('11', `${rows.length} parcelas migradas`);
}

// ─── 12. Config QR ────────────────────────────────────────────────────────────

async function migrarConfigQr() {
  const row = db.prepare('SELECT campos, separador FROM config_qr WHERE id = 1').get();
  if (row) {
    await upsert('config_qr', [{
      id: 1,
      campos: row.campos || '',
      separador: row.separador || ';',
    }]);
    log('12', 'Config QR migrada');
  }
}

// ─── 13. Campos Obrigatórios ─────────────────────────────────────────────────

async function migrarCamposObrigatorios() {
  const row = db.prepare('SELECT campos FROM campos_obrigatorios WHERE id = 1').get();
  if (row) {
    await upsert('campos_obrigatorios', [{
      id: 1,
      campos: row.campos || '',
    }]);
    log('13', 'Campos obrigatórios migrados');
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Migração SQLite → Supabase ===\n');

  // Etapa 0: exportar usuários para criação manual
  const usuarios = exportarUsuarios();

  // Verificar se o arquivo de mapeamento de UUIDs existe
  let usuarioMap = {};
  try {
    const mapFile = JSON.parse(readFileSync('usuarios_para_migrar.json', 'utf8'));
    usuarioMap = Object.fromEntries(
      mapFile
        .filter((u) => u.supabase_uuid)
        .map((u) => [u.id, u.supabase_uuid])
    );
    const mapeados = Object.keys(usuarioMap).length;
    log('0', `${mapeados}/${usuarios.length} usuários com UUID mapeado`);
    if (mapeados === 0) {
      log('0', '⚠️  Nenhum usuário mapeado. Os empenhos não terão usuario_id.');
    }
  } catch {
    log('0', 'usuarios_para_migrar.json não encontrado. Empenhos sem usuario_id.');
  }

  const deptId = await migrarDepartamentoDefault();
  await migrarCredores();
  await migrarClassificacao();
  await migrarSubelementos();
  await migrarRetencoes();
  await migrarFormasPagamento();
  await migrarEfd();
  await migrarEmpenhos(deptId, usuarioMap);
  await migrarDescontos();
  await migrarLiquidacoes();
  await migrarParcelas();
  await migrarConfigQr();
  await migrarCamposObrigatorios();

  console.log('\n=== Migração concluída com sucesso! ===\n');
  db.close();
}

main().catch((err) => {
  console.error('\n[ERRO]', err.message);
  process.exit(1);
});
