---
id: T1
title: "Promote the staged tracked_destinations migration and schema"
layer: "migration"
deps: []
acs: ["AC-01", "AC-02", "AC-03", "AC-06", "AC-08", "AC-09", "AC-17"]
files_hint: ["docs/features/dashboard-countries-list/migrations/01_create_tracked_destinations.up.sql", "docs/features/dashboard-countries-list/migrations/01_create_tracked_destinations.down.sql", "src/db/schema.ts"]
owner: "Tech Lead"
estimate: "S"
status: "todo"
---

# T1 — Promote the staged tracked_destinations migration and schema

## Why

Every read and write in this feature rests on the `tracked_destinations` table. Derives from
[data-model.md](../data-model.md) and the staged migration pair it produced.

## What

Promote the staged `docs/features/dashboard-countries-list/migrations/01_create_tracked_destinations.{up,down}.sql`
into the live `migrations/` tree, and add the `tracked_destinations` table (matching
[data-model.md](../data-model.md)'s columns and the `idx_tracked_destinations_user_created` index)
to `src/db/schema.ts` so Drizzle's repository layer (T4) can import it.

## Definition of Done

- [ ] `pnpm db:up` applies the migration cleanly against a fresh database
- [ ] `pnpm db:down` reverts it cleanly
- [ ] `src/db/schema.ts` exports a `trackedDestinations` table matching data-model.md's columns and index
- [ ] lint + vet clean

## Notes

No `CHECK` constraint on `destination_ref` — the catalogue refusal is app-enforced (ADR-0006).
No `UNIQUE` on `(user_id, destination_ref)` — repeated records are legitimate by design (AC-01).
