---
id: T7
title: "Add the remove-tracked-destination use case"
layer: "app"
deps: ["T4"]
acs: ["AC-06", "AC-08", "AC-14", "AC-17"]
files_hint: ["src/modules/destinations/app/remove-tracked-destination.ts"]
owner: "Tech Lead"
estimate: "S"
status: "todo"
---

# T7 — Add the remove-tracked-destination use case

## Why

Ownership-scoped hard delete, confirmed before the client updates ([sad.md §6](../sad.md)
"removing a tracked destination"; ADR-0008).

## What

Add `remove-tracked-destination.ts`: given the caller's user id and a tracked-destination id,
delete via the repository's ownership-scoped delete (T4) and return a confirmed-removed result, a
`destinations.not_found` result (same for another owner's/removed/never-existed id), or a distinct
removal-failed result on a lower-level failure (AC-17).

## Definition of Done

- [ ] unit tests assert not-yours, already-removed and never-existed ids all return the same
      `destinations.not_found` result via the same code path (ADR-0008)
- [ ] unit tests assert a successful delete returns a confirmed result
- [ ] unit tests assert a delete failure (distinct from not-found) returns a result the route can
      map to `500`, leaving the row untouched (AC-17)
- [ ] lint + vet clean

## Notes

AC-14 (confirmed invalid sign-in precedence) is enforced one layer up, at the route (T10) —
this use case only runs once the caller's identity is already established.
