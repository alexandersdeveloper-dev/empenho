# Sistema de Fichas de Empenho — Plataforma Institucional

Prefeitura Municipal de Parintins · Sistema online multiusuário

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Supabase Edge Functions (Deno) |
| Banco | Supabase (PostgreSQL 15) |
| Monorepo | pnpm workspaces + Turborepo |
| CI/CD | GitHub Actions → Vercel (Web) |

## Estrutura

```
apps/
  web/     — React frontend
packages/
  shared/  — Zod schemas, tipos e utilitários compartilhados
supabase/
  functions/     — Edge Functions (empenho-mutate, usuario-mutate, import)
  migrations/    — SQL migrations (schema, RLS, triggers)
scripts/
  migrar-sqlite-supabase.js   — migração de dados do sistema legado
```

## Início rápido

### 1. Pré-requisitos

- Node.js 20+
- pnpm 9+
- Conta no Supabase (crie em supabase.com)

### 2. Instalar dependências

```bash
pnpm install
```

### 3. Configurar variáveis de ambiente

```bash
cp apps/web/.env.example apps/web/.env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
```

### 4. Aplicar migrations no Supabase

No painel Supabase (SQL Editor), execute em ordem:
1. `supabase/migrations/001_schema_inicial.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_auth_trigger.sql`
4. `supabase/migrations/004_audit_triggers.sql`

### 5. Migrar dados do sistema legado (opcional)

```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
SQLITE_PATH=../ficha-empenho/data/empenhos.db \
node scripts/migrar-sqlite-supabase.js
```

### 6. Executar em desenvolvimento

```bash
pnpm dev:web   # http://localhost:5173
```

## Roles (RBAC)

| Role | Permissões |
|------|-----------|
| `superadmin` | Tudo + todos os departamentos |
| `admin` | Tudo no próprio departamento + imports + config |
| `user` | Criar/editar empenhos do próprio departamento |
| `viewer` | Somente leitura |

## Migração de Usuários

O sistema legado usa login/senha simples (sem e-mail). Para migrar:

1. Execute o script de migração — ele gera `usuarios_para_migrar.json`
2. Crie cada usuário no Supabase Auth com o e-mail sugerido
3. Preencha `supabase_uuid` no JSON
4. Execute o script novamente para vincular os empenhos

## Deploy

- **Web (Vercel):** push automático via GitHub Actions
- **Edge Functions:** `npx supabase functions deploy <nome> --project-ref <ref>`
