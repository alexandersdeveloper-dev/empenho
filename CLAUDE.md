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
- `empenho-mutate` — create/update/delete empenhos (handles descontos + liquidacao sub-records)
- `usuario-mutate` — create/update users (writes to both `perfis` and Supabase Auth)
- `import` — bulk import of Excel/CSV for 6 table types

**Exception — `useExcluirEmpenho`** uses raw `fetch` instead of `supabase.functions.invoke`. Reason: the Supabase JS SDK v2 swallows the actual error body and replaces it with "Edge Function returned a non-2xx status code", making it impossible to show the real validation message to the user. The raw `fetch` pattern reads `res.json()` directly and throws `new Error(json?.error)`.

**Deletion rules** (`empenho-mutate` / `excluir` action): `superadmin` can delete any empenho regardless of payment status. `admin`/`user` are blocked if any `liquidacao` has `data_pagamento` set. `viewer` cannot delete anything.

**`useEmpenho` normalization**: PostgREST returns `liquidacoes[]` (array) but the `Empenho` type has `liquidacao` (singular). The hook normalizes this: `liquidacao: liquidacoes?.[0]`.

**Edge Function error handling** — shared helpers live in `shared/lib/edgeFnError.ts` and are imported by all hooks and pages that call Edge Functions:
- `edgeFnError(err)` extracts the real message from `error.context` (SDK v2 does not propagate the body in `error.message`)
- `handleEdgeFnError(err)` additionally calls `supabase.auth.signOut()` when the message indicates 401/session expired, forcing a redirect to login
- All `onError` callbacks in mutations that invoke Edge Functions must use `edgeFnError` or `handleEdgeFnError` — never `(err as Error).message` directly

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

**Design token rule**: always use custom tokens (`border-line`, `text-ink-*`, `rounded-xl`, `bg-bg-soft`) — never raw Tailwind colors (`border-gray-*`, `text-gray-*`, `bg-green-*`, `bg-red-*`). The only exception is inline style for values not in the token set (e.g. exact hex for status feedback backgrounds).

**Confirmation modals**: destructive or impactful actions must use `ConfirmDeleteModal` (for empenho deletion) or `ConfirmActionModal` (generic, in `shared/components/`) — never `window.confirm()`. `ConfirmActionModal` supports three variants: `danger` (red, irreversible), `warning` (amber/institutional orange, reversible), `info` (institutional blue, safe confirmation).

**Shared UI components** (all in `shared/components/`):
- `PageHeader` — standard page title/description (Fraunces 28px). Use on every route instead of repeating the inline-style block.
- `ConfirmDeleteModal` — specialized delete confirmation for empenhos.
- `ConfirmActionModal` — generic action confirmation with `variant: 'danger' | 'warning' | 'info'`.
- `Combobox` — async typeahead search field used for credor, retenção, EFD.
- `ErrorBoundary` — React error boundary.

**Empty states in tables** — distinguish two cases:
1. *No data at all* → icon + "Nenhum X registrado ainda" + primary CTA button.
2. *Active filters with no results* → magnifier icon + "Nenhum resultado para estes filtros/busca" + "Limpar filtros" link.

**Clickable table rows** — `<tr onClick={...} className="... cursor-pointer">`. Wrap action buttons in `<td onClick={(ev) => ev.stopPropagation()}>` to prevent the row handler from firing on button clicks.

**`EmpenhoQrData`** (in `packages/shared/src/utils.ts`) — all string fields accept `string | null` to be compatible with `Empenho` entity fields which use `string | null` throughout.

`FichaEmpenho.tsx` (PDF/print view) uses inline styles only — no Tailwind classes inside the A4 sheet — for print compatibility. Print CSS in `globals.css` hides `.no-print` elements (sidebar, topbar), resets the `app-layout` grid to `display: block`, and sets `@page { size: A4 portrait; margin: 0 }`. Background colors (institutional stripe) require `print-color-adjust: exact` both in the global print rule and inline on the stripe divs.

### Schemas and validation

`packages/shared/src/schemas.ts` contains Zod schemas for all DTOs. The `dateString` primitive uses `z.preprocess` to convert `''` → `null` before regex validation, which prevents React Hook Form from silently blocking submit on empty date fields.

`EmpenhoSchema` and all mutation DTOs are validated in the Edge Function before any DB write. The frontend also validates via `zodResolver` in React Hook Form.
