---
id: T8
title: "Add the get-tracked-destination-by-id use case"
layer: "app"
deps: ["T4"]
acs: ["AC-05", "AC-06", "AC-16"]
files_hint: ["src/modules/destinations/app/get-tracked-destination.ts"]
owner: "Tech Lead"
estimate: "S"
status: "todo"
---

# T8 — Add the get-tracked-destination-by-id use case

## Why

Resolves a saved address to one record, or nothing, through the same ownership-scoped path
regardless of why it misses ([sad.md §6](../sad.md) "resolving a saved address"; ADR-0008).

## What

Add `get-tracked-destination.ts`: given the caller's user id and a tracked-destination id, return
the record via the repository's ownership-scoped get-by-id (T4), or a `destinations.not_found`
result — one query, one answer, no early exit on the identifier's shape.

## Definition of Done

- [ ] unit tests assert the owner's own record is returned
- [ ] unit tests assert another owner's record, a removed one, and a never-existed one all return
      the identical `destinations.not_found` result via the identical code path
- [ ] lint + vet clean

## Notes

Not named in `sad.md §5`'s file tree explicitly, but required by the `GET
/api/v1/destinations/{trackedDestinationId}` contract endpoint; it reuses the same
ownership-scoped repository method T7 uses for delete, so the two share the indistinguishability
guarantee rather than each re-implementing it.
