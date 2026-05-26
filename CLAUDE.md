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

### Supabase Edge Functions (Deno)

Edge Functions use `https://esm.sh/` for npm packages. Auth is validated by decoding the JWT from `Authorization` header and checking `role` in the `perfis` table. CORS headers must be returned on `OPTIONS` preflight.

### Design system

Tailwind custom tokens defined in `apps/web/tailwind.config.js`:
- **Colors**: `ink-{900,700,500,400,300}`, `line`, `bg-soft`, `accent-{blue,orange,yellow,red}`
- **Fonts**: `font-sans` = Manrope, `font-mono` = IBM Plex Mono, `font-display` = Fraunces
- **Institutional stripe**: 4 colors of the gestão — blue `#3ea3ff` / orange `#b86a2b` / yellow `#ffb829` / red `#ea4242`

`FichaEmpenho.tsx` (PDF/print view) uses inline styles only — no Tailwind classes inside the A4 sheet — for print compatibility.

### Schemas and validation

`packages/shared/src/schemas.ts` contains Zod schemas for all DTOs. The `dateString` primitive uses `z.preprocess` to convert `''` → `null` before regex validation, which prevents React Hook Form from silently blocking submit on empty date fields.

`EmpenhoSchema` and all mutation DTOs are validated in the Edge Function before any DB write. The frontend also validates via `zodResolver` in React Hook Form.
