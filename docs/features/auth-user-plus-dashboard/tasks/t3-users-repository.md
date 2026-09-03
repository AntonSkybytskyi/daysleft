---
id: T3
title: "Build the Drizzle repository for the users shadow table"
layer: "infra"
deps: ["T1", "T2"]
acs: ["AC-01", "AC-03"]
files_hint: ["src/modules/auth/infra/users-repository.ts"]
owner: "Backend Lead"
estimate: "M"
status: "todo"
---

# T3 — Build the Drizzle repository for the users shadow table

## Why

[sad.md §5](../sad.md) assigns `auth/infra/` the Drizzle repository for the `users` shadow table; [data-model.md](../data-model.md) names the access patterns this repository must serve: webhook upsert by Clerk id, and the email-uniqueness lookup.

## What

Repository functions: `findByEmail(email)`, `findById(id)`, `upsert({ id, email })` (insert-or-update on the `id` primary key, per [data-model.md](../data-model.md) indexes). Uses Drizzle only, no raw SQL, per `architecture-map.md` conventions.

## Definition of Done

- [ ] integration test: `upsert` creates a new row, then updates `email`/`updated_at` on a second call with the same `id`
- [ ] integration test: `findByEmail` returns the row when it exists and `null`/undefined when it doesn't
- [ ] integration test: `upsert` with a duplicate `email` under a different `id` surfaces the UNIQUE(email) conflict rather than silently succeeding
- [ ] lint + vet clean

## Notes

Depends on T1 (the live table must exist) and T2 (the verified-email value this repository is called with). Shares no files with T2/T1 — parallel-safe once both land.
