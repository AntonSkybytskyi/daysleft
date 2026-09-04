# daysleft — conventions

Stack: TypeScript, Next.js 14 (App Router), React, Tailwind CSS, Drizzle ORM + drizzle-kit,
PostgreSQL, Dexie (IndexedDB) for offline cache. Package manager: pnpm.

## Module structure

Feature-first modules under `src/modules/<name>/`, each owning its own UI, app logic, and data
access. No shared "components/services/hooks" grab-bag folders. Shared UI primitives live in
`src/modules/ui/` once established.

## Conventions

- **Error handling:** unified error envelope `{ error: { code, message } }` from all API routes;
  thrown `AppError` subclasses mapped to it at the route boundary.
- **IDs:** UUIDv7 generated app-side (time-sortable, safe for offline-created records to merge on
  sync).
- **Persistence:** Drizzle ORM only, no raw SQL outside `src/db/`. DB is dumb storage — domain
  logic stays in modules.
- **Migrations:** `drizzle-kit generate` under `drizzle/`, one migration per schema change,
  forward + down.
- **Tests:** Vitest for unit/component tests colocated as `*.test.ts(x)` next to source;
  Playwright e2e under `e2e/`.
- **Inter-module communication:** direct TypeScript imports; `sync` module is the only one
  crossing the offline/online boundary.
- **UI / styling:** Tailwind CSS utility classes only, no CSS-in-JS.

## Commands

- `pnpm build` — Next.js production build
- `pnpm test` — Vitest unit/component tests
- `pnpm test:e2e` — Playwright e2e tests
- `pnpm lint` — eslint + `tsc --noEmit`
- `pnpm db:generate` — generate a Drizzle migration from `src/db/schema.ts`
