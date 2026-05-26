# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend dev server
pnpm dev:web          # http://localhost:5173

# Build all packages (shared must build before web)
pnpm build

# Typecheck (run from root; Turborepo orders shared → web)
pnpm typecheck

# Lint frontend
pnpm lint

# Deploy an Edge Function
npx supabase functions deploy <nome> --project-ref rpxonfwwewefkxhizppx
```

`packages/shared` is a compiled package (`tsup`). After editing `packages/shared/src/**`, run `pnpm build` from root (or `pnpm --filter @ficha-empenho/shared build`) before the web app picks up changes. The compiled JS files (`packages/shared/src/*.js`) must be kept in sync with the TypeScript sources.

## Architecture

**Monorepo** — pnpm workspaces + Turborepo.

```
apps/web/          — React 18 + Vite + TailwindCSS frontend
packages/shared/   — Zod schemas, TypeScript types, utility functions (shared between web and Edge Functions)
supabase/
  functions/       — Deno Edge Functions (empenho-mutate, usuario-mutate, import)
  migrations/      — SQL files applied in the Supabase dashboard
```

### Frontend (`apps/web/src`)

Navigation is handled entirely in `app/MainLayout.tsx` via a `Route` union type — there is **no router library**. `App.tsx` guards auth; authenticated users go to `MainLayout`, unauthenticated users see `AuthPage`.

Feature folders under `features/`:
- `empenhos/` — list, form, ficha (PDF/print view), and all TanStack Query hooks in `hooks/useEmpenhos.ts`
- `auth/`, `import/`, `audit/`, `config/` — each is a single page component

Shared utilities under `shared/`:
- `lib/supabaseClient.ts` — singleton Supabase JS client
- `lib/authStore.ts` — Zustand store holding the authenticated `Perfil`
- `components/` — reusable UI (Combobox, ConfirmDeleteModal, ErrorBoundary)

### Data layer

**Simple reads** (lists, lookups) go directly through PostgREST via `supabase.from(...)` inside TanStack Query hooks.

**Mutations with business logic** go through Edge Functions via `supabase.functions.invoke(...)`:
- `empenho-mutate` — create/update empenhos (handles descontos + liquidacao sub-records)
- `usuario-mutate` — create/update users (writes to both `perfis` and Supabase Auth)
- `import` — bulk import of Excel/CSV for 6 table types

**`useEmpenho` normalization**: PostgREST returns `liquidacoes[]` (array) but the `Empenho` type has `liquidacao` (singular). The hook normalizes this: `liquidacao: liquidacoes?.[0]`.

### Supabase / Migrations

Migrations are **not auto-applied** — paste each `.sql` file into the Supabase SQL Editor manually. The files in `supabase/migrations/` are ordered by filename prefix but note: `003_security_hardening.sql` was added after `004_audit_triggers.sql`. Correct apply order:

```
001_schema_inicial.sql
002_rls_policies.sql
003_auth_trigger.sql
004_audit_triggers.sql
003_security_hardening.sql   ← applied last despite lower number; supersedes parts of 004
```

`003_security_hardening.sql` replaces `fn_audit_trigger()` (from 004) with an improved `registrar_audit()` that:
- Supports `set_audit_context()` so Edge Functions (which use `service_role`, so `auth.uid()` is NULL) can still attribute audit entries to the correct user
- Wraps the INSERT in `EXCEPTION WHEN OTHERS THEN NULL` so an audit failure never blocks the main operation

**Pattern: audit context in Edge Functions** — after loading the `perfil` row and before any DB mutation, all three Edge Functions call:
```ts
await supabaseAdmin.rpc('set_audit_context', { p_user_id: perfil.id, p_user_nome: perfil.nome });
```

### Supabase Edge Functions (Deno)

Edge Functions use `https://esm.sh/` for npm packages. Auth is validated by decoding the JWT from `Authorization` header and checking `role` in the `perfis` table. CORS headers must be returned on `OPTIONS` preflight.

**CORS**: All three functions read `ALLOWED_ORIGINS` from `Deno.env.get('ALLOWED_ORIGINS')` and return per-request `Access-Control-Allow-Origin` + `Vary: Origin`. Set this secret in Supabase Dashboard → Edge Functions → Secrets. Leave unset (or empty) during local dev to fall back to `*`.

**Role hierarchy**: `superadmin > admin > user > viewer`. In `usuario-mutate`, the `ROLES_ABAIXO` map enforces that a user can only create/assign roles strictly below their own level. Admins are scoped to their `departamento_id`; superadmins are cross-department.

**SheetJS CVE note** (`import` function): `xlsx@0.18.5` (esm.sh) has CVE-2023-30533 (prototype pollution). The fix version (0.20.x) is only available on cdn.sheetjs.com which is blocked by the Supabase bundler. Mitigated by: admin-only upload endpoint + file size limit + MIME/extension validation.

### Design system

Tailwind custom tokens defined in `apps/web/tailwind.config.js`:
- **Colors**: `ink-{900,700,500,400,300}`, `line`, `bg-soft`, `accent-{blue,orange,yellow,red}`
- **Fonts**: `font-sans` = Manrope, `font-mono` = IBM Plex Mono, `font-display` = Fraunces
- **Institutional stripe**: 4 colors of the gestão — blue `#3ea3ff` / orange `#b86a2b` / yellow `#ffb829` / red `#ea4242`

`FichaEmpenho.tsx` (PDF/print view) uses inline styles only — no Tailwind classes inside the A4 sheet — for print compatibility.

### Schemas and validation

`packages/shared/src/schemas.ts` contains Zod schemas for all DTOs. The `dateString` primitive uses `z.preprocess` to convert `''` → `null` before regex validation, which prevents React Hook Form from silently blocking submit on empty date fields.

`EmpenhoSchema` and all mutation DTOs are validated in the Edge Function before any DB write. The frontend also validates via `zodResolver` in React Hook Form.
