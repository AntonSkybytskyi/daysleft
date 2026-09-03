---
id: T9
title: "Add return-to origin validation and the unauthenticated-dashboard redirect path"
layer: "wiring"
deps: ["T6"]
acs: ["AC-04", "AC-05"]
files_hint: ["src/modules/dashboard/app/return-to.ts", "src/middleware.ts"]
owner: "Backend Lead"
estimate: "S"
status: "todo"
---

# T9 — Add return-to origin validation and the unauthenticated-dashboard redirect path

## Why

Closes the open-redirect abuse case named in [spec §6.1](../spec.md) and implements [sad.md §6 flow 5](../sad.md) ([AC-04](../spec.md)): an unauthenticated visitor is redirected to login with the originally requested page preserved, and returned there — but only when that destination shares this app's own origin.

## What

A `validateReturnTo(url)` function: resolves the candidate URL and accepts it only if its scheme, host, and port match this app's own origin, otherwise discards it in favor of the default dashboard destination. Wired into the redirect path that fires on a 401 from T7 (dashboard) with `details.return_to`.

## Definition of Done

- [ ] unit test: a same-origin relative path (e.g. `/dashboard`) is preserved
- [ ] unit test: an absolute same-origin URL is preserved
- [ ] unit test: a cross-origin URL (different scheme, host, or port) is discarded, falling back to the default dashboard destination
- [ ] integration test: an unauthenticated dashboard request round-trips through login and lands back on the originally requested page in the same browser (AC-04)
- [ ] lint + vet clean
