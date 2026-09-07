---
id: T13
title: "Add the destinations client query layer (TanStack Query)"
layer: "app"
deps: ["T9", "T10"]
acs: ["AC-11", "AC-14"]
files_hint: ["src/modules/destinations/app/destinations-query.ts"]
owner: "Tech Lead"
estimate: "M"
status: "todo"
---

# T13 — Add the destinations client query layer (TanStack Query)

## Why

Query key, query options and mutations — confirm-then-splice, no optimistic display
([sad.md §8](../sad.md) "Client data"; ADR-0001, ADR-0005).

## What

Add `destinations-query.ts`: query key `["destinations", userId]`, `staleTime`/`gcTime`
`Infinity`, `retry: false`, no refetch on focus/reconnect; mutations for add/remove that only
update the cache in `onSuccess` via `setQueryData`, splicing the confirmed record in (add) or out
(remove); a typed session-invalid error the container (T14) routes on.

## Definition of Done

- [ ] unit tests assert the query key and options match exactly
- [ ] unit tests assert no cache write happens before a mutation's `onSuccess`
- [ ] unit tests assert a `401` response is surfaced as a distinct typed session-invalid error,
      not folded into the generic recoverable-error path
- [ ] lint + vet clean

## Notes

The splice must reproduce the server's ordering rule (recorded order, tie-broken by id) — stated
once at `sad.md §8` "Ordering", implemented here and in T4/T5; T20 verifies the two agree.
