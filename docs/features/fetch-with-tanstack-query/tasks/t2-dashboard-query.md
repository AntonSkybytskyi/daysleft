---
id: T2
title: "Define the dashboard query with conservative, identity-scoped config"
layer: "app"
deps: []
acs: []
files_hint: ["src/modules/dashboard/app/dashboard-query.ts"]
owner: "Frontend Lead"
estimate: "M"
status: "todo"
---

# T2 — Define the dashboard query with conservative, identity-scoped config

## Why

Derives from [ADR-0001](../adr/0001-adopt-tanstack-query-conservative-refetch.md) (conservative refetch policy) and [ADR-0002](../adr/0002-scope-cache-by-identity-clear-on-logout.md) (identity-scoped key) — the read endpoint performs a write and returns a one-shot flag, so no automatic revalidation trigger may fire, and the cache must be scoped so one Traveler's identity can never read another's entry.

## What

`src/modules/dashboard/app/dashboard-query.ts`: the query key function (parameterized by the signed-in Traveler's identity), the fetcher (wraps the existing `/api/v1/dashboard` call, no new endpoint), and the query options: `staleTime: Infinity`, `gcTime: Infinity`, `refetchOnWindowFocus: false`, `refetchOnReconnect: false`, `retry: false`.

## Definition of Done

- [ ] unit test asserts the options object sets `staleTime`/`gcTime` to `Infinity`, `refetchOnWindowFocus`/`refetchOnReconnect` to `false`, `retry` to `false`
- [ ] unit test asserts the query key includes the signed-in Traveler's identity
- [ ] lint + vet clean

## Notes

Can start in parallel with T1 (different files). T5/T6 extend this file's logic (confirmation durability, cache clear) — expect overlap.
