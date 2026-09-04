---
id: T1
title: "Promote staged users migration into the live migrations tree"
layer: "migration"
deps: []
acs: ["AC-01", "AC-03"]
files_hint: ["docs/features/auth-user-plus-dashboard/migrations/01_create_users.up.sql", "docs/features/auth-user-plus-dashboard/migrations/01_create_users.down.sql", "migrations/"]
owner: "Backend Lead"
estimate: "S"
status: "todo"
---

# T1 — Promote staged users migration into the live migrations tree

## Why

The `users` shadow table is the single entity this slice persists ([data-model.md](../data-model.md)); its up/down pair is already staged and just needs promoting into the repo's live migration sequence.

## What

Copy `01_create_users.up.sql` / `.down.sql` from the staged pair into the live `migrations/` tree (renumbered to the next real sequence number if the repo already has migrations), and run it against a local Postgres instance.

## Definition of Done

- [ ] the promoted migration applies cleanly against a fresh database
- [ ] the down migration reverts cleanly, leaving no `users` table or its indexes behind
- [ ] the live migration matches the staged schema exactly: `id TEXT PK`, `email TEXT NOT NULL UNIQUE`, `created_at`/`updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- [ ] lint + vet clean

## Notes

`users.id` is the Clerk-issued id itself, not an app-generated UUIDv7 — this is an explicit override of the repo's default convention, confirmed in [data-model.md](../data-model.md) and backed by [ADR-0001](../adr/0001-use-clerk-for-passwordless-auth.md). Do not add a surrogate key.
