---
id: T1
title: "Add TanStack Query dependency and root provider"
layer: "wiring"
deps: []
acs: []
files_hint: ["package.json", "src/app/layout.tsx"]
owner: "Frontend Lead"
estimate: "S"
status: "todo"
---

# T1 — Add TanStack Query dependency and root provider

## Why

Derives from [ADR-0001](../adr/0001-adopt-tanstack-query-conservative-refetch.md) and [sad §5](../sad.md) — the query-client provider must sit above every component that uses it, so it's added to the existing root layout next to `ClerkProvider`.

## What

Add `@tanstack/react-query` to `package.json`. In `src/app/layout.tsx`, create a `QueryClient` instance and wrap `children` in a `QueryClientProvider`, nested inside the existing `ClerkProvider`. No other file changes.

## Definition of Done

- [ ] `package.json` lists `@tanstack/react-query`
- [ ] the app renders under `QueryClientProvider` inside `ClerkProvider` with no runtime error
- [ ] lint + vet clean

## Notes

Foundational task — no spec AC directly, enables T2/T3. Can start in parallel with T2 (different files).
