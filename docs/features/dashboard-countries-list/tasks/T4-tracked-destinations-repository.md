---
id: T4
title: "Add the TrackedDestinationsRepository and its dependency builder"
layer: "infra"
deps: ["T1", "T2"]
acs: ["AC-01", "AC-03", "AC-06", "AC-08", "AC-17"]
files_hint: ["src/modules/destinations/infra/tracked-destinations-repository.ts", "src/modules/destinations/infra/destinations-deps.ts"]
owner: "Tech Lead"
estimate: "M"
status: "todo"
---

# T4 — Add the TrackedDestinationsRepository and its dependency builder

## Why

Drizzle-only persistence behind an injected repository, mirroring `UsersRepository`
([sad.md §8](../sad.md) "Persistence"; [data-model.md](../data-model.md) access patterns).

## What

Add `TrackedDestinationsRepository` (insert, ownership-scoped get-by-id, ownership-scoped delete,
list-by-owner-in-recorded-order) in `src/modules/destinations/infra/tracked-destinations-repository.ts`,
and `buildDestinationsDeps(db)` in `destinations-deps.ts`, mirroring `buildSessionDeps`.

## Definition of Done

- [ ] integration tests (pglite) assert insert stores a row with the given id/user/reference
- [ ] integration tests assert get-by-id scoped to owner returns zero rows for another owner's id,
      a removed id, and a never-existed id — the same query shape in all three (ADR-0008)
- [ ] integration tests assert delete is ownership-scoped the same way
- [ ] integration tests assert list returns rows ordered by `created_at` then `id` (data-model.md
      access pattern, AC-03)
- [ ] lint + vet clean

## Notes

Depends on T1 (schema) and T2 (id helper import used by callers, though the repository itself
takes an id rather than generating one). No index beyond the PK is added for by-id lookups
(data-model.md).
