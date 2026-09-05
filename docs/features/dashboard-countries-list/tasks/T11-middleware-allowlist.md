---
id: T11
title: "Register the new routes in the middleware allowlist"
layer: "wiring"
deps: ["T9", "T10"]
acs: ["AC-13"]
files_hint: ["src/middleware.ts"]
owner: "Tech Lead"
estimate: "S"
status: "todo"
---

# T11 — Register the new routes in the middleware allowlist

## Why

`src/middleware.ts` uses a narrow allowlist matcher — any route this feature adds is
unauthenticated until listed ([sad.md §2](../sad.md) Constraints).

## What

Add `/api/v1/destinations` and `/api/v1/destinations/:path*` to `config.matcher` in
`src/middleware.ts`.

## Definition of Done

- [ ] a middleware or e2e test confirms an unauthenticated request to either path is rejected
      before reaching the route handler (AC-13)
- [ ] a signed-in request to either path reaches the handler
- [ ] lint + vet clean

## Notes

`/dashboard/:path*` already covers the detail page (ADR-0002) — only the API paths are new here.
